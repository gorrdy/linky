import { Stack } from "@linky-fit/ui";
import React from "react";

import { clientInspectorStore } from "../devtools/inspector/clientInspectorStore";
import { useInspectorEnabled } from "../devtools/inspector/inspectorEnabled";
import { InspectorApp } from "../devtools/inspectorPage/InspectorApp";
import { createInMemoryInspectorDataSource } from "../devtools/inspectorPage/inspectorDataSource";

export default function InspectorPage(): React.ReactElement {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const isCollecting = useInspectorEnabled();
  const dataSource = React.useMemo(
    () => createInMemoryInspectorDataSource(clientInspectorStore),
    [],
  );

  return (
    <Stack
      width="100%"
      minHeight={0}
      height="100%"
      borderRadius={isFullscreen ? "$none" : "$control"}
      overflow="hidden"
      position={isFullscreen ? "fixed" : "relative"}
      {...(isFullscreen ? { inset: 0 } : {})}
      zIndex={isFullscreen ? "$overlay" : "$base"}
    >
      <Stack data-safe-area={isFullscreen ? "top" : undefined} />
      <InspectorApp
        dataSource={dataSource}
        isCollecting={isCollecting}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((current) => !current)}
      />
    </Stack>
  );
}
