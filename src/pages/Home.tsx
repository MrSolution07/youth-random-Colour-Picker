import { useEffect, useMemo, useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import Wheel from "../components/Wheel";
import ConfirmForm from "../components/ConfirmForm";
import { appReady } from "../lib/firebase";
import { getOrCreateDeviceId } from "../lib/deviceId";
import { confirmResponse, spinAndReserve } from "../lib/allocations";
import {
  TRIBES,
  WHEEL_SEGMENTS,
  SEGMENT_ANGLE,
  type TribeId,
} from "../lib/tribes";
import { touchDevice } from "../lib/devices";
import ConfettiBurst from "../components/ConfettiBurst";

type Phase = "intro" | "idle" | "spinning" | "form" | "done";

export default function Home() {
  const ready = appReady;

  const [phase, setPhase] = useState<Phase>("intro");
  const [rotationDeg, setRotationDeg] = useState(0);
  const [highlight, setHighlight] = useState<TribeId | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [tribeId, setTribeId] = useState<TribeId | null>(null);
  const [roundIndex, setRoundIndex] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  const tribe = useMemo(() => {
    return tribeId ? TRIBES.find((t) => t.id === tribeId) : null;
  }, [tribeId]);

  useEffect(() => {
    if (!ready) return;
    setDeviceId(getOrCreateDeviceId());
  }, [ready]);

  async function handleSpin() {
    if (!ready) return;
    if (busy || phase === "spinning") return;

    if (!deviceId) {
      setError("Device not ready yet. Please try again.");
      return;
    }

    setError(null);
    setBusy(true);
    setPhase("spinning");
    try {
      await touchDevice({ deviceId });

      const result = await spinAndReserve({ deviceId });

      // Align the pointer with the *tribe label* segment (kind="tribe"),
      // so the form matches what the user sees under the pointer.
      const tribeSegIndex = WHEEL_SEGMENTS.findIndex(
        (s) => s.tribe.id === result.tribeId && s.kind === "tribe",
      );
      if (tribeSegIndex < 0) throw new Error("Invalid tribe id");

      const fullTurns = 6 + Math.floor(Math.random() * 4);
      const targetDeg = -(tribeSegIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
      const finalRotation = rotationDeg + fullTurns * 360 + targetDeg;

      setHighlight(result.tribeId);
      setResponseId(result.responseId);
      setTribeId(result.tribeId);
      setRoundIndex(result.roundIndex);

      requestAnimationFrame(() => setRotationDeg(finalRotation));

      window.setTimeout(() => {
        setPhase("form");
        setBusy(false);
      }, 4400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Spin failed.";
      setError(msg);
      setPhase("idle");
      setHighlight(null);
      setResponseId(null);
      setTribeId(null);
      setRoundIndex(null);
      setBusy(false);
    }
  }

  async function handleConfirm(args: { name: string; whatsapp: string }) {
    if (!responseId || !deviceId) return;
    try {
      await confirmResponse({
        responseId,
        deviceId,
        name: args.name,
        whatsapp: args.whatsapp,
      });
      setConfettiActive(true);
      setPhase("done");

      window.setTimeout(() => {
        setConfettiActive(false);
      }, 2600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
      setPhase("form");
    }
  }

  function handleReset() {
    setPhase("idle");
    setHighlight(null);
    setResponseId(null);
    setTribeId(null);
    setRoundIndex(null);
    setRotationDeg((r) => r % 360);
    setConfettiActive(false);
    setError(null);
  }

  if (!ready) {
    return <LoadingOverlay text="Preparing the wheel..." />;
  }

  if (phase === "intro") {
    return (
      <div className="introScreen" onClick={() => setPhase("idle")}>
        <div className="introContent">
          <div className="introText">ARE YOU<br />READY???</div>
          <div className="introTap">tap anywhere to begin</div>
        </div>
      </div>
    );
  }

  const spinLabel = phase === "spinning" ? "..." : "TAP TO SPIN";
  const showOverlay = phase === "form" || phase === "done";

  return (
    <>
      <ConfettiBurst
        active={confettiActive}
        colors={
          tribe
            ? [tribe.hex, "#ffffff", "#ffe66d", "#a78bfa"]
            : ["#ffffff", "#ffe66d"]
        }
      />

      <div className="tribeWarsPage">
        <div className="phone-frame">
          <div className="topBar">
            <img
              className="churchLogo"
              src="/acts-logo.png"
              alt="Church logo"
            />
            <a
              className="loginIcon"
              href="/admin/login"
              aria-label="Admin login"
              title="Admin login"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </a>
          </div>

          <div className="phoneBody">
            <div className="title-section">
              <h1>TRIBE WARS</h1>
              <p>Spin to choose your Youth Tribe</p>
            </div>

            <Wheel
              rotationDeg={rotationDeg}
              highlight={highlight}
              spinning={phase === "spinning"}
              result={phase === "form" || phase === "done"}
              idle={phase === "idle"}
              onSpin={handleSpin}
              disabled={busy || phase === "form" || phase === "done"}
              buttonLabel={spinLabel}
            />

            {error && <div className="wheelError">{error}</div>}
          </div>
        </div>
      </div>

      {/* Overlay for form / done */}
      {showOverlay && tribe && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget && phase === "done") handleReset(); }}>
          <div
            className="overlayCard"
            style={{
              borderColor: `${tribe.hex}40`,
              background: `linear-gradient(135deg, ${tribe.hex}12 0%, rgba(14,22,48,0.97) 50%)`,
            }}
          >
            {phase === "form" && (
              <>
                <div className="overlayBadge" style={{ color: tribe.hex }}>
                  <span className="overlayDot" style={{ background: tribe.hex }} />
                  {tribe.colorLabel} &middot; {tribe.label}
                </div>
                <div className="overlayHint">
                  Round #{roundIndex ?? "?"} &mdash; Confirm to lock your spot
                </div>
                <div style={{ marginTop: 16 }}>
                  <ConfirmForm onConfirm={handleConfirm} />
                </div>
              </>
            )}

            {phase === "done" && (
              <>
                <div className="overlayBadge" style={{ color: tribe.hex }}>
                  <span className="overlayDot" style={{ background: tribe.hex }} />
                  Welcome to {tribe.label}!
                </div>
                <div className="overlayHint">
                  Your details are saved. Color: {tribe.colorLabel}.
                </div>
                <button className="btn btnOutline" style={{ marginTop: 18, borderColor: `${tribe.hex}40` }} onClick={handleReset}>
                  Spin for another person
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
