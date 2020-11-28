import {
  ROLL_LATEST_TIMESTAMP,
  VIDEO_MUTED,
  MOPICS_LOADED,
  DARK_THEME,
  MOPICS_ADD,
} from "../actions/types";

const initialState = {
  rollLatestTimestamp: 0,
  mutedVideo: false,
  mopics: [{ id: 0 }],
  mopicsLoadTime: new Date(),
  darkTheme: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case ROLL_LATEST_TIMESTAMP:
      return {
        ...state,
        rollLatestTimestamp: action.payload,
      };
    case VIDEO_MUTED:
      return { ...state, mutedVideo: action.payload };
    case MOPICS_LOADED:
      return { ...state, mopics: action.payload, mopicsLoadTime: new Date() };
    case MOPICS_ADD:
      return {
        ...state,
        mopics: [
          { id: 0 },
          ...action.payload,
          ...state.mopics.slice(1, state.mopics.length),
        ],
      };
    case DARK_THEME:
      return { ...state, darkTheme: action.payload };
    case "RESET":
      return {
        rollLatestTimestamp: 0,
        mutedVideo: false,
        mopics: [{ id: 0 }],
        mopicsLoadTime: new Date(),
        darkTheme: false,
      };
    default:
      return state;
  }
};
