import { UPLOAD_MOPIC } from "./types";

export const setUploadMopic = (id, xhr) => {
  return {
    type: UPLOAD_MOPIC,
    payload: { id, xhr },
  };
};
