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
    // BroadcastChannel for same-origin tabs (e.g., multiple builder.getalloro.com tabs)
    let channel: BroadcastChannel | null = null;
    
    try {
      channel = new BroadcastChannel("auth_channel");

      channel.onmessage = (event) => {
        const { type, token } = event.data;

        // Use shared domain in production for cross-app auth sync
        const isProduction = window.location.hostname.includes('getalloro.com');
        const domain = isProduction ? '; domain=.getalloro.com' : '';

        if (type === "login" && token) {
          // Another tab logged in - update our token
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${domain}`;
          window.location.reload(); // Hard reload to ensure middleware runs
        } else if (type === "logout") {
          // Another tab logged out - clear our token and redirect
          document.cookie = `auth_token=; path=/; max-age=0${domain}`;
          window.location.href = "/login";
        }
      };
    } catch (e) {
      console.warn("[AuthSync] BroadcastChannel not supported");
    }

    // Storage event for cross-tab sync (alternative approach)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        const isProduction = window.location.hostname.includes('getalloro.com');
        const domain = isProduction ? '; domain=.getalloro.com' : '';

        if (e.newValue) {
          // Token added/updated
          document.cookie = `auth_token=${e.newValue}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${domain}`;
          window.location.reload();
        } else {
          // Token removed
          document.cookie = `auth_token=; path=/; max-age=0${domain}`;
          window.location.href = "/login";
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const logout = () => {
    // Use shared domain in production for cross-app auth sync
    const isProduction = window.location.hostname.includes('getalloro.com');
    const domain = isProduction ? '; domain=.getalloro.com' : '';

    // Clear token from cookie
    document.cookie = `auth_token=; path=/; max-age=0${domain}`;

    // Clear from localStorage (for storage event)
    localStorage.removeItem("auth_token");

    // Broadcast logout event to same-origin tabs
    try {
      const channel = new BroadcastChannel("auth_channel");
      channel.postMessage({ type: "logout" });
      channel.close();
    } catch (e) {
      // BroadcastChannel not supported
    }

    // Redirect to login
    window.location.href = "/login";
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
