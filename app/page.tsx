// This is a dummy comment to trigger a re-build.
import fs from 'fs/promises';
import { MetadataItem } from "@/lib/types";
import path from 'path';
import HomeClient from "@/components/home-client";

export default async function Home() {

  const clustersFilePath = path.join(process.cwd(), 'scripts/data/clusters.json');
  const clustersFileContent = await fs.readFile(clustersFilePath, 'utf8');
  const rawClustersData: { [key: string]: string[] } = JSON.parse(clustersFileContent);

  const metadataFilePath = path.join(process.cwd(), 'scripts/data/metadata.json');
  const metadataFileContent = await fs.readFile(metadataFilePath, 'utf8');  const metadata = metadataFileContent.split('\n').filter(Boolean).map(line => JSON.parse(line));

  const metadataMap = new Map(metadata.map((item: MetadataItem) => [item.filepath, item]));

  const allClusters = Object.entries(rawClustersData).map(([id, imagePaths]) => {
    const firstImageMeta = imagePaths.length > 0 ? metadataMap.get(imagePaths[0]) : undefined;
    const processedFirstImageMeta = firstImageMeta ? {
      pub_date: firstImageMeta.pub_date,
      prediction_section_iiif_url: firstImageMeta.prediction_section_iiif_url,
      name: firstImageMeta.name,
    } : undefined;
    return {
      id,
      imagePaths,
      firstImageMeta: processedFirstImageMeta,
    };
  });

  return (
    <HomeClient allClusters={allClusters} />
  );
}
