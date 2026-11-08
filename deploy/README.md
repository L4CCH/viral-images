# Deploying to AWS App Runner

Production runs on the App Runner service `viral-images-app` (us-east-2), served at **https://viral-images.org**. It's one container: FastAPI serves the API at `/api` and the static Next.js export at `/`. The image is built from [`src/backend/Dockerfile.backend`](../src/backend/Dockerfile.backend), with the repo root as build context.

Deploys are done from your machine with [`deploy-apprunner.sh`](deploy-apprunner.sh), which uses Docker and the AWS CLI.

## Usage

```bash
deploy/deploy-apprunner.sh --check            # read-only: AWS access, service status, current image
deploy/deploy-apprunner.sh                    # build, push, deploy, wait, smoke test
deploy/deploy-apprunner.sh --skip-build       # redeploy the image currently tagged :latest
deploy/deploy-apprunner.sh --rollback <tag>   # redeploy an earlier image, e.g. a git sha
```

A normal deploy does the following:

1. Checks that the service is `RUNNING` and deploys `…/l4cch/viral-images:latest`.
2. Builds the image for **linux/amd64** and pushes two tags: `:<git-sha>` and `:latest`.
   - Uncommitted changes produce a `:<sha>-dirty` tag, and the script asks you to confirm first.
3. Confirms the pushed image is amd64.
4. Runs `aws apprunner start-deployment` and waits until the deployment succeeds. If a deployment fails, App Runner keeps the previous version running.
5. Checks that `https://viral-images.org/api/` returns 200 and that `/faq` redirects to `https://`.

The first build downloads the datasets from Hugging Face. Later builds reuse Docker's build cache, which takes about 2 minutes on Apple Silicon.

### Configuration

The defaults match this project. Override them with environment variables:

| Variable | Default |
|---|---|
| `AWS_PROFILE` | your default profile |
| `AWS_REGION` | `us-east-2` |
| `ECR_REPOSITORY` | `l4cch/viral-images` |
| `APPRUNNER_SERVICE` | `viral-images-app` |
| `APP_URL` | `https://viral-images.org` |
| `DEPLOY_TIMEOUT_SECONDS` | `1200` |

### Permissions

The AWS identity you deploy with needs:

- **ECR:**
  - `ecr:GetAuthorizationToken`
  - On the `l4cch/viral-images` repository: `ecr:BatchCheckLayerAvailability`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage`, `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer`
- **App Runner:** `apprunner:ListServices`, `apprunner:DescribeService`, `apprunner:DescribeCustomDomains`, `apprunner:StartDeployment`, `apprunner:ListOperations`

## Why the image must be amd64

App Runner runs x86_64 (amd64) containers. A plain `docker build` on an Apple Silicon Mac produces an **arm64** image that App Runner can't run. That's what happened on 2026-02-21:

- An arm64 image was pushed and creating the service failed.
- An amd64 rebuild then deployed fine.

The script always builds with `--platform linux/amd64` and refuses to deploy anything else.

It also disables provenance and SBOM attestations (`--provenance=false --sbom=false`). The push then stays a plain single-image manifest, the same format as the images that have already worked on App Runner.

## Automatic deployments are off

The service has `AutoDeploymentsEnabled: false`, so pushing to ECR doesn't deploy by itself. The script starts each deployment explicitly. To deploy by hand: push `:latest`, then run `aws apprunner start-deployment --service-arn <arn>`.

## Optional one-time improvements

These change the service, so run them yourself if you want them.

**Health check on `/api/` instead of TCP.** This endpoint returns 200 only after the dataset has loaded, so App Runner won't route traffic to an instance that's still starting:

```bash
SERVICE_ARN=$(aws apprunner list-services --region us-east-2 \
  --query "ServiceSummaryList[?ServiceName=='viral-images-app'].ServiceArn | [0]" --output text)
aws apprunner update-service --region us-east-2 --service-arn "$SERVICE_ARN" \
  --health-check-configuration Protocol=HTTP,Path=/api/,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5
```

**ECR lifecycle policy.** Every deploy adds a `:<sha>` image. Keeping the last 15 still leaves room to roll back:

```bash
aws ecr put-lifecycle-policy --region us-east-2 --repository-name l4cch/viral-images \
  --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"keep last 15","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":15},"action":{"type":"expire"}}]}'
```

## Troubleshooting

- **Deployment failed:** read the service logs with `aws logs tail /aws/apprunner/viral-images-app/<service-id>/service --since 30m` (the script prints the exact command), and the app's own output in `/aws/apprunner/viral-images-app/<service-id>/application`.
- **"is arm64; App Runner needs amd64":** something pushed a non-amd64 `:latest`. Redeploy with the script, or roll back to an earlier tag.
- **CORS:** the site and API share an origin in production, so no setting is needed. To allow another origin, set the `CORS_ORIGINS` environment variable (a JSON list) on the App Runner service.
