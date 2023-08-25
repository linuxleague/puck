import { Data } from "../types/Config";

export const setupDropzone = (
  data: Data,
  dropzoneKey: string
): Required<Data> => {
  const newData = { ...data };

  newData.dropzones = data.dropzones || {};

  newData.dropzones[dropzoneKey] = newData.dropzones[dropzoneKey] || [];

  return newData as Required<Data>;
};
