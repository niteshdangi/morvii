import { CALL_STATUS } from "../actions/types";

const initialState = {
  status: 0,
  user: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CALL_STATUS:
      return {
        ...state,
        status: action.payload.status,
        user: action.payload.user,
      };
    case "RESET":
      return { status: 0, user: null };

    default:
      return state;
  }
};
