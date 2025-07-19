import { promises as fs } from "fs";
import path from "path";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import clustersData from "../../../scripts/data/clusters.json";
import { ClusterDetailsClient } from "@/components/cluster-details-client";
import { MetadataItem } from "@/lib/types";

export async function generateStaticParams() {
  return Object.keys(clustersData).map((id) => ({
    id: id,
  }));
}

async function getMetadata(): Promise<MetadataItem[]> {
  const filePath = path.join(process.cwd(), "scripts/data/metadata.json");
  const fileContent = await fs.readFile(filePath, "utf8");
  const lines = fileContent.trim().split("\n");
  return lines.map(line => JSON.parse(line));
}

const getClusterData = (clusterKey: string, metadataMap: Map<string, MetadataItem>) => {
  const imagePaths = clustersData[clusterKey as keyof typeof clustersData];
  if (!imagePaths) {
    return null;
  }
  const dates = imagePaths.map(p => new Date(metadataMap.get(p)?.pub_date || 0).getFullYear()).filter(y => y > 0);
  const startYear = Math.min(...dates);
  const endYear = Math.max(...dates);
  return {
    id: clusterKey,
    startYear,
    endYear,
  };
};

export default async function ClusterPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const clusterKey = id;
  const metadata = await getMetadata();
  const metadataMap = new Map(metadata.map((item) => [item.filepath, item]));
  const clusterData = getClusterData(clusterKey, metadataMap);

  if (!clusterData) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cluster not found</h1>
        <Link href="/">
          <Button>Back to Cluster List</Button>
        </Link>
      </div>
    );
  }

  return (
    <ClusterDetailsClient
      clusterKey={clusterKey}
      initialStartYear={clusterData.startYear}
      initialEndYear={clusterData.endYear}
      clusters={Object.entries(clustersData).map(([id, imagePaths]) => ({
        id,
        imagePaths: Array.isArray(imagePaths) ? imagePaths : [],
        firstImageMeta: imagePaths.length > 0 ? metadataMap.get(imagePaths[0]) : undefined,
      }))}
      metadata={metadata}
    />
  );
}