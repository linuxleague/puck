import React from "react";
import { ComponentConfig } from "@measured/puck/types/Config";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@measured/puck/lib";
import { DropZone } from "@measured/puck/components/DropZone";
import { Section } from "../../components/Section";

const getClassName = getClassNameFactory("Columns", styles);

export type ColumnsProps = {
  columns: {}[];
};

export const Columns: ComponentConfig<ColumnsProps> = {
  fields: {
    columns: {
      type: "array",
      getItemSummary: (_, id) => `Column ${id + 1}`,
    },
  },
  defaultProps: {
    columns: [{}, {}],
  },
  render: ({ columns }) => {
    return (
      <Section>
        <div
          className={getClassName()}
          style={{ gridTemplateColumns: `repeat(${columns.length},1fr)` }}
        >
          {columns.map((_, idx) => (
            <div key={idx} className={getClassName("col")}>
              <DropZone id={`column-${idx}`} />
            </div>
          ))}
        </div>
      </Section>
    );
  },
};
