import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../lib/api";
import { clearToken, getToken } from "../lib/http";

const AuthContext = createContext(null);

// ALTERAÇÃO (migração Supabase -> PostgreSQL próprio): a sessão agora é um token
// JWT emitido pela API (guardado em localStorage). Ao abrir o app, validamos o
// token com GET /auth/me; se a API responder 401 em qualquer momento, o evento
// "auth:expired" (disparado em lib/http.js) leva o usuário de volta ao login.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restaura a sessão ao carregar
  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setLoading(false);
      return undefined;
    }

    api.fetchCurrentUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data?.user || null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sessão expirada / token inválido
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);

    if (!email.trim()) {
      setError("Preencha o e-mail");
      return { ok: false };
    }
    if (!password) {
      setError("Preencha a senha");
      return { ok: false };
    }

    const { data, error: signInError } = await api.signInWithPassword(email, password);
    if (signInError || !data?.user) {
      const msg = signInError?.message || "Erro ao fazer login";
      setError(msg);
      return { ok: false, error: { message: msg } };
    }

    setUser(data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    setUser(null);
    clearToken();
    return { ok: true };
  }, []);

  const wrap = useCallback(async (action) => {
    setError(null);
    const result = await action();
    if (result.error) {
      setError(result.error.message);
      return { ok: false, error: result.error };
    }
    return { ok: true, data: result.data };
  }, []);

  const resetPassword = useCallback((email) => wrap(() => api.sendPasswordResetEmail(email)), [wrap]);

  const confirmPasswordReset = useCallback(
    (token, newPassword) => wrap(() => api.resetPasswordWithToken(token, newPassword)),
    [wrap]
  );

  const updatePassword = useCallback(
    (currentPassword, newPassword) => wrap(() => api.updatePassword(currentPassword, newPassword)),
    [wrap]
  );

  const updateEmail = useCallback(
    async (newEmail, currentPassword) => {
      const result = await wrap(() => api.updateEmail(newEmail, currentPassword));
      if (result.ok && result.data?.user) setUser(result.data.user);
      return result;
    },
    [wrap]
  );

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    resetPassword,
    confirmPasswordReset,
    updatePassword,
    updateEmail,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return context;
}
