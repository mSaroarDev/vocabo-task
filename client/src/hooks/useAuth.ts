import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  clearError,
  setCredentials,
  type User,
} from "@/store/slices/authSlice";

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
      return result;
    },
    logout: async () => {
      await dispatch(logoutUser()).unwrap();
    },
    clearError: () => dispatch(clearError()),
    setCredentials: (data: { token: string; user: User }) =>
      dispatch(setCredentials(data)),
  };
}