import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import {
  persistStore,
  persistReducer,
  persistCombineReducers,
} from "redux-persist";
import createSecureStore from "redux-persist-expo-securestore";
import AsyncStorage from "@react-native-community/async-storage";
import {
  HomeReducer,
  LoginReducer,
  ShortModal,
  ChatReducer,
  TempReducer,
  UploadMopic,
  CallReducer,
} from "./reducers";
const persistConfig = {
  key: "main",
  storage: AsyncStorage,
  blacklist: ["ShortModal", "TempReducer", "UploadMopic"],
};
const secureStorage = createSecureStore();

const securePersistConfig = {
  key: "secure",
  storage: secureStorage,
};
const rootReducers = combineReducers({
  main: persistReducer(
    persistConfig,
    combineReducers({
      HomeReducer,
      ShortModal,
      ChatReducer,
      TempReducer,
      UploadMopic,
      CallReducer,
    })
  ),
  secure: persistReducer(
    securePersistConfig,
    combineReducers({ auth: LoginReducer })
  ),
});
// const pReducer = persistReducer(persistConfig, rootReducers);
const middleware = applyMiddleware(thunk);
const store = createStore(rootReducers, middleware);
const persistor = persistStore(store);
export { persistor, store };
