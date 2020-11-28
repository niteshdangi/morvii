import { UPLOAD_MOPIC } from "../actions/types";
const initialState = {
  mopics: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case UPLOAD_MOPIC:
      if (action.payload.xhr === null) {
        var newState = {};
        for (var key of Object.keys(state.mopics)) {
          if (state.mopics[key] !== null && action.payload.id !== key) {
            newState[key] = state.mopics[key];
          }
        }
        return { ...state, mopics: newState };
      }
      return {
        ...state,
        mopics: { ...state.mopics, [action.payload.id]: action.payload.xhr },
      };
    case "RESET":
      return { mopics: {} };
    default:
      return state;
  }
};
