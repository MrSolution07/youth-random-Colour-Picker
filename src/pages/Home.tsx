import { useEffect, useMemo, useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import Wheel from "../components/Wheel";
import ConfirmForm from "../components/ConfirmForm";
import { useAuthBootstrap } from "../lib/auth";
import { getOrCreateDeviceId } from "../lib/deviceId";
import { confirmResponse, spinAndReserve } from "../lib/allocations";
import { TRIBES, type TribeId, TRIBE_SECTOR_ANGLE } from "../lib/tribes";
import { touchDevice } from "../lib/devices";
import ConfettiBurst from "../components/ConfettiBurst";

type Phase = "idle" | "spinning" | "form" | "done";

export default function Home() {
  const { ready, user } = useAuthBootstrap();

  const [phase, setPhase] = useState<Phase>("idle");
  const [rotationDeg, setRotationDeg] = useState(0);
  const [highlight, setHighlight] = useState<TribeId | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [tribeId, setTribeId] = useState<TribeId | null>(null);
  const [roundIndex, setRoundIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  const tribe = useMemo(() => {
    return tribeId ? TRIBES.find((t) => t.id === tribeId) : null;
  }, [tribeId]);

  useEffect(() => {
    if (!ready || !user) return;
    // Ensure we have a device id early so we can store it on spin.
    getOrCreateDeviceId();
  }, [ready, user]);

  async function handleSpin() {
    if (!ready || !user) return;
    if (busy) return;

    setError(null);
    setBusy(true);
    setPhase("spinning");

    const deviceId = getOrCreateDeviceId();
    try {
      await touchDevice({ deviceId, userUid: user.uid });

      // Reserve the quota-balanced result first, then animate to it.
      const result = await spinAndReserve({
        userUid: user.uid,
        deviceId,
      });

      const targetIndex = TRIBES.findIndex((t) => t.id === result.tribeId);
      if (targetIndex < 0) throw new Error("Invalid tribe id");

      // Spin direction: rotate wheel counter-clockwise to bring target sector to top.
      const fullTurns = 5 + Math.floor(Math.random() * 3);
      const targetDeg = -(targetIndex * TRIBE_SECTOR_ANGLE);
      const finalRotation = rotationDeg + fullTurns * 360 + targetDeg;

      setHighlight(result.tribeId);
      setResponseId(result.responseId);
      setTribeId(result.tribeId);
      setRoundIndex(result.roundIndex);

      // Let the wheel render before transitioning (small UX polish).
      requestAnimationFrame(() => setRotationDeg(finalRotation));

      // After animation ends, prompt for confirmation.
      window.setTimeout(() => setPhase("form"), 2800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Spin failed.";
      setError(msg);
      setPhase("idle");
      setHighlight(null);
      setResponseId(null);
      setTribeId(null);
      setRoundIndex(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm(args: { name: string; whatsapp: string }) {
    if (!user || !responseId) return;
    await confirmResponse({
      responseId,
      userUid: user.uid,
      name: args.name,
      whatsapp: args.whatsapp,
    });
    setConfettiActive(true);
    setPhase("done");

    window.setTimeout(() => {
      setConfettiActive(false);
    }, 2600);
  }

  if (!ready) {
    return <LoadingOverlay text="Preparing the wheel..." />;
  }

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
      <div className="container">
      <div className="grid2">
        <div className="card" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.2 }}>Spin & get your Youth Tribe</div>
              <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                Quota-balanced for the first 20 picks: 5 per tribe. Good luck!
              </div>
            </div>
            <div className="pill">
              <span className="kbd">1</span>
              <span className="muted" style={{ fontSize: 13 }}>Spin</span>
              <span className="kbd">2</span>
              <span className="muted" style={{ fontSize: 13 }}>Confirm</span>
            </div>
          </div>

          <div className="center" style={{ marginTop: 18, paddingBottom: 8 }}>
            <div style={{ position: "relative" }}>
              <Wheel
                rotationDeg={rotationDeg}
                highlight={highlight}
                spinning={phase === "spinning"}
              />
            </div>
          </div>

          <div className="center" style={{ marginTop: 16 }}>
            <button
              className="btn btnPrimary"
              onClick={handleSpin}
              disabled={busy || phase === "spinning"}
              aria-label="Spin the wheel"
            >
              {phase === "spinning" ? "Spinning..." : "SPIN"}
            </button>
          </div>

          {error ? (
            <div className="toast" style={{ marginTop: 12, borderColor: "rgba(255,92,92,0.35)" }}>
              {error}
            </div>
          ) : null}
        </div>

        <div className="card" style={{ padding: 18 }}>
          {phase === "idle" ? (
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Ready?</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                Press the button and we’ll assign you to one of the tribes:
                <span style={{ display: "block", marginTop: 10 }}>
                  Scarlet (Red), Skyline (Blue), Sunfire (Yellow), Earth bound (Green)
                </span>
              </div>
            </div>
          ) : null}

          {phase === "spinning" ? (
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Choosing your tribe...</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                The wheel is locked to a quota-balanced result.
              </div>
            </div>
          ) : null}

          {phase === "form" && tribe ? (
            <div>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>You got: {tribe.colorLabel} / {tribe.label}</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                Round #{roundIndex ?? "?"} • Please confirm your details.
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: `radial-gradient(500px 180px at 20% 10%, ${tribe.hex}40, transparent), rgba(255,255,255,0.06)`,
                }}
              >
                <div className="muted" style={{ fontSize: 12 }}>Your spot is reserved. Enter your info:</div>
                <div style={{ marginTop: 10 }}>
                  <ConfirmForm onConfirm={handleConfirm} />
                </div>
              </div>
            </div>
          ) : null}

          {phase === "done" && tribe ? (
            <div>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>Welcome to {tribe.label}!</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                Color: {tribe.colorLabel}. Your details are saved for the admin export.
              </div>
              <div style={{ marginTop: 14 }}>
                <button
                  className="btn"
                  onClick={() => {
                    setPhase("idle");
                    setHighlight(null);
                    setResponseId(null);
                    setTribeId(null);
                    setRoundIndex(null);
                    setRotationDeg((r) => r % 360);
                    setConfettiActive(false);
                  }}
                >
                  Spin for another person
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </>
  );
}

