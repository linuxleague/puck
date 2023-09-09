import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { ReactNode, SyntheticEvent } from "react";
import { Data } from "../../types/Config";
import { ItemSelector } from "../../lib/get-item";
import { scrollIntoView } from "../../lib/scroll-into-view";

const getClassName = getClassNameFactory("OutlineList", styles);

export const OutlineList = ({ children }: { children: ReactNode }) => {
  return <ul className={getClassName()}>{children}</ul>;
};

// eslint-disable-next-line react/display-name
OutlineList.Clickable = ({ children }: { children: ReactNode }) => (
  <div className={getClassName("clickableItem")}>{children}</div>
);

// eslint-disable-next-line react/display-name
OutlineList.Item = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: (e: SyntheticEvent) => void;
}) => {
  return (
    <li
      className={onClick ? getClassName("clickableItem") : ""}
      onClick={onClick}
    >
      {children}
    </li>
  );
};

export const DeepOutlineList = ({
  data,
  currentContent,
  setItemSelector,
  dropzone,
}: {
  data: Data;
  currentContent: Data["content"];
  setItemSelector: (item: ItemSelector) => void;
  dropzone?: string;
}) => {
  const dropzones = data.dropzones || {};

  return (
    <OutlineList>
      {currentContent.map((item, i) => {
        const containsDropzone = !!Object.keys(dropzones).find(
          (dropzoneKey) => dropzoneKey.split(":")[0] === item.props.id
        );

        const dropzonesForItem = Object.keys(dropzones)
          .filter((key) => {
            const [areaId] = key.split(":");

            return areaId === item.props.id;
          })
          .reduce((acc, key) => {
            return { ...acc, [key]: dropzones[key] };
          }, {});

        return (
          <OutlineList.Item key={i}>
            <OutlineList.Clickable>
              <div
                onClick={() => {
                  setItemSelector({
                    index: i,
                    dropzone,
                  });

                  const id = currentContent[i].props.id;

                  scrollIntoView(
                    document.querySelector(
                      `[data-rbd-drag-handle-draggable-id="draggable-${id}"]`
                    ) as HTMLElement
                  );
                }}
              >
                {item.type}
              </div>
            </OutlineList.Clickable>
            {containsDropzone &&
              Object.keys(dropzonesForItem).map((dropzoneKey, idx) => (
                <details key={idx} style={{ marginLeft: 12 }}>
                  <summary>{dropzoneKey.split(":")[1]}</summary>
                  <DeepOutlineList
                    data={data}
                    currentContent={dropzones[dropzoneKey]}
                    setItemSelector={setItemSelector}
                    dropzone={dropzoneKey}
                  />
                </details>
              ))}
          </OutlineList.Item>
        );
      })}
    </OutlineList>
  );
};
