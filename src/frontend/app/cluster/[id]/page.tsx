'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClusterDetailsClient } from "@/components/cluster-details-client";
import { useParams } from 'next/navigation';
import React from 'react';

export default function ClusterPage() {
  const params = useParams();
  const id = params.id as string;

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