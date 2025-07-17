"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import metadata from "../scripts/data/metadata.json"

const metadataMap = new Map(metadata.map((item) => [item.filepath, item]))

export function ClusterList({ clusters: allClusters, startYear, endYear }: { clusters: { [key: string]: string[] }, startYear: number, endYear: number }) {
  const clusters = Object.keys(allClusters).map((clusterId, index) => {
    const imagePaths = allClusters[clusterId as keyof typeof allClusters];
    const firstImageMeta = metadataMap.get(imagePaths[0]);
    const dates = imagePaths.map(p => new Date(metadataMap.get(p)?.pub_date || 0).getFullYear()).filter(y => y > 0);
    const clusterStartYear = Math.min(...dates);
    const clusterEndYear = Math.max(...dates);
    return {
      id: clusterId,
      title: `Cluster ${index + 1}`,
      imageCount: imagePaths.length,
      featureImage: firstImageMeta?.prediction_section_iiif_url,
      alt: firstImageMeta ? `${firstImageMeta.name} - ${firstImageMeta.pub_date}` : "Cluster image",
      startYear: clusterStartYear,
      endYear: clusterEndYear
    };
  }).filter(cluster => cluster.startYear >= startYear && cluster.endYear <= endYear);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clusters.map((cluster) => (
        <Link href={`/cluster/${cluster.id}`} key={cluster.id}>
          <Card className="cursor-pointer hover:bg-muted/50 h-full">
            <CardHeader>
              <CardTitle>{cluster.title}</CardTitle>
              <CardDescription>{cluster.imageCount} images ({cluster.startYear} - {cluster.endYear})</CardDescription>
            </CardHeader>
            {cluster.featureImage && (
              <CardContent>
                <div className="relative aspect-video">
                  <Image
                    src={cluster.featureImage}
                    alt={cluster.alt}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}