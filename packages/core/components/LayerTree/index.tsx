import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { Data } from "../../types/Config";
import { ItemSelector } from "../../lib/get-item";
import { scrollIntoView } from "../../lib/scroll-into-view";
import { ChevronDown, ChevronUp, Grid, Layers, Type } from "react-feather";
import { rootDroppableId } from "../../lib/root-droppable-id";

const getClassName = getClassNameFactory("LayerTree", styles);
const getClassNameLayer = getClassNameFactory("Layer", styles);

export const LayerTree = ({
  data,
  currentContent,
  itemSelector,
  setItemSelector,
  dropzone,
}: {
  data: Data;
  currentContent: Data["content"];
  itemSelector: ItemSelector | null;
  setItemSelector: (item: ItemSelector | null) => void;
  dropzone?: string;
}) => {
  const dropzones = data.dropzones || {};

  return (
    <ul className={getClassName()}>
      {/* {currentContent.length === 0 && <div>No items</div>} */}
      {currentContent.map((item, i) => {
        const containsDropzone = !!Object.keys(dropzones).find(
          (dropzoneKey) => dropzoneKey.split(":")[0] === item.props.id
        );

        const isSelected =
          itemSelector?.index === i &&
          (itemSelector.dropzone === dropzone ||
            (itemSelector.dropzone === rootDroppableId && !dropzone));

        const dropzonesForItem = Object.keys(dropzones)
          .filter((key) => {
            const [areaId] = key.split(":");

            return areaId === item.props.id;
          })
          .reduce((acc, key) => {
            return { ...acc, [key]: dropzones[key] };
          }, {});

        return (
          <li
            className={getClassNameLayer({
              isSelected,

              containsDropzone,
            })}
            key={i}
          >
            <div className={getClassNameLayer("inner")}>
              {containsDropzone && (
                <div title={isSelected ? "Collapse" : "Expand"}>
                  {isSelected ? (
                    <ChevronUp size="12" />
                  ) : (
                    <ChevronDown size="12" />
                  )}
                </div>
              )}
              <div
                className={getClassNameLayer("clickable")}
                onClick={() => {
                  if (isSelected) {
                    setItemSelector(null);
                    return;
                  }

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
                <div className={getClassNameLayer("title")}>
                  <div className={getClassNameLayer("icon")}>
                    {item.type === "Text" || item.type === "Heading" ? (
                      <Type size="16" />
                    ) : (
                      <Grid size="16" />
                    )}
                  </div>
                  {item.type}
                </div>
              </div>
            </div>
            {containsDropzone &&
              Object.keys(dropzonesForItem).map((dropzoneKey, idx) => (
                <div key={idx} className={getClassNameLayer("dropzones")}>
                  <div className={getClassNameLayer("title")}>
                    <div className={getClassNameLayer("dropzoneIcon")}>
                      <Layers size="16" />
                    </div>{" "}
                    {dropzoneKey.split(":")[1]}
                  </div>
                  <LayerTree
                    data={data}
                    currentContent={dropzones[dropzoneKey]}
                    setItemSelector={setItemSelector}
                    itemSelector={itemSelector}
                    dropzone={dropzoneKey}
                  />
                </div>
              ))}
          </li>
        );
      })}
    </ul>
  );
};
