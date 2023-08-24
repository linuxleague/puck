/* eslint-disable @next/next/no-img-element */
import React, { ReactNode } from "react";
import { ComponentConfig } from "@measured/puck/types/Config";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@measured/puck/lib";
import { Section } from "../../components/Section";
import { DropZone } from "@measured/puck/components/DropZone";
import { Data } from "@measured/puck";

const getClassName = getClassNameFactory("Columns", styles);

export type ColumnsProps = {
  columns: {
    label: string;
  }[];
};

export const Columns: ComponentConfig<ColumnsProps> = {
  fields: {
    columns: {
      type: "array",
      arrayFields: {
        label: {
          type: "text",
        },
      },
      defaultItemProps: {
        label: "Column",
      },
    },
  },
  defaultProps: {
    columns: [{ label: "My Col 1" }],
  },
  render: ({ columns }) => {
    return (
      <Section>
        <div
          className={getClassName()}
          style={{ gridTemplateColumns: `repeat(${columns.length},1fr)` }}
        >
          {columns.map((column, idx) => (
            <div key={idx} className={getClassName("col")}>
              <DropZone id={`column-${idx}`} />
            </div>
          ))}
        </div>
      </Section>
    );
  },
};

const example = {
  type: "Column",
  props: {},
  dropzones: {
    column1: [{}],
  },
};
