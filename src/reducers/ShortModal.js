import { SHORT_MODAL, SHORT_MODAL_PROPS } from "../actions/types";
const initialState = {
  action: false,
  type: "PROFILE",
  props: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SHORT_MODAL:
      return {
        ...state,
        action: action.payload.action,
        type: action.payload.type,
        props: action.payload.props ? action.payload.props : state.props,
      };
    case SHORT_MODAL_PROPS:
      return {
        ...state,
        props: action.payload,
      };
    default:
      return state;
  }
};
