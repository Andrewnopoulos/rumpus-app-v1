// Wraps @rumpusroom/auth-client in a React context. Owns the single
// RumpusClient instance, the session state, and the actions the launcher needs
// beyond the client (magic link, select/deselect profile, create profile).
//
// The launcher works for any authenticated user regardless of entitlements, so
// it never calls isAppUnlocked() — entitlements only drive the kid app grid.

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RumpusClient } from "@rumpusroom/auth-client";
import type { MeResponse } from "@rumpusroom/auth-client";
import {
  API_BASE,
  createProfileApi,
  deselectProfileApi,
  requestMagicLink as requestMagicLinkApi,
  selectProfileApi,
  type CreatedProfile,
} from "../lib/api";

export type AuthStatus = "loading" | "ready";

export interface AuthContextValue {
  status: AuthStatus;
  session: MeResponse | null;
  refresh: () => Promise<MeResponse>;
  signOut: () => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  selectProfile: (profileId: string) => Promise<void>;
  deselectProfile: () => Promise<void>;
  createProfile: (body: {
    display_name: string;
    avatar_id: number;
    age_band?: string | null;
  }) => Promise<CreatedProfile>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<RumpusClient>();
  if (!clientRef.current) {
    clientRef.current = new RumpusClient({ appSlug: "launcher", apiBase: API_BASE });
  }
  const rumpus = clientRef.current;

  const [session, setSession] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;

    // Any of the client's events means the session may have changed; mirror it.
    const offs = (["session-changed", "session-expired", "entitlement-changed"] as const).map(
      (evt) => rumpus.on(evt, (res) => active && setSession(res)),
    );

    rumpus
      .getSession()
      .then((res) => active && setSession(res))
      .catch(() => active && setSession({ authenticated: false }))
      .finally(() => active && setStatus("ready"));

    return () => {
      active = false;
      offs.forEach((off) => off());
    };
  }, [rumpus]);

  const refresh = useCallback(async () => {
    const res = await rumpus.refresh();
    setSession(res);
    return res;
  }, [rumpus]);

  const signOut = useCallback(async () => {
    await rumpus.signOut(); // fires session-changed with the unauthenticated state
  }, [rumpus]);

  const requestMagicLink = useCallback(async (email: string) => {
    await requestMagicLinkApi(email);
  }, []);

  const selectProfile = useCallback(
    async (profileId: string) => {
      await selectProfileApi(profileId);
      await refresh();
    },
    [refresh],
  );

  const deselectProfile = useCallback(async () => {
    await deselectProfileApi();
    await refresh();
  }, [refresh]);

  const createProfile = useCallback(
    async (body: { display_name: string; avatar_id: number; age_band?: string | null }) => {
      const created = await createProfileApi(body);
      await refresh();
      return created;
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      refresh,
      signOut,
      requestMagicLink,
      selectProfile,
      deselectProfile,
      createProfile,
    }),
    [status, session, refresh, signOut, requestMagicLink, selectProfile, deselectProfile, createProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
