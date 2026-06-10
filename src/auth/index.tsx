import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { storage } from "@/src/utils/storage";
import {
  authGoogle,
  authLogin,
  authLogout,
  authMe,
  authRegister,
  authUpdateMe,
  type User,
} from "@/src/api";

const TOKEN_KEY = "auth_token";

type AuthState = {
  user: User | null;
  token: string | null;
  ready: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gdpr_marketing: boolean;
    gdpr_post_event_summary: boolean;
  }) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: Partial<{
    first_name: string;
    last_name: string;
    gdpr_marketing: boolean;
    gdpr_post_event_summary: boolean;
    preferences: Record<string, any>;
  }>) => Promise<void>;
  setUser: (u: User) => void;
};

const Ctx = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback(async (t: string | null) => {
    if (t) await storage.secureSet(TOKEN_KEY, t);
    else await storage.secureRemove(TOKEN_KEY);
    setToken(t);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const u = await authMe(token);
      setUserState(u);
    } catch {
      setUserState(null);
      await persist(null);
    }
  }, [token, persist]);

  // Handle web session_id (Google Auth redirect) on mount
  useEffect(() => {
    (async () => {
      try {
        // Web: parse session_id from URL
        if (Platform.OS === "web") {
          const url = typeof window !== "undefined" ? window.location.href : "";
          const m = url.match(/[#?&]session_id=([^&]+)/);
          if (m) {
            const sid = decodeURIComponent(m[1]);
            try {
              const { user: u, session_token: t } = await authGoogle(sid);
              await persist(t);
              setUserState(u);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", window.location.pathname);
              }
              setReady(true);
              return;
            } catch (e) {
              // fall through to existing-token check
            }
          }
        }
        const stored = await storage.secureGet<string>(TOKEN_KEY, "");
        if (stored) {
          setToken(stored);
          try {
            const u = await authMe(stored);
            setUserState(u);
          } catch {
            await persist(null);
            setUserState(null);
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, [persist]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const { user: u, session_token: t } = await authLogin({ email, password });
    await persist(t);
    setUserState(u);
  }, [persist]);

  const signUpEmail = useCallback(async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    gdpr_marketing: boolean;
    gdpr_post_event_summary: boolean;
  }) => {
    const { user: u, session_token: t } = await authRegister(data);
    await persist(t);
    setUserState(u);
  }, [persist]);

  const signInGoogle = useCallback(async () => {
    if (Platform.OS === "web") {
      const redirect =
        typeof window !== "undefined" ? window.location.origin + "/" : "/";
      const url = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
      return;
    }
    const redirectUrl = Linking.createURL("auth");
    const url = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
    if (result.type !== "success" || !result.url) {
      throw new Error("Přihlášení Googlem bylo zrušeno");
    }
    const m = result.url.match(/[#?&]session_id=([^&]+)/);
    if (!m) throw new Error("Chybí session_id v odpovědi");
    const sid = decodeURIComponent(m[1]);
    const { user: u, session_token: t } = await authGoogle(sid);
    await persist(t);
    setUserState(u);
  }, [persist]);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await authLogout(token);
      } catch {}
    }
    await persist(null);
    setUserState(null);
  }, [token, persist]);

  const updateProfile = useCallback(
    async (data: Parameters<AuthState["updateProfile"]>[0]) => {
      if (!token) throw new Error("Nepřihlášen");
      const u = await authUpdateMe(token, data);
      setUserState(u);
    },
    [token]
  );

  const setUser = useCallback((u: User) => setUserState(u), []);

  return (
    <Ctx.Provider
      value={{
        user,
        token,
        ready,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        refresh,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
