"use client";

import { API_URL } from "@/config";
import { useEffect, useState } from "react";

type TokenResponse = {
  access_token: string;
  token_type: string;
};

export function useDashboardAuth() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("insight_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      setAuthLoading(true);
      const body = new URLSearchParams();
      body.set("username", username);
      body.set("password", password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        throw new Error("Неверный логин или пароль");
      }

      const data = (await res.json()) as TokenResponse;
      setToken(data.access_token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("insight_token", data.access_token);
      }
      setPassword("");
    } catch (e) {
      setAuthError(
        e instanceof Error
          ? e.message
          : "Ошибка авторизации, попробуйте ещё раз"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("insight_token");
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    token,
    authError,
    authLoading,
    handleLogin,
    handleLogout,
  };
}
