import {
  ROLL_LATEST_TIMESTAMP,
  VIDEO_MUTED,
  MOPICS_LOADED,
  DARK_THEME,
  MOPICS_ADD,
} from "./types";

export const setRollTimestamp = (stamp) => {
  return {
    type: ROLL_LATEST_TIMESTAMP,
    payload: stamp,
  };
};
export const setVideoMuted = (muted) => {
  return {
    type: VIDEO_MUTED,
    payload: muted,
  };
};

export const setMopics = (mopics) => {
  return {
    type: MOPICS_LOADED,
    payload: mopics,
  };
};
export const addMopics = (mopics) => {
  return {
    type: MOPICS_ADD,
    payload: mopics,
  };
};

export const setDarkTheme = (dark) => {
  return {
    type: DARK_THEME,
    payload: dark,
  };
};
