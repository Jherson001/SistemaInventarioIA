import { createContext, useMemo, useState } from "react";
import { API_BASE_URL } from "../utils/config";
import { saveSession, clearSession, getToken, getUser } from "../utils/storage";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser]   = useState(getUser());
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de autenticación');
      saveSession(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, logout, loading }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
