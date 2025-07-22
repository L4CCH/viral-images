
'use client';

import { useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";


import type { ClusterData } from '@/components/home-client';

interface FacetSidebarProps {
  clusters: ClusterData[];
  selectedNewspapers: string[];
  onNewspaperFilterChange: (newspaper: string) => void;
  selectedPublishers: string[];
  onPublisherFilterChange: (publisher: string) => void;
}

const FacetSidebar = ({
  clusters,
  selectedNewspapers,
  onNewspaperFilterChange,
  selectedPublishers,
  onPublisherFilterChange,
}: FacetSidebarProps) => {
  const newspaperCounts = useMemo(() => {
    const counts = new Map<string, number>();
    clusters.forEach(cluster => {
      if (cluster.newspaperName) {
        counts.set(cluster.newspaperName, (counts.get(cluster.newspaperName) || 0) + 1);
      }
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [clusters]);

  const publisherCounts = useMemo(() => {
    const counts = new Map<string, number>();
    clusters.forEach(cluster => {
      if (cluster.publisherName) {
        counts.set(cluster.publisherName, (counts.get(cluster.publisherName) || 0) + 1);
      }
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [clusters]);

  return (
    <aside className="w-64 p-4 border-r">
      {/* <h2 className="text-lg font-semibold mb-4">Filter by</h2> */}
      <div className="mt-4 border p-4">
        <h3 className="font-semibold mb-4">Newspaper Name</h3>
        <ScrollArea className="h-80">
          {newspaperCounts.map(([name, count]) => (
            <div key={name} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`newspaper-${name}`}
                checked={selectedNewspapers.includes(name)}
                onCheckedChange={() => onNewspaperFilterChange(name)}
              />
              <label
                htmlFor={`newspaper-${name}`}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name} ({count})
              </label>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="mt-4 border p-4">
        <h3 className="font-semibold mb-4">Publisher</h3>
        <ScrollArea className="h-80">
          {publisherCounts.map(([publisher, count]) => (
            <div key={publisher} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`publisher-${publisher}`}
                checked={selectedPublishers.includes(publisher)}
                onCheckedChange={() => onPublisherFilterChange(publisher)}
              />
              <label
                htmlFor={`publisher-${publisher}`}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {publisher} ({count})
              </label>
            </div>
          ))}
        </ScrollArea>
      </div>
    </aside>
  );
};

export default FacetSidebar;
