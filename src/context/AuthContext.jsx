import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../lib/api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'repeatrack_token';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t, userFromLogin) => {
    if (t) {
      localStorage.setItem(STORAGE_KEY, t);
      setTokenState(t);
      setAuthToken(t);
      if (userFromLogin) setUser(userFromLogin);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setTokenState(null);
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setToken]);

  const logout = useCallback(() => setToken(null), [setToken]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!token && !!user,
      setToken,
      setUser,
      logout,
    }),
    [token, user, loading, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
