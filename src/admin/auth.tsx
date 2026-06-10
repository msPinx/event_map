import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { storage } from "@/src/utils/storage";

type AdminCtx = {
  pin: string | null;
  setPin: (pin: string | null) => Promise<void>;
  ready: boolean;
};

const Ctx = createContext<AdminCtx>({
  pin: null,
  setPin: async () => {},
  ready: false,
});

const KEY = "admin_pin";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.secureGet<string>(KEY, "");
        if (stored) setPinState(stored);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setPin = async (next: string | null) => {
    if (next) await storage.secureSet(KEY, next);
    else await storage.secureRemove(KEY);
    setPinState(next);
  };

  return <Ctx.Provider value={{ pin, setPin, ready }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  return useContext(Ctx);
}
