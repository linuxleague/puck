import { CSSProperties, useState } from "react";
import { DragStart, DragUpdate } from "react-beautiful-dnd";

export const usePlaceholderStyle = () => {
  const queryAttr = "data-rbd-drag-handle-draggable-id";

  const [placeholderStyle, setPlaceholderStyle] = useState<CSSProperties>();

  const onDragStartOrUpdate = (
    draggedItem: DragStart & Partial<DragUpdate>
  ) => {
    const draggableId = draggedItem.draggableId;
    const destinationIndex = (draggedItem.destination || draggedItem.source)
      .index;
    const droppableId = (draggedItem.destination || draggedItem.source)
      .droppableId;

    const domQuery = `[${queryAttr}='${draggableId}']`;
    const draggedDOM = document.querySelector(domQuery);

    if (!draggedDOM) {
      return;
    }

    const targetListElement = document.querySelector(
      `[data-rbd-droppable-id='${droppableId}']`
    );

    const { clientHeight } = draggedDOM;

    if (!targetListElement) {
      return;
    }

    let clientY = 0;

    if (destinationIndex > 0) {
      const children = Array.from(targetListElement.children)
        .filter((item) => item !== draggedDOM)
        .slice(0, destinationIndex + 1);

      clientY = children.reduce(
        (total, item) =>
          total +
          item.clientHeight +
          parseInt(window.getComputedStyle(item).marginTop.replace("px", "")) +
          parseInt(
            window.getComputedStyle(item).marginBottom.replace("px", "")
          ),

        0
      );
    }

    setPlaceholderStyle({
      position: "absolute",
      top: clientY,
      left: 0,
      height: clientHeight,
      width: "100%",
    });
  };

  return { onDragStartOrUpdate, placeholderStyle };
};
