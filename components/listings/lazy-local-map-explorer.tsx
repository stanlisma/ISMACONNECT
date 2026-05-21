"use client";

import dynamic from "next/dynamic";

import { MapPanelSkeleton } from "@/components/ui/map-panel-skeleton";

import type { LocalMapExplorerProps } from "@/components/listings/local-map-explorer";

const DynamicLocalMapExplorer = dynamic(
  () =>
    import("@/components/listings/local-map-explorer").then((module) => module.LocalMapExplorer),
  {
    ssr: false,
    loading: () => <MapPanelSkeleton />
  }
);

export function LazyLocalMapExplorer(props: LocalMapExplorerProps) {
  return <DynamicLocalMapExplorer {...props} />;
}
