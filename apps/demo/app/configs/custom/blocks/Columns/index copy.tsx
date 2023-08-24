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
  column1: ReactNode;
  // columns: {
  //   content: ReactNode;
  // }[];
  // columnsAlt: ReactNode;
  //   column1: Data["content"];
  //   columns: { content: Data["content"] }[];
};

export const Columns: ComponentConfig<ColumnsProps> = {
  fields: {
    column1: {
      type: "dropzone",
      dropzoneId: "column1",
    },
    // columns: {
    //   type: "array",
    //   arrayFields: {
    //     content: {
    //       type: "dropzone",
    //       dropzoneId: "column",
    //     },
    //   },
    //   defaultItemProps: {
    //     content: [
    //       {
    //         type: "Text",
    //         props: { text: "First", id: "abc" },
    //       },
    //       {
    //         type: "Text",
    //         props: { text: "Second", id: "def" },
    //       },
    //     ],
    //   },
    // },
  },
  defaultProps: {
    column1: [
      {
        type: "Text",
        props: { text: "Col1: First", id: "abc" },
      },
      {
        type: "Text",
        props: { text: "Col2: Second", id: "def" },
      },
    ],
    // columns: [
    //   {
    //     content: [
    //       {
    //         type: "Text",
    //         props: { text: "First", id: "abc" },
    //       },
    //       {
    //         type: "Text",
    //         props: { text: "Second", id: "def" },
    //       },
    //     ],
    //   },
    // ],
  },
  render: ({ column1 }) => {
    return (
      <Section>
        <div className={getClassName()}>
          <div>{column1}</div>

          {/* <div>
            <DropZone id="column1" />
          </div> */}

          {/* {columns.map((column, idx) => (
            // <div key={idx} />
            // <column.content key={idx} />
            <DropZone
              key={idx}
              //   dropzoneId={`column-dropzone[${idx}]`}
              droppableId={`column-dropzone[${idx}]`}
              content={column.content}
            />
          ))} */}
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
