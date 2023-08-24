import { CSSProperties, createContext, useContext, useState } from "react";
import { usePlaceholderStyle } from "../../lib/use-placeholder-style";
import { Config, Data } from "../../types/Config";
import { DraggableComponent } from "../DraggableComponent";
import DroppableStrictMode from "../DroppableStrictMode";

const dropZoneContext = createContext<{
  config: Config;
  selectedIndex: number | null;
  setSelectedIndex: (newIndex: number | null) => void;
  setContent: (data: any) => void;
  setChildHovering?: (isHovering: boolean) => void;
  isChildHovering?: boolean;
  draggableParentId?: string;
} | null>(null);

export const DropZoneProvider = dropZoneContext.Provider;

export function DropZone({
  content,
  droppableId,
  id,
  direction = "vertical",
  style,
  itemStyle,
  isDisabled,
}: {
  content: Data["content"];
  droppableId?: string;
  id?: string;
  direction?: "vertical" | "horizontal";
  style?: CSSProperties;
  itemStyle?: CSSProperties;
  isDisabled?: boolean;
}) {
  const { onDragUpdate, placeholderStyle } = usePlaceholderStyle();

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
  } = ctx;

  return (
    <DroppableStrictMode
      droppableId={droppableId || `${draggableParentId}:${id}`}
      direction={direction}
      isDropDisabled={isDisabled}
    >
      {(provided, snapshot) => (
        <div
          {...(provided || { droppableProps: {} }).droppableProps}
          ref={provided?.innerRef}
          style={{ ...style, zIndex: 1, position: "relative" }}
          id={droppableId}
        >
          {content?.map &&
            content.map((item, i) => {
              //   console.log("content", content);

              const id = item.props.id;

              const renderNested = (
                data: Record<string, any> | string | number
              ) => {
                if (typeof data !== "object") {
                  return data;
                }

                return Object.keys(data).reduce((acc, key) => {
                  const value = data[key];

                  if (Array.isArray(value)) {
                    return { ...acc, [key]: value.map(renderNested) };
                  }

                  if (typeof value === "object") {
                    // if (value.type === "array") {
                    //   return { ...acc, [key]: value.map(renderNested) };
                    // }

                    if (value.type === "dropzone") {
                      return { ...acc, [key]: () => <div>Dropzone</div> };
                    }
                  }

                  return { ...acc, [key]: renderNested(value) };
                }, {});
              };

              //   console.log(
              //     item.type,
              //     config.components[item.type],
              //     renderNested(config.components[item.type].fields)
              //     // reactTreeFromJson({
              //     //   mapping: { dropzone: () => <div>Dropzone</div> },
              //     //   entry: config.components[item.type].fields,
              //     // })
              //   );

              const defaultedProps = {
                ...config.components[item.type].defaultProps,
                ...item.props,
                editMode: true,
              };

              const props = Object.keys(defaultedProps).reduce(
                (acc, propKey) => {
                  const value = item.props[propKey];

                  const fields = config.components[item.type].fields;

                  if (fields) {
                    const field = fields[propKey];

                    if (field?.type === "dropzone") {
                      return {
                        ...acc,
                        [propKey]: (
                          <DropZone id={field.dropzoneId} content={value} />
                        ),
                      };
                    }
                  }

                  return { ...acc, [propKey]: value };
                },
                {}
              );

              return (
                <DropZoneProvider
                  key={item.props.id}
                  value={{
                    ...ctx,
                    isChildHovering,
                    setChildHovering,
                    draggableParentId: id,
                    setContent: (newContent) => {
                      console.log(newContent);

                      console.log(draggableParentId);

                      //   const updatedContent = content.map((item) => {
                      //     if (item.props.id === id) {
                      //       return {
                      //         ...item,
                      //         props: {
                      //           ...item.props,
                      //           [propKey]: newContent,
                      //         },
                      //       };
                      //     }
                      //   });

                      //   setContent
                    },
                  }}
                >
                  <DraggableComponent
                    isDragDisabled={isDisabled}
                    label={item.type.toString()}
                    id={id}
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
                      const newContent = [...content];
                      newContent.splice(i, 1);
                      setSelectedIndex(null);
                      setContent(newContent);
                      e.stopPropagation();
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
        </div>
      )}
    </DroppableStrictMode>
  );
}
