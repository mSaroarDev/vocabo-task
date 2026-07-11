import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./slices/authSlice";
import teamsReducer from "./slices/teamsSlice";
import workspacesReducer from "./slices/workspacesSlice";
import columnsReducer from "./slices/columnsSlice";
import tasksReducer from "./slices/tasksSlice";
import checklistReducer from "./slices/checklistSlice";
import notificationsReducer from "./slices/notificationsSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  teams: teamsReducer,
  workspaces: workspacesReducer,
  columns: columnsReducer,
  tasks: tasksReducer,
  checklist: checklistReducer,
  notifications: notificationsReducer,
});

const migrations = {
  2: (state: any) => {
    const oldSeedTeams = ["Vocabo", "Design Team", "Engineering"];
    const teams = state?.teams?.items;

    if (
      Array.isArray(teams) &&
      teams.length === oldSeedTeams.length &&
      teams.every((team, index) => team?.name === oldSeedTeams[index])
    ) {
      return {
        ...state,
        teams: {
          ...state.teams,
          items: [],
          selectedTeamId: null,
          lastFetched: null,
        },
      };
    }

    return state;
  },
  3: (state: any) => ({
    ...state,
    workspaces: {
      items: [],
      currentTeamId: null,
      isLoading: false,
      lastFetched: null,
      error: null,
    },
  }),
  4: (state: any) => ({
    ...state,
    columns: {
      items: [],
      currentWorkspaceId: null,
      isLoading: false,
      lastFetched: null,
      error: null,
    },
  }),
  5: (state: any) => ({
    ...state,
    checklist: {
      groups: [],
    },
  }),
  6: (state: any) => ({
    ...state,
    checklist: {
      groups: state?.checklist?.groups || [],
      isLoading: false,
      lastFetched: null,
      error: null,
    },
  }),
};

const persistConfig = {
  key: "vocabo-root",
  version: 6,
  storage,
  migrate: createMigrate(migrations, { debug: false }),
  whitelist: ["auth", "teams", "workspaces", "checklist"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
