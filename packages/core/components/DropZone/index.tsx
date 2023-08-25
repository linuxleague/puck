import { CSSProperties, createContext, useContext, useState } from "react";
import { usePlaceholderStyle } from "../../lib/use-placeholder-style";
import { Config, Content, Data } from "../../types/Config";
import { DraggableComponent } from "../DraggableComponent";
import DroppableStrictMode from "../DroppableStrictMode";
import { Button } from "../Button";
import { DragStart } from "react-beautiful-dnd";
import { ItemSelector, getItem } from "../../lib/get-item";

const dropZoneContext = createContext<{
  data: Data;
  content: Content;
  dropzones?: Record<string, Content>;
  config: Config;
  itemSelector: ItemSelector | null;
  setItemSelector: (newIndex: ItemSelector | null) => void;
  setContent: (data: any) => void;
  setChildHovering?: (isHovering: boolean) => void;
  isChildHovering?: boolean;
  draggableParentId?: string;
  draggedItem?: DragStart;
  placeholderStyle?: CSSProperties;
} | null>(null);

export const DropZoneProvider = dropZoneContext.Provider;

export function DropZone({
  content: _content,
  droppableId: _droppableId,
  id,
  direction = "vertical",
  style,
}: {
  content?: Content;

  droppableId?: string;
  id?: string;
  direction?: "vertical" | "horizontal";
  style?: CSSProperties;
}) {
  const ctx = useContext(dropZoneContext);

  const [hoveringIndex, setHoveringIndex] = useState<number | undefined>();
  const [isChildHovering, setChildHovering] = useState(false);

  if (!ctx?.config) {
    return <div>DropZone requires context to work.</div>;
  }

  const {
    // These all need setting via context
    data,
    config,
    itemSelector,
    setItemSelector,
    setChildHovering: setParentChildHovering,
    draggableParentId,
    draggedItem,
    placeholderStyle,
  } = ctx;

  let content = _content;

  if (draggableParentId) {
    let dropzone: Content = [];

    for (let i = 0; i < ctx.content.length; i++) {
      const item = ctx.content[i];

      if (item.props.id === draggableParentId && id) {
        const dropzones = item.dropzones || {
          [id]: [],
        };

        dropzone = dropzones[id];
      }
    }

    content = dropzone;
  }

  const draggedDroppableId = draggedItem && draggedItem.source.droppableId;

  const draggedParentId =
    draggedItem && draggedItem.source.droppableId.split(":")[0];

  const droppableId = _droppableId || `${draggableParentId}:${id}`;

  const sharedParent = draggedParentId === droppableId.split(":")[0];

  const isDisabled =
    !sharedParent &&
    draggedItem &&
    draggedItem.source.droppableId !== "component-list";

  return (
    <DroppableStrictMode
      droppableId={droppableId}
      direction={direction}
      isDropDisabled={isDisabled}
    >
      {(provided, snapshot) => (
        <div
          {...(provided || { droppableProps: {} }).droppableProps}
          ref={provided?.innerRef}
          style={{
            ...style,
            zoom: 1.33,
            zIndex: 1,
            position: "relative",
            minHeight: 64,
            height: "100%",
            outline:
              snapshot.isDraggingOver || sharedParent ? "3px dashed" : "",
            outlineColor: snapshot.isDraggingOver
              ? "var(--puck-color-azure-3)"
              : sharedParent
              ? "var(--puck-color-azure-7)"
              : "none",
            outlineOffset: -3,
            width: snapshot.isDraggingOver ? "100%" : "auto",
            overflow: snapshot.isDraggingOver ? "hidden" : "auto",
          }}
          id={droppableId}
        >
          {content?.map &&
            content.map((item, i) => {
              const componentId = item.props.id;

              const defaultedProps = {
                ...config.components[item.type].defaultProps,
                ...item.props,
                editMode: true,
              };

              const props = defaultedProps;

              const isSelected =
                (itemSelector &&
                  getItem(itemSelector, data)?.props.id === componentId) ||
                false;

              return (
                <DropZoneProvider
                  key={item.props.id}
                  value={{
                    ...ctx,
                    isChildHovering,
                    setChildHovering,
                    draggableParentId: componentId,
                    dropzones: item.dropzones,
                  }}
                >
                  <DraggableComponent
                    isDragDisabled={isDisabled}
                    label={item.type.toString()}
                    id={`draggable-${componentId}`}
                    index={i}
                    isSelected={isSelected}
                    isHovering={
                      hoveringIndex === i &&
                      !isChildHovering &&
                      !draggedDroppableId
                    }
                    onClick={(e) => {
                      setItemSelector({
                        index: i,
                        parentId: draggableParentId,
                        dropzone: id,
                      });
                      e.stopPropagation();
                    }}
                    onMouseOver={() => {
                      setHoveringIndex(i);
                      setParentChildHovering && setParentChildHovering(true);
                    }}
                    onMouseOut={() => {
                      setHoveringIndex(undefined);
                      setParentChildHovering && setParentChildHovering(false);
                    }}
                    onDelete={(e) => {
                      //   const newContent = [...content];
                      //   newContent.splice(i, 1);
                      //   setSelectedIndex(null);
                      //   setContent(newContent);
                      //   e.stopPropagation();
                    }}
                    onDuplicate={(e) => {
                      //   const newData = { ...data };
                      //   const newItem = {
                      //     ...newData.content[i],
                      //     props: {
                      //       ...newData.content[i].props,
                      //       id: `${newData.content[i].type}-${new Date().getTime()}`,
                      //     },
                      //   };
                      //   newData.content.splice(i + 1, 0, newItem);
                      //   setData(newData);
                      //   e.stopPropagation();
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
          {/* <Button
            onMouseOver={() =>
              setParentChildHovering && setParentChildHovering(true)
            }
            onMouseOut={() =>
              setParentChildHovering && setParentChildHovering(false)
            }
            onClick={() => {
              console.log(draggableParentId, id, ctx.content);

              if (!ctx.content) return;

              if (draggableParentId && id && ctx.content) {
                setContent([
                  ...ctx.content?.map((item) => {
                    if (item.props.id === draggableParentId) {
                      return {
                        ...item,
                        dropzones: {
                          ...(item.dropzones || {}),
                          [id]: [
                            ...(item.dropzones ? item.dropzones[id] || [] : []),
                            {
                              type: "Text",
                              props: {
                                text: "Text " + Math.random(),
                                id: new Date().getTime(),
                              },
                            },
                          ],
                        },
                      };
                    }

                    return { ...item };
                  }),
                ]);
              } else {
                setContent([
                  ...ctx.content,
                  { type: "Text", props: { text: "Text" } },
                ]);
              }
            }}
            variant="secondary"
          >
            Add Text block
          </Button> */}
        </div>
      )}
    </DroppableStrictMode>
  );
}
