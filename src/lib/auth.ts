import {
  User,
  getAuth,
  onAuthStateChanged,
  type IdTokenResult,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { appReady } from "./firebase";

type AuthState = {
  ready: boolean;
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
};

function getAdminClaim(result: IdTokenResult | null): boolean {
  const claims: Record<string, unknown> = result?.claims ?? {};
  return claims.admin === true;
}

export function useAuthBootstrap(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const ready = useMemo(() => appReady, []);

  useEffect(() => {
    if (!ready) return;

    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(true);
      try {
        if (!u) {
          setIsAdmin(false);
          return;
        }

        const tokenRes = await u.getIdTokenResult();
        setIsAdmin(getAdminClaim(tokenRes));
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, [ready]);

  return { ready, user, isAdmin, authLoading };
}

export function useRequireAdmin() {
  const { ready, isAdmin, user, authLoading } = useAuthBootstrap();
  return {
    ready,
    authLoading,
    user,
    isAdmin,
  };
}

