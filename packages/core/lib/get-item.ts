import { Data } from "../types/Config";
import { rootDroppableId } from "./root-droppable-id";

export type ItemSelector = {
  index: number;
  dropzone?: string;
  parentId?: string;
};

export const getItem = (
  selector: ItemSelector,
  data: Data
): Data["content"][0] => {
  if (!selector.parentId || selector.parentId === rootDroppableId) {
    return data.content[selector.index];
  }

  if (!selector.dropzone) {
    throw new Error("Must specify a dropzone if specifying a parentId");
  }

  const parentItem = data.content.find(
    (item) => item.props.id === selector.parentId
  );

  if (!parentItem) {
    throw new Error(
      `Could not find a matching parentItem for id ${selector.parentId}`
    );
  }

  if (!parentItem.dropzones) {
    throw new Error("Parent item does not have any dropzones");
  }

  return parentItem?.dropzones[selector.dropzone][selector.index];
};
