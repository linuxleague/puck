import { CSSProperties, createContext, useContext, useState } from "react";
import { usePlaceholderStyle } from "../../lib/use-placeholder-style";
import { Config, Content, Data } from "../../types/Config";
import { DraggableComponent } from "../DraggableComponent";
import DroppableStrictMode from "../DroppableStrictMode";
import { Button } from "../Button";
import { DragStart } from "react-beautiful-dnd";

const dropZoneContext = createContext<{
  content: Content;
  dropzones?: Record<string, Content>;
  config: Config;
  selectedIndex: number | null;
  setSelectedIndex: (newIndex: number | null) => void;
  setContent: (data: any) => void;
  setChildHovering?: (isHovering: boolean) => void;
  isChildHovering?: boolean;
  draggableParentId?: string;
  draggedItem?: DragStart;
  placeholderStyle: CSSProperties;
} | null>(null);

export const DropZoneProvider = dropZoneContext.Provider;

export function DropZone({
  content: _content,
  droppableId: _droppableId,
  id,
  direction = "vertical",
  style,
  itemStyle,
}: {
  content?: Content;

  droppableId?: string;
  id?: string;
  direction?: "vertical" | "horizontal";
  style?: CSSProperties;
  itemStyle?: CSSProperties;
}) {
  const ctx = useContext(dropZoneContext);

  const [hoveringIndex, setHoveringIndex] = useState<number | undefined>();
  const [isChildHovering, setChildHovering] = useState(false);

  if (!ctx?.config) {
    return <div>DropZone requires context to work.</div>;
  }

  const {
    // These all need setting via context
    config,
    selectedIndex,
    setSelectedIndex,
    setContent,
    isChildHovering: isParentChildHovering,
    setChildHovering: setParentChildHovering,
    draggableParentId,
    dropzones,
    draggedItem,
    placeholderStyle,
  } = ctx;

  let content = _content;

  if (draggableParentId) {
    let dropzone: Content = [];

    // console.log(draggableParentId);

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

  const droppableId = _droppableId || `${draggableParentId}:${id}`;

  const isDisabled =
    draggedItem &&
    draggedItem.source.droppableId.split(":")[0] !==
      droppableId.split(":")[0] &&
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
            zIndex: 1,
            position: "relative",
            minHeight: 64,
            width: snapshot.isDraggingOver ? "100%" : "auto",
            overflow: snapshot.isDraggingOver ? "hidden" : "auto",
          }}
          id={droppableId}
        >
          {content?.map &&
            content.map((item, i) => {
              const id = item.props.id;

              const defaultedProps = {
                ...config.components[item.type].defaultProps,
                ...item.props,
                editMode: true,
              };

              const props = defaultedProps;

              return (
                <DropZoneProvider
                  key={item.props.id}
                  value={{
                    ...ctx,
                    isChildHovering,
                    setChildHovering,
                    draggableParentId: id,
                    dropzones: item.dropzones,
                  }}
                >
                  <DraggableComponent
                    isDragDisabled={isDisabled}
                    label={item.type.toString()}
                    id={`draggable-${id}`}
                    index={i}
                    isSelected={selectedIndex === i}
                    isHovering={hoveringIndex === i && !isChildHovering}
                    onClick={(e) => {
                      setSelectedIndex(i);
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
                    <div style={itemStyle}>
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
                background: "var(--puck-color-azure-8)",
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
