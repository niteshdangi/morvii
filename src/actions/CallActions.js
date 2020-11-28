import { CALL_STATUS } from "./types";

export const setCallStatus = (status) => {
  return {
    type: CALL_STATUS,
    payload: status,
  };
};
