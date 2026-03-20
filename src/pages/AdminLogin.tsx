import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import LoadingOverlay from "../components/LoadingOverlay";
import { appReady } from "../lib/firebase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!appReady) return;

    setLoading(true);
    setError(null);
    try {
      const authObj = getAuth();
      const cred = await signInWithEmailAndPassword(authObj, email.trim(), password);
      const token = await cred.user.getIdTokenResult();
      if (token.claims.admin !== true) {
        setError("This account is not an admin.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!appReady) {
    return <LoadingOverlay text="Firebase is not configured yet." />;
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 18, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontWeight: 1000, fontSize: 22 }}>Admin login</div>
        <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
          Sign in with an admin account (requires a Firebase Auth custom claim: <span className="kbd">admin=true</span>).
        </div>

        <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
          <div className="formField">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="formField">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <div className="toast" style={{ marginBottom: 12, borderColor: "rgba(255,92,92,0.35)" }}>
              {error}
            </div>
          ) : null}
          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

