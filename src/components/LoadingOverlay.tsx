export default function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        className="card"
        style={{
          padding: 18,
          maxWidth: 420,
          width: "calc(100% - 24px)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800 }}>{text ?? "Loading..."}</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Just a second.
        </div>
      </div>
    </div>
  );
}

