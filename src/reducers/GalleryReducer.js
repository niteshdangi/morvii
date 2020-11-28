import {
  GALLERY_SELECTIONS,
  GALLERY_SELECTIONS_REMOVE,
} from "../actions/types";
const initialState = {
  list: [],
  removed: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case GALLERY_SELECTIONS:
      return {
        ...state,
        list: [...state.list, action.payload],
      };
    case GALLERY_SELECTIONS_REMOVE:
      return {
        ...state,
        removed: [...state.removed, action.payload],
      };
    case "RESET":
      return {
        list: [],
        removed: [],
      };
    default:
      return state;
  }
};
