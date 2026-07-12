import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type PersistConfig,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./slices/authSlice";
import teamsReducer from "./slices/teamsSlice";
import workspacesReducer from "./slices/workspacesSlice";
import columnsReducer from "./slices/columnsSlice";
import tasksReducer from "./slices/tasksSlice";
import checklistReducer from "./slices/checklistSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  teams: teamsReducer,
  workspaces: workspacesReducer,
  columns: columnsReducer,
  tasks: tasksReducer,
  checklist: checklistReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

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

const persistConfig: PersistConfig<RootState> = {
  key: "vocabo-root",
  version: 6,
  storage,
  migrate: createMigrate(migrations, { debug: false }),
  whitelist: ["auth", "teams", "workspaces", "checklist"],
  transforms: [
    createTransform(
      (state: any) => {
        const { lastFetched, isLoading, error, ...rest } = state;
        return rest;
      },
      (state: any) => {
        const { lastFetched, isLoading, error, ...rest } = state;
        return rest;
      },
      { whitelist: ["teams"] }
    ),
  ],
};

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer as any,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
