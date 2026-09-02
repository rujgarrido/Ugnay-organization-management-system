import { useEffect, useState, type ReactNode } from "react";
import { api } from "../../lib/axios";
import { setAccessToken, clearAccessToken } from "../../lib/auth-token";
import { AuthContext } from "./auth-context";
import type { AuthResponse, User } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load, try to silently exchange the refresh-token cookie for a
  // new access token — this is what makes a page reload NOT log you out.
  useEffect(() => {
    async function bootstrap() {
      try {
        const { data } = await api.post<{ data: AuthResponse }>("/auth/refresh");
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}