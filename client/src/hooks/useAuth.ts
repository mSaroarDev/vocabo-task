import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  updateProfile as updateProfileAction,
  deleteAccount as deleteAccountAction,
  generateTelegramConnectToken as generateTelegramConnectTokenAction,
  disconnectTelegram as disconnectTelegramAction,
  clearError,
  setCredentials,
  type User,
} from "@/store/slices/authSlice";
import { clearTeams } from "@/store/slices/teamsSlice";
import { clearWorkspaces } from "@/store/slices/workspacesSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isLoading, isAuthenticated, error } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    } else if (!token) {
      dispatch({ type: "auth/setLoading", payload: false });
    }
  }, [dispatch, token, user]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    login: async (email: string, password: string) => {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      return result;
    },
    register: async (name: string, email: string, password: string) => {
      const result = await dispatch(registerUser({ name, email, password })).unwrap();
      dispatch(clearTeams());
      dispatch(clearWorkspaces());
      return result;
    },
    logout: async () => {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearTeams());
      dispatch(clearWorkspaces());
    },
    updateProfile: async (data: { name?: string; email?: string; phone?: string }) => {
      return dispatch(updateProfileAction(data)).unwrap();
    },
    deleteAccount: async () => {
      return dispatch(deleteAccountAction()).unwrap();
    },
    generateTelegramToken: async () => {
      return dispatch(generateTelegramConnectTokenAction()).unwrap();
    },
    disconnectTelegram: async () => {
      await dispatch(disconnectTelegramAction()).unwrap();
      await dispatch(fetchCurrentUser());
    },
    refreshUser: async () => {
      return dispatch(fetchCurrentUser()).unwrap();
    },
    clearError: () => dispatch(clearError()),
    setCredentials: (data: { token: string; user: User }) =>
      dispatch(setCredentials(data)),
  };
}
