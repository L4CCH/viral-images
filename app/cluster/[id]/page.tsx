import { use } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import clustersData from "../../../scripts/data/clusters.json"
import metadata from "../../../scripts/data/metadata.json"
import { ClusterDetailsClient } from "@/components/cluster-details-client"

export async function generateStaticParams() {
  return Object.keys(clustersData).map((id) => ({
    id: id,
  }))
}

const metadataMap = new Map(metadata.map((item) => [item.filepath, item]))

const getClusterData = (clusterKey: string) => {
  const imagePaths = clustersData[clusterKey as keyof typeof clustersData]
  if (!imagePaths) {
    return null
  }
  const dates = imagePaths.map(p => new Date(metadataMap.get(p)?.pub_date || 0).getFullYear()).filter(y => y > 0);
  const startYear = Math.min(...dates);
  const endYear = Math.max(...dates);
  return {
    id: clusterKey,
    startYear,
    endYear,
  }
}

export default function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clusterKey = id;
  const clusterData = getClusterData(clusterKey)

  if (!clusterData) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cluster not found</h1>
        <Link href="/">
          <Button>Back to Cluster List</Button>
        </Link>
      </div>
    )
  }

  return (
    <ClusterDetailsClient
      clusterKey={clusterKey}
      initialStartYear={clusterData.startYear}
      initialEndYear={clusterData.endYear}
      clusters={clustersData}
    />
  )
}