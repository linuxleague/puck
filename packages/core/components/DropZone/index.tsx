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
import { getClassNameFactory } from "../../lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("DropZone", styles);

const dropZoneContext = createContext<{
  data: Data;
  config: Config;
  itemSelector: ItemSelector | null;
  setItemSelector: (newIndex: ItemSelector | null) => void;
  dispatch: (action: PuckAction) => void;
  setChildDropzoneItemHovering?: (isHovering: boolean) => void;
  draggableParentId?: string;
  draggedItem?: DragStart;
  placeholderStyle?: CSSProperties;
  deepestHoverId?: string;
  setDeepestHoverId?: (id: string) => void;
  parentHovering?: boolean;
  hovingItemId?: string | null;
  setHoveringItemId?: (id: string | null) => void;
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

  const {
    // These all need setting via context
    data,
    dispatch,
    config,
    itemSelector,
    setItemSelector,
    draggableParentId,
    draggedItem,
    placeholderStyle,
    parentHovering = false,
  } = ctx! || {};

  // Refers to dropzone. Only gets set on root. Could move outside of DropZone component.
  const [deepestHoverId, setDeepestHoverId] = useState(rootDroppableId);

  // These refer to items inside dropzones
  const [hoveringItemIndex, setHoveringItemIndex] = useState<
    number | undefined
  >();
  // Only gets set if the item contains a dropzone
  const [hovingItemId, setHoveringItemId] = useState<string | null>();

  let content = data.content;
  let dropzone = rootDroppableId;
  let isDisabled = false;
  let isInteractionDisabled = false;
  let sharedParent = false;

  if (draggableParentId && id) {
    dropzone = `${draggableParentId}:${id}`;
    content = setupDropzone(data, dropzone).dropzones[dropzone];
  }

  const isRootDropzone = dropzone === rootDroppableId;

  const resolvedDeepestHover =
    ctx?.deepestHoverId || deepestHoverId || rootDroppableId;
  const resolvedHoveringItemId = ctx?.hovingItemId || hovingItemId || null;

  const draggedSourceId = draggedItem && draggedItem.source.droppableId;

  // Parent IDs
  const [dropzoneParentId] = dropzone.split(":");
  const [deepestHoverParentId] = resolvedDeepestHover.split(":");
  const [draggedSourceParentId] = draggedSourceId
    ? draggedSourceId?.split(":")
    : "";

  const deepestHoverIsSelf = deepestHoverParentId === dropzoneParentId;

  const isDraggingOver = !!draggedItem;

  const ctxSetHoveringItemId = ctx?.setHoveringItemId || setHoveringItemId;

  useEffect(() => {
    if (typeof hoveringItemIndex !== "undefined") {
      // check if current item has any dropzones
      const currentItem = getItem(
        { dropzone, index: hoveringItemIndex! },
        data
      );

      if (currentItem) {
        const itemContainsNestedDropzones = !!Object.keys(
          ctx?.data.dropzones || {}
        ).find(
          (dropzoneKey) => dropzoneKey.split(":")[0] === currentItem.props.id
        );

        if (itemContainsNestedDropzones) {
          ctxSetHoveringItemId(currentItem.props.id);

          return;
        }
      }
    }

    if (deepestHoverIsSelf) {
      ctxSetHoveringItemId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveringItemIndex, data, ctxSetHoveringItemId]);

  const item = itemSelector ? getItem(itemSelector, data) : null;
  const isParentSelected = item?.props.id === draggableParentId;

  const [isHovering, setIsHovering] = useState(false);

  const draggingNewComponent =
    draggedItem?.source.droppableId === "component-list";

  if (isDraggingOver) {
    sharedParent = dropzoneParentId === draggedSourceParentId;

    isDisabled = !sharedParent && !draggingNewComponent;

    if (draggingNewComponent) {
      isDisabled = !deepestHoverIsSelf;

      if (
        resolvedHoveringItemId
          ? resolvedHoveringItemId !== dropzoneParentId
          : false
      ) {
        isDisabled = true;
      }
    } else {
      if (!sharedParent) {
        isInteractionDisabled = true;
      } else if (!isHovering) {
        isInteractionDisabled = true;
      }
    }
  }

  if (!ctx?.config) {
    return <div>DropZone requires context to work.</div>;
  }

  const onMouseOver = (event) => {
    if (!isDisabled || draggingNewComponent) {
      event.stopPropagation();
    }

    setIsHovering(true);
    setDeepestHoverId(dropzone);
    if (ctx.setDeepestHoverId) ctx.setDeepestHoverId(dropzone);
  };

  const onMouseOut = () => {
    setDeepestHoverId(rootDroppableId);
    setIsHovering(false);
    if (ctx.setDeepestHoverId) ctx.setDeepestHoverId(rootDroppableId);
  };

  return (
    <DroppableStrictMode
      droppableId={dropzone}
      direction={direction}
      isDropDisabled={isDisabled || isInteractionDisabled}
    >
      {(provided, snapshot) => {
        let dropzoneVisible = false;

        if (!isRootDropzone) {
          if (!isDisabled) {
            if (snapshot.isDraggingOver) {
              dropzoneVisible = true;
            } else if (sharedParent) {
              dropzoneVisible = true;
            } else if (deepestHoverIsSelf) {
              dropzoneVisible = true;
            } else if (parentHovering) {
              dropzoneVisible = true;
            } else if (isParentSelected) {
              dropzoneVisible = true;
            }
          }
        }

        return (
          <div
            className={getClassName()}
            {...(provided || { droppableProps: {} }).droppableProps}
            ref={provided?.innerRef}
            style={{
              ...style,
              marginLeft: "auto",
              marginRight: "auto",
              zoom: 1.33,
              position: "relative",
              minHeight: 128,
              height: "100%",
              background: dropzoneVisible ? "var(--puck-color-azure-9)" : "",
              outline: dropzoneVisible
                ? `2px dashed var(--puck-color-azure-${
                    snapshot.isDraggingOver ? "3" : "7"
                  })`
                : "",
              outlineOffset: -1,
              width: "100%",
            }}
            id={dropzone}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
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
                  (itemSelector &&
                    getItem(itemSelector, data)?.props.id === componentId) ||
                  false;

                let isHovering = false;

                if (hoveringItemIndex === i && !isDraggingOver) {
                  isHovering = true;
                } else if (
                  isDraggingOver &&
                  componentId === resolvedHoveringItemId &&
                  componentId === deepestHoverParentId
                ) {
                  // TODO this is triggering when it shouldn't.
                  isHovering = true;
                } else if (componentId === deepestHoverParentId) {
                  if (isDraggingOver) {
                    if (
                      draggingNewComponent ||
                      draggedSourceParentId === componentId
                    ) {
                      isHovering = true;
                    }
                  } else {
                    isHovering = true;
                  }
                }

                return (
                  <div key={item.props.id} className={getClassName("item")}>
                    <DropZoneProvider
                      value={{
                        ...ctx,
                        draggableParentId: componentId,
                        setDeepestHoverId:
                          ctx.setDeepestHoverId || setDeepestHoverId,
                        deepestHoverId: ctx.deepestHoverId || deepestHoverId,
                        setHoveringItemId:
                          ctx.setHoveringItemId || setHoveringItemId,
                        hovingItemId: ctx.hovingItemId || hovingItemId,
                        parentHovering: i === hoveringItemIndex,
                      }}
                    >
                      <DraggableComponent
                        isDragDisabled={isDisabled}
                        label={item.type.toString()}
                        id={`draggable-${componentId}`}
                        index={i}
                        isSelected={isSelected}
                        isHovering={isHovering}
                        onClick={(e) => {
                          setItemSelector({
                            index: i,
                            dropzone,
                          });
                          e.stopPropagation();
                        }}
                        onMouseOver={() => {
                          setHoveringItemIndex(i);
                        }}
                        onMouseOut={() => {
                          setHoveringItemIndex(undefined);
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
                        style={{
                          pointerEvents: draggingNewComponent ? "all" : "unset",
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
                    {isDraggingOver && (
                      <div
                        className={getClassName("hitbox")}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
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
  );
}
