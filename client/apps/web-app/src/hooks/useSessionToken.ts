import { useState, useCallback } from "react";

export const useSessionToken = () => {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("checkout-token") : null
  );

  const saveToken = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem("checkout-token", newToken);
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
    localStorage.removeItem("checkout-token");
  }, []);

  const isTokenValid = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }, []);

  return { token, saveToken, clearToken, isTokenValid };
};