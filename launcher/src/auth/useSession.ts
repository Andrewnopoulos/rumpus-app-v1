import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthProvider";

/** Consume the auth context. Throws if used outside <AuthProvider>. */
export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession must be used within <AuthProvider>.");
  }
  return ctx;
}
