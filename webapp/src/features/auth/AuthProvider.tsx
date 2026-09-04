import { useEffect, useState, type ReactNode } from "react";
import { api } from "../../lib/axios";
import { setAccessToken, clearAccessToken } from "../../lib/auth-token";
import { AuthContext } from "./auth-context";
import type { AuthResponse, User } from "./types/auth";

let bootstrapPromise: Promise<AuthResponse> | null = null;

function bootstrapSession() {
  if (!bootstrapPromise) {
    bootstrapPromise = api
      .post<{ data: AuthResponse }>("/auth/refresh")
      .then(({ data }) => data.data)
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await api.get("/auth/csrf");
        const data = await bootstrapSession();
        if (!isMounted) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        if (!isMounted) return;
        clearAccessToken();
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}