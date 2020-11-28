import {
  CHAT_HISTORY,
  CHAT_LIST,
  ACTIVE_CHAT,
  CHAT_THEME,
} from "../actions/types";

const initialState = {
  list: [],
  history: [],
  active: null,
  theme: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CHAT_LIST:
      return { ...state, list: action.payload };
    case ACTIVE_CHAT:
      return { ...state, active: action.payload };
    case CHAT_THEME:
      return {
        ...state,
        theme: { ...state.theme, [action.payload.user]: action.payload.theme },
      };
    case CHAT_HISTORY:
      return {
        ...state,
        history: [...action.payload, ...state.history].slice(0, 10),
      };
    case "RESET":
      return {
        list: [],
        history: [],
        active: null,
        theme: {},
      };

    default:
      return state;
  }
};
