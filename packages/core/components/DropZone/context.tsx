import { CSSProperties, ReactNode, createContext, useState } from "react";
import { Config, Data } from "../../types/Config";
import { DragStart, DragUpdate } from "react-beautiful-dnd";
import { ItemSelector } from "../../lib/get-item";
import { PuckAction } from "../../lib/reducer";
import { rootDroppableId } from "../../lib/root-droppable-id";

type ContextProps = {
  data: Data;
  config: Config;
  itemSelector: ItemSelector | null;
  setItemSelector: (newIndex: ItemSelector | null) => void;
  dispatch: (action: PuckAction) => void;
  areaId?: string;
  draggedItem?: DragStart & Partial<DragUpdate>;
  placeholderStyle?: CSSProperties;
  hoveringArea?: string | null;
  setHoveringArea?: (area: string | null) => void;
  hoveringDropzone?: string | null;
  setHoveringDropzone?: (dropzone: string | null) => void;
} | null;

export const dropZoneContext = createContext<ContextProps>(null);

export const DropZoneProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: ContextProps;
}) => {
  const [hoveringArea, setHoveringArea] = useState<string | null>(null);
  const [hoveringDropzone, setHoveringDropzone] = useState<string | null>(
    rootDroppableId
  );

  return (
    <>
      {value && (
        <dropZoneContext.Provider
          value={{
            hoveringArea,
            setHoveringArea,
            hoveringDropzone,
            setHoveringDropzone,
            ...value,
          }}
        >
          {children}
        </dropZoneContext.Provider>
      )}
    </>
  );
};
