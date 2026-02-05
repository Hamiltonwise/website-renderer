"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthSyncContextType {
  logout: () => void;
}

const AuthSyncContext = createContext<AuthSyncContextType | null>(null);

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth events from other tabs/apps
    const channel = new BroadcastChannel("auth_channel");

    channel.onmessage = (event) => {
      const { type, token } = event.data;

      if (type === "login" && token) {
        // Another app logged in - update our token
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        router.refresh();
      } else if (type === "logout") {
        // Another app logged out - clear our token and redirect
        document.cookie = "auth_token=; path=/; max-age=0";
        router.push("/login");
        router.refresh();
      }
    };

    return () => {
      channel.close();
    };
  }, [router]);

  const logout = () => {
    // Clear token
    document.cookie = "auth_token=; path=/; max-age=0";

    // Broadcast logout event
    const channel = new BroadcastChannel("auth_channel");
    channel.postMessage({ type: "logout" });
    channel.close();

    // Redirect to login
    router.push("/login");
    router.refresh();
  };

  return (
    <AuthSyncContext.Provider value={{ logout }}>
      {children}
    </AuthSyncContext.Provider>
  );
}

export function useAuthSync() {
  const context = useContext(AuthSyncContext);
  if (!context) {
    throw new Error("useAuthSync must be used within AuthSyncProvider");
  }
  return context;
}
