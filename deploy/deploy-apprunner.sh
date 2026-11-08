#!/usr/bin/env bash
# Build the viral-images image for linux/amd64, push it to Amazon ECR and
# deploy it to the existing AWS App Runner service. See deploy/README.md.
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-2}"
ECR_REPOSITORY="${ECR_REPOSITORY:-l4cch/viral-images}"
APPRUNNER_SERVICE="${APPRUNNER_SERVICE:-viral-images-app}"
APP_URL="${APP_URL:-https://viral-images.org}"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS:-1200}"
export AWS_REGION AWS_PAGER=""

usage() {
  cat <<EOF
Usage: deploy/deploy-apprunner.sh [--check | --skip-build | --rollback <tag>] [--yes]

  (no option)       Build linux/amd64, push :<git-sha> and :latest, deploy, wait, smoke test
  --check           Read-only: verify AWS access, the service and the current image, then exit
  --skip-build      Redeploy the image currently tagged :latest
  --rollback <tag>  Point :latest at an earlier image tag (e.g. a git sha) and deploy it
  -y, --yes         Don't ask for confirmation when deploying uncommitted changes
  -h, --help        Show this help

Configuration (environment variables):
  AWS_PROFILE              AWS CLI profile to use (optional)
  AWS_REGION               default: us-east-2
  ECR_REPOSITORY           default: l4cch/viral-images
  APPRUNNER_SERVICE        default: viral-images-app
  APP_URL                  default: https://viral-images.org
  DEPLOY_TIMEOUT_SECONDS   default: 1200
EOF
}

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33mWarning: %s\033[0m\n' "$*" >&2; }
die() { printf '\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }

mode=build
rollback_tag=""
assume_yes=false
while (($#)); do
  case "$1" in
    --check) mode=check ;;
    --skip-build) mode=skip ;;
    --rollback)
      [[ $# -ge 2 ]] || die "--rollback needs an image tag"
      mode=rollback
      rollback_tag=$2
      shift
      ;;
    -y | --yes) assume_yes=true ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
  shift
done

# Run from the repository root (the Docker build context)
cd "$(dirname "$0")/.."

for cmd in aws docker git curl python3; do
  command -v "$cmd" >/dev/null || die "'$cmd' is required"
done

# Prints the CPU architecture of an image tag in ECR (e.g. amd64).
image_arch() {
  local manifest config_digest url
  manifest=$(aws ecr batch-get-image --repository-name "$ECR_REPOSITORY" \
    --image-ids "imageTag=$1" --query 'images[0].imageManifest' --output text)
  [[ -n $manifest && $manifest != None ]] || return 1
  config_digest=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["config"]["digest"])' <<<"$manifest") || return 1
  url=$(aws ecr get-download-url-for-layer --repository-name "$ECR_REPOSITORY" \
    --layer-digest "$config_digest" --query downloadUrl --output text)
  curl -fsS "$url" | python3 -c 'import json,sys; print(json.load(sys.stdin)["architecture"])'
}

require_amd64() {
  local arch
  arch=$(image_arch "$1") || die "Could not read image $ECR_REPOSITORY:$1 from ECR"
  [[ $arch == amd64 ]] || die "$ECR_REPOSITORY:$1 is $arch; App Runner needs amd64"
}

started=$SECONDS

log "Checking AWS access and the App Runner service"
account=$(aws sts get-caller-identity --query Account --output text) ||
  die "AWS credentials don't work (set AWS_PROFILE or run 'aws configure')"
registry="$account.dkr.ecr.$AWS_REGION.amazonaws.com"
image="$registry/$ECR_REPOSITORY"

service_arn=$(aws apprunner list-services \
  --query "ServiceSummaryList[?ServiceName=='$APPRUNNER_SERVICE'].ServiceArn | [0]" --output text)
[[ -n $service_arn && $service_arn != None ]] ||
  die "App Runner service '$APPRUNNER_SERVICE' not found in $AWS_REGION"

read -r status tracked < <(aws apprunner describe-service --service-arn "$service_arn" \
  --query 'Service.[Status, SourceConfiguration.ImageRepository.ImageIdentifier]' --output text)
[[ $status == RUNNING ]] || die "Service status is $status; wait until it is RUNNING"
[[ $tracked == "$image:latest" ]] ||
  die "Service deploys '$tracked', but this script pushes '$image:latest'"
echo "Service:  $APPRUNNER_SERVICE ($status)"
echo "Image:    $image"

if [[ $mode == check ]]; then
  echo "Current:  :latest is $(image_arch latest || echo unknown)"
  echo "Domains:  $(aws apprunner describe-custom-domains --service-arn "$service_arn" \
    --query 'CustomDomains[].[DomainName, Status]' --output text |
    awk '{ printf "%s%s (%s)", sep, $1, $2; sep = ", " }')"
  log "Check passed; nothing was built or deployed"
  exit 0
