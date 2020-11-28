import { SHORT_MODAL, SHORT_MODAL_PROPS } from "./types";

export const setShortModal = (action, type, props = null) => {
  return {
    type: SHORT_MODAL,
    payload: { action, type, props },
  };
};
export const setShortModalProps = (props) => {
  return {
    type: SHORT_MODAL_PROPS,
    payload: props,
  };
};
