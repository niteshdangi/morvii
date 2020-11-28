import { SET_LOCKED, SET_LOGGED_IN } from "../actions/types";

const initialState = {
  isLoggedIn: false,
  token: null,
  user: null,
  locked: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_LOGGED_IN:
      return {
        ...state,
        isLoggedIn: action.payload.state,
        token: action.payload.token,
        user: action.payload.user,
        locked: {},
      };
    case "RESET":
      return {
        isLoggedIn: false,
        token: null,
        user: null,
        locked: {},
      };
    case SET_LOCKED:
      return {
        ...state,
        locked: {
          ...state.locked,
          [action.payload.username]: action.payload.date,
        },
      };
    default:
      return state;
  }
};
