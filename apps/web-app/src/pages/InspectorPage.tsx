import { Stack, space, size } from "@linky-fit/ui";
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
      height={
        isFullscreen
          ? "100%"
          : `calc(100dvh - ${size.controlLg + space.huge + space.huge}px)`
      }
      borderRadius={isFullscreen ? "$none" : "$control"}
      overflow="hidden"
      marginTop={isFullscreen ? "$none" : "$sm"}
      position={isFullscreen ? "fixed" : "relative"}
      {...(isFullscreen ? { inset: 0 } : {})}
      zIndex={isFullscreen ? "$overlay" : "$base"}
      $wide={{ height: "100%", marginTop: "$none" }}
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
