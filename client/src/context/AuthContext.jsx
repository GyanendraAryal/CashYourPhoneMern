import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function ensureCsrf() {
    // Safe to call multiple times (your api.js caches csrfToken)
    await api.get("/api/v1/csrf");
  }

  // Bootstrap session from cookie using /me
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        // optional: get csrf early so first auth action never 403s
        await ensureCsrf();

        const res = await api.get("/api/v1/user/me");
        if (mounted) setUser(res.data?.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setBooting(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(emailOrPhone, password) {
    await ensureCsrf();
    const res = await api.post("/api/v1/user/login", { emailOrPhone, password });
    setUser(res.data?.user || null);
    return res;
  }

  async function register(payload) {
    await ensureCsrf();
    const res = await api.post("/api/v1/user/register", payload);
    setUser(res.data?.user || null);
    return res;
  }

  async function logout() {
    try {
      await ensureCsrf();
      await api.post("/api/v1/user/logout");
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthCtx.Provider value={{ user, booting, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
