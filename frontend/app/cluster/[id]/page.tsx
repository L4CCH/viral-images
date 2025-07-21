'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClusterDetailsClient } from "@/components/cluster-details-client";

export default function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  if (!id) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Image not found</h1>
        <Link href="/">
          <Button>Back to Gallery</Button>
        </Link>
      </div>
    );
  }

  return (
    <ClusterDetailsClient
      clusterKey={id}
    />
  );
}