import { useEffect, useMemo, useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import { useSignedInUser } from "../lib/auth";
import { TRIBES, type TribeId } from "../lib/tribes";
import { appReady, db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";

type ResponseRow = {
  id: string;
  name?: string;
  whatsapp?: string;
  tribeId: TribeId;
  colorId: string;
  roundIndex: number;
  createdAt?: unknown;
  confirmedAt?: unknown;
};

const META_DOC_REF = db ? doc(db, "meta", "currentRound") : null;

export default function AdminDashboard() {
  const { ready, user, isSignedIn } = useSignedInUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [roundIndex, setRoundIndex] = useState<number | null>(null);
  const [roundCounts, setRoundCounts] = useState<Record<TribeId, number>>({
    scarlet: 0,
    skyline: 0,
    sunfire: 0,
    earth_bound: 0,
  });

  const [devicesCount, setDevicesCount] = useState<number>(0);
  const [confirmedCounts, setConfirmedCounts] = useState<Record<TribeId, number>>({
    scarlet: 0,
    skyline: 0,
    sunfire: 0,
    earth_bound: 0,
  });
  const [pendingCounts, setPendingCounts] = useState<Record<TribeId, number>>({
    scarlet: 0,
    skyline: 0,
    sunfire: 0,
    earth_bound: 0,
  });

  const [lastExportAt, setLastExportAt] = useState<number | null>(null);

  const canView = ready && appReady && isSignedIn && !!db;

  async function loadStats() {
    if (!db || !META_DOC_REF) return;

    setLoading(true);
    setError(null);
    try {
      // Current round
      const metaSnap = await getDoc(META_DOC_REF);
      const meta = metaSnap.data() as { roundId: string | null } | undefined;
      const rid = meta?.roundId ?? null;
      setCurrentRoundId(rid);

      if (!rid) {
        setRoundIndex(null);
        setRoundCounts({ scarlet: 0, skyline: 0, sunfire: 0, earth_bound: 0 });
      } else {
        const rSnap = await getDoc(doc(db, "rounds", rid));
        const rData = rSnap.data() as
          | {
              index: number;
              counts: Record<TribeId, number>;
            }
          | undefined;
        if (rData?.index != null) {
          setRoundIndex(rData.index);
          setRoundCounts({
            scarlet: rData.counts?.scarlet ?? 0,
            skyline: rData.counts?.skyline ?? 0,
            sunfire: rData.counts?.sunfire ?? 0,
            earth_bound: rData.counts?.earth_bound ?? 0,
          });
        }
      }

      // Devices
      const devicesSnap = await getDocs(collection(db, "devices"));
      setDevicesCount(devicesSnap.size);

      // Responses for current round
      const confirmedQ =
        rid == null
          ? null
          : query(
              collection(db, "responses"),
              where("roundId", "==", rid),
              where("status", "==", "confirmed"),
            );
      const pendingQ =
        rid == null
          ? null
          : query(
              collection(db, "responses"),
              where("roundId", "==", rid),
              where("status", "==", "pending"),
            );

      const [confirmedSnap, pendingSnap] = await Promise.all([
        confirmedQ ? getDocs(confirmedQ) : Promise.resolve(null),
        pendingQ ? getDocs(pendingQ) : Promise.resolve(null),
      ]);

      const confirmed = confirmedSnap ? confirmedSnap.docs.map((d) => d.data() as ResponseRow) : [];
      const pending = pendingSnap ? pendingSnap.docs.map((d) => d.data() as ResponseRow) : [];

      const init = () => ({ scarlet: 0, skyline: 0, sunfire: 0, earth_bound: 0 } as Record<TribeId, number>);
      const cCounts = init();
      for (const r of confirmed) cCounts[r.tribeId] = (cCounts[r.tribeId] ?? 0) + 1;

      const pCounts = init();
      for (const r of pending) pCounts[r.tribeId] = (pCounts[r.tribeId] ?? 0) + 1;

      setConfirmedCounts(cCounts);
      setPendingCounts(pCounts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load admin stats.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canView) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const roundTotalAssigned = useMemo(() => {
    return TRIBES.reduce((sum, t) => sum + (roundCounts[t.id] ?? 0), 0);
  }, [roundCounts]);

  async function exportExcel(scope: "current" | "all") {
    if (!db) return;

    setLoading(true);
    setError(null);
    try {
      const base = [where("status", "==", "confirmed")] as const;
      const q =
        scope === "all" || !currentRoundId
          ? query(collection(db, "responses"), ...base)
          : query(collection(db, "responses"), where("roundId", "==", currentRoundId), where("status", "==", "confirmed"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => d.data() as any);

      const excelRows = rows.map((r) => ({
        Name: r.name ?? "",
        WhatsApp: r.whatsapp ?? "",
        Tribe: TRIBES.find((t) => t.id === r.tribeId)?.label ?? r.tribeId,
        Color: TRIBES.find((t) => t.id === r.tribeId)?.colorLabel ?? r.colorId,
        Round: r.roundIndex ?? "",
        "Created At": r.createdAt ? String(r.createdAt) : "",
        "Confirmed At": r.confirmedAt ? String(r.confirmedAt) : "",
        Device: r.deviceId ?? "",
      }));

      const sheet = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, "Confirmed");

      const fileName =
        scope === "all" || !currentRoundId
          ? `youth-wheel-all-confirmed.xlsx`
          : `youth-wheel-round-${currentRoundId}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setLastExportAt(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !appReady) {
    return <LoadingOverlay text="Connecting to Firebase..." />;
  }

  if (!isSignedIn) {
    return (
      <div className="tribeWarsPage">
        <div className="phone-frame">
          <div className="topBar">
            <img className="churchLogo" src="/acts-logo.png" alt="Church logo" />
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
            <div className="card" style={{ padding: 18, width: "100%" }}>
              <div style={{ fontWeight: 1000, fontSize: 20 }}>Sign in</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                Sign in with any account from your Firebase Auth users list to view stats and export.
              </div>
              <div style={{ marginTop: 14 }}>
                <a className="btn btnPrimary" href="/admin/login">
                  Go to login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tribeWarsPage">
      <div className="phone-frame">
        <div className="topBar">
          <img className="churchLogo" src="/acts-logo.png" alt="Church logo" />
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
          <div className="card" style={{ padding: 18, width: "100%" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 1000, fontSize: 22 }}>Admin dashboard</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Quota check + device count + Excel export.
                </div>
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Current round: <span className="kbd">{roundIndex ?? "—"}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pill">
                  <span className="kbd">Devices</span>
                  <span style={{ fontWeight: 900 }}>{devicesCount}</span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="toast" style={{ marginTop: 14, borderColor: "rgba(255,92,92,0.35)" }}>
                {error}
              </div>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Quota-balanced repartition</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                For each tribe: quota is 5 per round (20 total). This shows reserved/pending + confirmed.
              </div>
            </div>

            <div style={{ marginTop: 14, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Tribe</th>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Color</th>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Reserved</th>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Confirmed</th>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {TRIBES.map((t) => (
                    <tr key={t.id}>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>
                        <span className="pill" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              background: t.hex,
                              boxShadow: `0 0 0 4px ${t.hex}22`,
                            }}
                          />
                          {t.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", color: "rgba(255,255,255,0.86)" }}>
                        {t.colorLabel}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span className="kbd">{roundCounts[t.id] ?? 0}</span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span className="kbd">{confirmedCounts[t.id] ?? 0}</span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span className="kbd">{pendingCounts[t.id] ?? 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                Total reserved this round: <span className="kbd">{roundTotalAssigned}</span> / 20
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="row">
              <button className="btn btnPrimary" onClick={loadStats} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="btn" onClick={() => exportExcel("current")} disabled={!currentRoundId || loading}>
                Export current round to Excel
              </button>
              <button className="btn" onClick={() => exportExcel("all")} disabled={loading}>
                Export all confirmed to Excel
              </button>
              {lastExportAt ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  Last export: {new Date(lastExportAt).toLocaleTimeString()}
                </div>
              ) : null}
            </div>

            {loading ? (
              <div style={{ marginTop: 12 }} className="muted">
                Updating...
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

