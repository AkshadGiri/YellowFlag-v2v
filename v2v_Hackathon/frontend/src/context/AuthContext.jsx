import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, getMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("csn_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, verify it's still valid and refresh the user.
  useEffect(() => {
    const token = localStorage.getItem("csn_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("csn_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("csn_token");
        localStorage.removeItem("csn_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (data) => {
    const { token, ...userFields } = data;
    localStorage.setItem("csn_token", token);
    localStorage.setItem("csn_user", JSON.stringify(userFields));
    setUser(userFields);
  };

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    persistSession(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    persistSession(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("csn_token");
    localStorage.removeItem("csn_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
