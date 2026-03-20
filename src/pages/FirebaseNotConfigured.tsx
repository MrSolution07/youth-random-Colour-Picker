import { appReady } from "../lib/firebase";

export default function FirebaseNotConfigured() {
  return (
    <div className="container">
      <div className="card" style={{ padding: 18, maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontWeight: 1000, fontSize: 22 }}>Firebase not configured</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
          Add your Firebase credentials to <span className="kbd">.env.local</span> (based on{" "}
          <span className="kbd">.env.example</span>), then restart the dev server.
        </div>
        <div style={{ marginTop: 14 }} className="toast">
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Required variables</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <code>VITE_FIREBASE_API_KEY</code>
            <br />
            <code>VITE_FIREBASE_AUTH_DOMAIN</code>
            <br />
            <code>VITE_FIREBASE_PROJECT_ID</code>
            <br />
            <code>VITE_FIREBASE_STORAGE_BUCKET</code>
            <br />
            <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>
            <br />
            <code>VITE_FIREBASE_APP_ID</code>
          </div>
        </div>
        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Current appReady state: <span className="kbd">{String(appReady)}</span>
        </div>
      </div>
    </div>
  );
}

