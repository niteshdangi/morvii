import { GALLERY_SELECTIONS, GALLERY_SELECTIONS_REMOVE } from "./types";

export const setGallerySelection = (action) => {
  return {
    type: GALLERY_SELECTIONS,
    payload: action,
  };
};
export const removeGallerySelection = (action) => {
  return {
    type: GALLERY_SELECTIONS_REMOVE,
    payload: action,
  };
};
