import { ReactNode, SyntheticEvent } from "react";
import { Draggable } from "react-beautiful-dnd";
import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { Copy, Trash } from "react-feather";
import { useModifierHeld } from "../../lib/use-modifier-held";

const getClassName = getClassNameFactory("DraggableComponent", styles);

export const DraggableComponent = ({
  children,
  id,
  index,
  isSelected = false,
  onClick = () => null,
  onMouseOver = () => null,
  onMouseOut = () => null,
  onDelete = () => null,
  onDuplicate = () => null,
  debug,
  label,
  isHovering = false,
  isDragDisabled,
}: {
  children: ReactNode;
  id: string;
  index: number;
  isSelected?: boolean;
  onClick?: (e: SyntheticEvent) => void;
  onMouseOver?: (e: SyntheticEvent) => void;
  onMouseOut?: (e: SyntheticEvent) => void;
  onDelete?: (e: SyntheticEvent) => void;
  onDuplicate?: (e: SyntheticEvent) => void;
  debug?: string;
  label?: string;
  isHovering: boolean;
  isDragDisabled?: boolean;
}) => {
  const isModifierHeld = useModifierHeld("Alt");

  return (
    <Draggable
      key={id}
      draggableId={id}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={getClassName({
            isSelected,
            isModifierHeld,
            isDragging: snapshot.isDragging,
          })}
          style={{
            ...provided.draggableProps.style,
            cursor: isModifierHeld ? "initial" : "grab",
          }}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        >
          {debug}
          <div className={getClassName("contents")}>{children}</div>
          {isHovering && (
            <div className={getClassName("overlay")} onClick={onClick}>
              <div className={getClassName("actions")}>
                {label && (
                  <div className={getClassName("actionsLabel")}>{label}</div>
                )}
                <button
                  className={getClassName("action")}
                  onClick={onDuplicate}
                >
                  <Copy />
                </button>
                <button className={getClassName("action")} onClick={onDelete}>
                  <Trash />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
