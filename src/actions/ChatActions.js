import { CHAT_LIST, CHAT_HISTORY, ACTIVE_CHAT, CHAT_THEME } from "./types";

export const setChatList = (list) => {
  return {
    type: CHAT_LIST,
    payload: list,
  };
};
export const setChatHistory = (history) => {
  return {
    type: CHAT_HISTORY,
    payload: history,
  };
};
export const setActiveChat = (user) => {
  return {
    type: ACTIVE_CHAT,
    payload: user,
  };
};

export const setChatTheme = (user, theme) => {
  return {
    type: CHAT_THEME,
    payload: { user, theme },
  };
};
