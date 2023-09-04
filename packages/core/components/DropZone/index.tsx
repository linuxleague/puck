import { CSSProperties, useContext } from "react";
import { DraggableComponent } from "../DraggableComponent";
import DroppableStrictMode from "../DroppableStrictMode";
import { getItem } from "../../lib/get-item";
import { setupDropzone } from "../../lib/setup-dropzone";
import { rootDroppableId } from "../../lib/root-droppable-id";
import { getClassNameFactory } from "../../lib";
import styles from "./styles.module.css";
import { DropZoneProvider, dropZoneContext } from "./context";

const getClassName = getClassNameFactory("DropZone", styles);

export { DropZoneProvider } from "./context";

export function DropZone({
  id,
  direction = "vertical",
  style,
}: {
  id?: string;
  direction?: "vertical" | "horizontal";
  style?: CSSProperties;
}) {
  const ctx = useContext(dropZoneContext);

  const {
    // These all need setting via context
    data,
    dispatch,
    config,
    itemSelector,
    setItemSelector,
    areaId,
    draggedItem,
    placeholderStyle,
  } = ctx! || {};

  let content = data.content;
  let dropzone = rootDroppableId;

  if (areaId && id) {
    dropzone = `${areaId}:${id}`;
    content = setupDropzone(data, dropzone).dropzones[dropzone];
  }

  const isRootDropzone = dropzone === rootDroppableId;

  const draggedSourceId = draggedItem && draggedItem.source.droppableId;
  const draggedDestinationId =
    draggedItem && draggedItem.destination?.droppableId;
  const [dropzoneArea] = dropzone.split(":");
  const [draggedSourceArea] = draggedSourceId
    ? draggedSourceId?.split(":")
    : "";

  const userIsDragging = !!draggedItem;
  const draggingOverArea = userIsDragging && dropzoneArea === draggedSourceArea;
  const draggingNewComponent = draggedSourceId === "component-list";

  if (!ctx?.config || !ctx.setHoveringArea || !ctx.setHoveringDropzone) {
    return <div>DropZone requires context to work.</div>;
  }

  const {
    hoveringArea,
    setHoveringArea,
    hoveringDropzone,
    setHoveringDropzone,
  } = ctx;

  const hoveringOverArea = hoveringArea
    ? hoveringArea === dropzoneArea
    : isRootDropzone;
  const hoveringOverDropzone = hoveringDropzone === dropzone;

  let isEnabled = true;

  /**
   * We enable dropzones when:
   *
   * 1. This is a new component and the user is dragging over the area. This
   *    check prevents flickering if you move cursor outside of dropzone
   *    but within the area
   * 2. This is an existing component and the user a) is dragging over the
   *    area (which prevents drags between dropzone areas, breaking the rules
   *    of react-beautiful-dnd) and b) has the cursor hovering directly over
   *    the specific dropzone (which increases robustness when using flex
   *    layouts)
   */
  if (userIsDragging) {
    if (draggingNewComponent) {
      isEnabled = hoveringOverArea;
    } else {
      isEnabled = draggingOverArea && hoveringOverDropzone;
    }
  }

  const selectedItem = itemSelector ? getItem(itemSelector, data) : null;
  const isAreaSelected = selectedItem && dropzoneArea === selectedItem.props.id;

  return (
    <div
      className={getClassName({
        isRootDropzone,
        userIsDragging,
        draggingOverArea,
        hoveringOverArea,
        draggingNewComponent,
        isDestination: draggedDestinationId === dropzone,
        isDisabled: !isEnabled,
        isAreaSelected,
      })}
    >
      <DroppableStrictMode
        droppableId={dropzone}
        direction={direction}
        isDropDisabled={!isEnabled}
      >
        {(provided, snapshot) => {
          return (
            <div
              {...(provided || { droppableProps: {} }).droppableProps}
              className={getClassName("content")}
              ref={provided?.innerRef}
              style={style}
              id={dropzone}
              onMouseOver={(e) => {
                e.stopPropagation();
                setHoveringArea(dropzoneArea);
                setHoveringDropzone(dropzone);
              }}
            >
              {content?.map &&
                content.map((item, i) => {
                  const componentId = item.props.id;

                  const defaultedProps = {
                    ...config.components[item.type]?.defaultProps,
                    ...item.props,
                    editMode: true,
                  };

                  const props = defaultedProps;

                  const isSelected =
                    selectedItem?.props.id === componentId || false;

                  const containsDropzone = !!Object.keys(
                    ctx?.data.dropzones || {}
                  ).find(
                    (dropzoneKey) => dropzoneKey.split(":")[0] === componentId
                  );

                  return (
                    <div key={item.props.id} className={getClassName("item")}>
                      <DropZoneProvider
                        value={{
                          ...ctx,
                          areaId: componentId,
                        }}
                      >
                        <DraggableComponent
                          label={item.type.toString()}
                          id={`draggable-${componentId}`}
                          index={i}
                          isSelected={isSelected}
                          isLocked={userIsDragging}
                          onClick={(e) => {
                            setItemSelector({
                              index: i,
                              dropzone,
                            });
                            e.stopPropagation();
                          }}
                          onMouseOver={(e) => {
                            e.stopPropagation();

                            if (containsDropzone) {
                              setHoveringArea(componentId);
                            } else {
                              setHoveringArea(dropzoneArea);
                            }

                            setHoveringDropzone(dropzone);
                          }}
                          onMouseOut={() => {
                            setHoveringArea(null);
                            setHoveringDropzone(null);
                          }}
                          onDelete={(e) => {
                            dispatch({ type: "remove", index: i, dropzone });

                            setItemSelector(null);

                            e.stopPropagation();
                          }}
                          onDuplicate={(e) => {
                            dispatch({
                              type: "duplicate",
                              sourceIndex: i,
                              sourceDropzone: dropzone,
                            });

                            setItemSelector({ dropzone, index: i + 1 });

                            e.stopPropagation();
                          }}
                        >
                          <div style={{ zoom: 0.75 }}>
                            {config.components[item.type] ? (
                              config.components[item.type].render(props)
                            ) : (
                              <div style={{ padding: 48, textAlign: "center" }}>
                                No configuration for {item.type}
                              </div>
                            )}
                          </div>
                        </DraggableComponent>
                      </DropZoneProvider>
                      {userIsDragging && (
                        <div
                          className={getClassName("hitbox")}
                          onMouseOver={(e) => {
                            e.stopPropagation();
                            setHoveringArea(dropzoneArea);
                            setHoveringDropzone(dropzone);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              {provided?.placeholder}
              {snapshot?.isDraggingOver && (
                <div
                  style={{
                    ...placeholderStyle,
                    background: "var(--puck-color-azure-4)",
                    opacity: 0.3,
                    zIndex: 0,
                  }}
                />
              )}
            </div>
          );
        }}
      </DroppableStrictMode>
    </div>
  );
}
