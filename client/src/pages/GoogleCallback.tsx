import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "@/api/client";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing Google sign in...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = localStorage.getItem("google_oauth_state");

    const finish = (result: "success" | "error", msg: string, data?: { user: unknown; token: string }) => {
      setStatus(result);
      setMessage(msg);
      if (result === "success" && data) {
        window.opener?.postMessage(
          { type: "GOOGLE_LOGIN_SUCCESS", token: data.token, user: data.user },
          window.location.origin
        );
      } else {
        window.opener?.postMessage(
          { type: "GOOGLE_LOGIN_ERROR", message: msg },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 1000);
    };

    if (!code) {
      finish("error", "Missing authorization code from Google.");
      return;
    }

    if (state && savedState && state !== savedState) {
      finish("error", "Invalid state parameter. Please try again.");
      return;
    }

    localStorage.removeItem("google_oauth_state");

    apiClient
      .post("/auth/google-login", {
        code,
        redirect_uri:
          import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
          `${window.location.origin}/auth/google/callback`,
      })
      .then((response) => {
        const { user, token } = response.data.data;
        finish("success", "Signed in! Redirecting...", { user, token });
      })
      .catch((error) => {
        const msg =
          error?.response?.data?.message ||
          "Google sign in failed. Please try again.";
        finish("error", msg);
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] flex items-center justify-center px-4">
      <div className="text-center">
        {status === "loading" && (
          <div className="h-8 w-8 mx-auto mb-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        )}
        <p
          className={`text-sm ${
            status === "error" ? "text-destructive" : "text-[#a1a1a1]"
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
