import { GIPHY, SET_LOCKED } from "../actions/types";

const initialState = {
  list: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case GIPHY:
      return { ...state, list: action.payload };

    default:
      return state;
  }
};
