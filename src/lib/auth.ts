import {
  User,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { appReady } from "./firebase";

type AuthState = {
  ready: boolean;
  user: User | null;
  authLoading: boolean;
};

export function useAuthBootstrap(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const ready = useMemo(() => appReady, []);

  useEffect(() => {
    if (!ready) return;

    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsub();
  }, [ready]);

  return { ready, user, authLoading };
}

/** Any user in Firebase Auth (email/password, etc.) — no custom claims. */
export function useSignedInUser() {
  const { ready, user, authLoading } = useAuthBootstrap();
  return { ready, authLoading, user, isSignedIn: !!user };
}

