import { createContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../utils/config";
import { saveSession, clearSession, getToken, getUser } from "../utils/storage";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(false);

  // Refresca perfil/roles al abrir la app (evita sesión vieja sin roles)
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            clearSession();
            if (!cancelled) {
              setToken(null);
              setUser(null);
            }
          }
          return;
        }
        const data = await res.json();
        const nextUser = data?.user || data;
        if (!cancelled && nextUser) {
          setUser(nextUser);
          saveSession(token, nextUser);
        }
      } catch {
        /* ignore red de arranque */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      let lastErr;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status >= 500 && attempt < 3) {
              await new Promise((r) => setTimeout(r, 800 * attempt));
              continue;
            }
            throw new Error(data.error || "Error de autenticación");
          }
          saveSession(data.token, data.user);
          setToken(data.token);
          setUser(data.user);
          return true;
        } catch (e) {
          lastErr = e;
          const network =
            e instanceof TypeError || /failed to fetch|network/i.test(String(e.message));
          if (network && attempt < 3) {
            await new Promise((r) => setTimeout(r, 800 * attempt));
            continue;
          }
          if (network) {
            throw new Error(
              "Sin conexión con el servidor. Espera 30–60 s (Render puede estar despertando) y reintenta."
            );
          }
          throw e;
        }
      }
      throw lastErr || new Error("Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, login, logout, loading }),
    [token, user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
