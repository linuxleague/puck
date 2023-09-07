"use client";

import { Config, Data } from "../../types/Config";
import { DropZone, DropZoneProvider } from "../DropZone";

export function Render({ config, data }: { config: Config; data: Data }) {
  const children = (
    <DropZoneProvider value={{ data, config, mode: "render" }}>
      <DropZone />
    </DropZoneProvider>
  );

  if (config.root) {
    return (
      <config.root.render {...data.root} editMode={false}>
        {children}
      </config.root.render>
    );
  }

  return <div>{children}</div>;
}
