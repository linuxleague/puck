import {
  CSSProperties,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Config, Data } from "../../types/Config";
import { DragStart, DragUpdate } from "react-beautiful-dnd";
import { ItemSelector } from "../../lib/get-item";
import { PuckAction } from "../../lib/reducer";
import { rootDroppableId } from "../../lib/root-droppable-id";
import { useDebounce } from "use-debounce";

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
  registerDropzoneArea?: (areaId: string) => void;
  areasWithDropzones?: Record<string, boolean>;
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

  const [hoveringAreaDb] = useDebounce(hoveringArea, 75, { leading: false });

  const [areasWithDropzones, setAreasWithDropzones] = useState<
    Record<string, boolean>
  >({});

  const registerDropzoneArea = useCallback(
    (area: string) => {
      console.log("registering", area, areasWithDropzones);
      setAreasWithDropzones((latest) => ({ ...latest, [area]: true }));
    },
    [setAreasWithDropzones, areasWithDropzones]
  );

  return (
    <>
      {value && (
        <dropZoneContext.Provider
          value={{
            hoveringArea: hoveringAreaDb,
            setHoveringArea,
            hoveringDropzone,
            setHoveringDropzone,
            registerDropzoneArea,
            areasWithDropzones,
            ...value,
          }}
        >
          {children}
        </dropZoneContext.Provider>
      )}
    </>
  );
};
