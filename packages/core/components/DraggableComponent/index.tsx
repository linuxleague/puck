import { CSSProperties, ReactNode, SyntheticEvent } from "react";
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
  isLocked = false,
  isDragDisabled,
  forceHover = false,
  style,
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
  isLocked: boolean;
  isDragDisabled?: boolean;
  forceHover?: boolean;
  style?: CSSProperties;
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
            isLocked,
            forceHover,
          })}
          style={{
            ...style,
            ...provided.draggableProps.style,
            cursor: isModifierHeld ? "initial" : "grab",
            zIndex: snapshot.isDragging ? 10 : 0,
          }}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
          onClick={
            onClick
          } /* This may not work if children have interactive background */
        >
          {debug}
          <div className={getClassName("contents")}>{children}</div>

          <div className={getClassName("overlay")}>
            <div className={getClassName("actions")}>
              {label && (
                <div className={getClassName("actionsLabel")}>{label}</div>
              )}
              <button className={getClassName("action")} onClick={onDuplicate}>
                <Copy size={16} />
              </button>
              <button className={getClassName("action")} onClick={onDelete}>
                <Trash size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