fi

case $mode in
  build)
    tag=$(git rev-parse --short HEAD)
    if [[ -n $(git status --porcelain) ]]; then
      tag="$tag-dirty"
      warn "You have uncommitted changes; they will be deployed as :$tag"
      if ! $assume_yes && [[ -t 0 ]]; then
        read -r -p "Continue? [y/N] " answer
        [[ $answer == [yY]* ]] || exit 1
      fi
    fi

    log "Logging in to ECR"
    aws ecr get-login-password | docker login --username AWS --password-stdin "$registry"

    log "Building linux/amd64 image and pushing :$tag and :latest"
    # App Runner runs amd64 only. Provenance/SBOM attestations are disabled so
    # the push stays a plain single-platform image manifest.
    docker buildx build \
      --platform linux/amd64 \
      --provenance=false --sbom=false \
      -f src/backend/Dockerfile.backend \
      -t "$image:$tag" -t "$image:latest" \
      --push .

    require_amd64 "$tag"
    ;;

  rollback)
    tag=$rollback_tag
    log "Pointing :latest at :$tag"
    require_amd64 "$tag"
    read -r target_digest manifest_type < <(aws ecr batch-get-image --repository-name "$ECR_REPOSITORY" \
      --image-ids "imageTag=$tag" --query 'images[0].[imageId.imageDigest, imageManifestMediaType]' --output text)
    latest_digest=$(aws ecr batch-get-image --repository-name "$ECR_REPOSITORY" \
      --image-ids imageTag=latest --query 'images[0].imageId.imageDigest' --output text)
    if [[ $target_digest == "$latest_digest" ]]; then
      echo ":latest already points at :$tag"
    else
      manifest=$(aws ecr batch-get-image --repository-name "$ECR_REPOSITORY" \
        --image-ids "imageTag=$tag" --query 'images[0].imageManifest' --output text)
      aws ecr put-image --repository-name "$ECR_REPOSITORY" --image-tag latest \
        --image-manifest "$manifest" --image-manifest-media-type "$manifest_type" >/dev/null
    fi
    ;;

  skip)
    tag=latest
    require_amd64 latest
    ;;
esac

log "Deploying to App Runner"
operation_id=$(aws apprunner start-deployment --service-arn "$service_arn" \
  --query OperationId --output text)
echo "Operation: $operation_id"

deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))
while :; do
  op_status=$(aws apprunner list-operations --service-arn "$service_arn" \
    --query "OperationSummaryList[?Id=='$operation_id'].Status | [0]" --output text)
  case $op_status in
    SUCCEEDED) break ;;
    FAILED | ROLLBACK_*)
      die "Deployment ended with $op_status. App Runner keeps the previous version running.
Logs: aws logs tail /aws/apprunner/$APPRUNNER_SERVICE/${service_arn##*/}/service --since 30m" ;;
  esac
  ((SECONDS < deadline)) || die "Timed out waiting for the deployment (status: $op_status)"
  printf '  %s  %s\n' "$(date +%H:%M:%S)" "$op_status"
  sleep 15
done

log "Smoke testing $APP_URL"
curl -fsS --retry 5 --retry-delay 5 --retry-all-errors -o /dev/null "$APP_URL/api/" ||
  die "$APP_URL/api/ is not responding with 200"
echo "GET /api/  OK"
redirect=$(curl -sS -o /dev/null -w '%{redirect_url}' "$APP_URL/faq")
if [[ $redirect == https://* ]]; then
  echo "GET /faq   redirects to $redirect"
else
  warn "$APP_URL/faq redirects to '$redirect' (expected an https:// URL)"
fi

log "Deployed :$tag to $APP_URL in $(((SECONDS - started) / 60))m $(((SECONDS - started) % 60))s"
