import { GIPHY } from "./types";

export const setGiphy = (list) => {
  return {
    type: GIPHY,
    payload: list,
  };
};

export const resetOnLogout = (list) => {
  return {
    type: "RESET",
  };
};
