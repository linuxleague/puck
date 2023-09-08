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
}: {
  data: Data;
  currentContent: Data["content"];
  setItemSelector: (item: ItemSelector) => void;
}) => {
  return (
    <OutlineList>
      {currentContent.map((item, i) => {
        const containsDropzone = !!Object.keys(data.dropzones || {}).find(
          (dropzoneKey) => dropzoneKey.split(":")[0] === item.props.id
        );

        return (
          <OutlineList.Item key={i}>
            <OutlineList.Clickable>
              <div
                onClick={() => {
                  setItemSelector({
                    index: i,
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
            {/* {containsDropzone && data.dropzones!<DeepOutlineList data={data} content={} />} */}
          </OutlineList.Item>
        );
      })}
    </OutlineList>
  );
};
