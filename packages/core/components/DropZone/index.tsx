import {
  CSSProperties,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Config, Data } from "../../types/Config";
import { DraggableComponent } from "../DraggableComponent";
import DroppableStrictMode from "../DroppableStrictMode";
import { DragStart } from "react-beautiful-dnd";
import { ItemSelector, getItem } from "../../lib/get-item";
import { PuckAction } from "../../lib/reducer";
import { setupDropzone } from "../../lib/setup-dropzone";
import { rootDroppableId } from "../../lib/root-droppable-id";

const dropZoneContext = createContext<{
  data: Data;
  config: Config;
  itemSelector: ItemSelector | null;
  setItemSelector: (newIndex: ItemSelector | null) => void;
  dispatch: (action: PuckAction) => void;
  setChildHovering?: (isHovering: boolean) => void;
  draggableParentId?: string;
  draggedItem?: DragStart;
  placeholderStyle?: CSSProperties;
} | null>(null);

export const DropZoneProvider = dropZoneContext.Provider;

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

  const [hoveringIndex, setHoveringIndex] = useState<number | undefined>();
  const [isChildHovering, setChildHovering] = useState(false);

  const {
    // These all need setting via context
    data,
    dispatch,
    config,
    itemSelector,
    setItemSelector,
    setChildHovering: setParentChildHovering,
    draggableParentId,
    draggedItem,
    placeholderStyle,
  } = ctx! || {};

  if (!ctx?.config) {
    return <div>DropZone requires context to work.</div>;
  }

  const draggedDroppableId = draggedItem && draggedItem.source.droppableId;
  let content = data.content;
  let dropzone = rootDroppableId;
  let isDisabled = false;
  let sharedParent = false;

  if (draggableParentId && id) {
    dropzone = `${draggableParentId}:${id}`;
    content = setupDropzone(data, dropzone).dropzones[dropzone];
  }

  const item = itemSelector ? getItem(itemSelector, data) : null;
  const isParentSelected = item?.props.id === draggableParentId;

  if (draggedItem) {
    const draggedParentId = dropzone?.split(":")[0];

    sharedParent = draggedParentId === draggedDroppableId?.split(":")[0];

    isDisabled =
      !sharedParent && draggedItem.source.droppableId !== "component-list";

    if (draggedItem.source.droppableId === "component-list") {
      if (!isParentSelected) {
        isDisabled = true;
      }
    }
  }

  return (
    <DroppableStrictMode
      droppableId={dropzone}
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
            position: "relative",
            minHeight: 128,
            height: "100%",
            background:
              snapshot.isDraggingOver ||
              sharedParent ||
              (item && isParentSelected)
                ? "var(--puck-color-azure-9)"
                : "",
            outline:
              snapshot.isDraggingOver ||
              sharedParent ||
              (item && isParentSelected)
                ? "2px dashed"
                : "",
            outlineColor: snapshot.isDraggingOver
              ? "var(--puck-color-azure-3)"
              : sharedParent || isParentSelected
              ? "var(--puck-color-azure-7)"
              : "none",
            outlineOffset: -1,
            width: snapshot.isDraggingOver ? "100%" : "auto",
          }}
          id={dropzone}
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
                    setChildHovering,
                    draggableParentId: componentId,
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
                        dropzone,
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
      )}
    </DroppableStrictMode>
  );
}
