'use client';

import { Suspense } from "react";
import { ClusterClient } from "@/components/cluster-client";

function ClusterPageFallback() {
  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Loading...</h1>
    </div>
  );
}

export default function ClusterPage() {
  return (
    <Suspense fallback={<ClusterPageFallback />}>
      <ClusterClient />
    </Suspense>
  );
}

