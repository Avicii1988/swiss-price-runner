"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface BatchResult {
  ok: boolean;
  offset: number;
  limit: number;
  imported: number;
  skipped: number;
  errors: number;
  total: number;
  nextOffset: number;
  percent: number;
  isComplete: boolean;
  batchNum: number;
  totalBatches: number;
  stoppedEarly: boolean;
  message: string;
  durationMs: number;
}

interface LogEntry {
  time: string;
  message: string;
  ok: boolean;
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0c0c0c", minHeight: "100vh" }} />}>
      <ImportDashboard />
    </Suspense>
  );
}

const PARALLEL_WORKERS = 3;
const BATCH_LIMIT = 50;

function ImportDashboard() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret") || "";

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [scrubMode, setScrubMode] = useState(false);
  const [feedKey, setFeedKey] = useState("xxl_parfum");
  const [percent, setPercent] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalImported, setTotalImported] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [batchNum, setBatchNum] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastDuration, setLastDuration] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);
  const [eta, setEta] = useState("");
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Refs to avoid stale closures
  const speedWindowRef = useRef<{ ts: number; count: number }[]>([]);
  const nextOffsetRef = useRef(0);
  const totalRef = useRef(0);
  const importStartRef = useRef(0);
  const totalImportedRef = useRef(0);
  const scrubRef = useRef(false);
  const feedRef = useRef("xxl_parfum");

  useEffect(() => { setAuthorized(!!secret || null); }, [secret]);

  const addLog = useCallback((message: string, ok: boolean) => {
    const time = new Date().toLocaleTimeString("de-CH");
    setLog((prev) => [...prev.slice(-200), { time, message, ok }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const updateSpeed = useCallback((importedCount: number) => {
    const now = Date.now();
    speedWindowRef.current.push({ ts: now, count: importedCount });
    speedWindowRef.current = speedWindowRef.current.filter((e) => now - e.ts < 30_000);
    const win = speedWindowRef.current;
    if (win.length >= 2) {
      const secs = (win[win.length - 1].ts - win[0].ts) / 1000;
      const sum = win.reduce((s, e) => s + e.count, 0);
      if (secs > 0) {
        const pps = Math.round((sum / secs) * 10) / 10;
        setSpeed(pps);
        // ETA
        const remaining = totalRef.current - nextOffsetRef.current;
        if (pps > 0 && remaining > 0) {
          const etaSec = Math.ceil(remaining / pps);
          const min = Math.floor(etaSec / 60);
          const sec = etaSec % 60;
          setEta(min > 0 ? `~${min}m ${sec}s` : `~${sec}s`);
        } else {
          setEta("");
        }
      }
    }
  }, []);

  const worker = useCallback(async (workerId: number, errRef: { count: number }) => {
    setActiveWorkers((prev) => prev + 1);

    while (!stopRef.current) {
      const myOffset = nextOffsetRef.current;
      if (totalRef.current > 0 && myOffset >= totalRef.current) break;
      nextOffsetRef.current = myOffset + BATCH_LIMIT;

      try {
        const res = await fetch(
          `/api/cron/import-feed?secret=${encodeURIComponent(secret)}&feed=${feedRef.current}&limit=${BATCH_LIMIT}&offset=${myOffset}${scrubRef.current ? "&scrub=true" : ""}`,
        );
        const data: BatchResult = await res.json();

        if (data.ok) {
          errRef.count = 0;
          if (data.total) totalRef.current = data.total;

          totalImportedRef.current += data.imported;
          setTotal(data.total);
          setTotalImported(totalImportedRef.current);
          setTotalErrors((prev) => prev + data.errors);
          setTotalBatches(data.totalBatches);
          setLastDuration(data.durationMs);
          updateSpeed(data.imported);

          const pct = Math.min(100, Math.round((nextOffsetRef.current / data.total) * 100));
          setPercent(pct);
          setBatchNum(Math.ceil(nextOffsetRef.current / BATCH_LIMIT));

          addLog(
            `[W${workerId}] ✅ offset=${myOffset} — ${data.imported} ok, ${data.skipped} skip (${(data.durationMs / 1000).toFixed(1)}s)`,
            true,
          );

          if (data.isComplete || nextOffsetRef.current >= data.total) break;
        } else {
          errRef.count++;
          addLog(`[W${workerId}] ❌ ${data.message}`, false);
          if (errRef.count >= 5) {
            addLog(`[W${workerId}] ⛔ Zu viele Fehler — Worker gestoppt.`, false);
            break;
          }
        }
      } catch (err) {
        errRef.count++;
        addLog(`[W${workerId}] ❌ Netzwerk: ${err instanceof Error ? err.message : "Timeout"}`, false);
        if (errRef.count >= 5) {
          addLog(`[W${workerId}] ⛔ Zu viele Fehler — Worker gestoppt.`, false);
          break;
        }
      }
    }

    setActiveWorkers((prev) => prev - 1);
  }, [secret, addLog, updateSpeed]);

  const runImport = useCallback(async () => {
    setRunning(true);
    setIsComplete(false);
    stopRef.current = false;
    speedWindowRef.current = [];
    setSpeed(0);
    setEta("");
    setActiveWorkers(0);
    totalImportedRef.current = 0;
    importStartRef.current = Date.now();
    scrubRef.current = scrubMode;
    feedRef.current = feedKey;

    // Init request — get total + starting offset
    try {
      const initRes = await fetch(
        `/api/cron/import-feed?secret=${encodeURIComponent(secret)}&feed=${feedRef.current}&limit=${BATCH_LIMIT}${scrubRef.current ? "&scrub=true" : ""}`,
      );
      const init: BatchResult = await initRes.json();

      if (!init.ok) {
        addLog(`❌ Init: ${init.message}`, false);
        setRunning(false);
        return;
      }

      totalRef.current = init.total;
      totalImportedRef.current = init.imported;
      setTotal(init.total);
      setTotalImported(init.imported);
      setTotalErrors(init.errors);
      setBatchNum(init.batchNum);
      setTotalBatches(init.totalBatches);
      setPercent(init.percent);
      updateSpeed(init.imported);

      addLog(`✅ ${feedRef.current}: ${init.total.toLocaleString("de-CH")} Produkte, ${PARALLEL_WORKERS}x${BATCH_LIMIT}${scrubRef.current ? " [SCRUB]" : ""}`, true);

      if (init.isComplete) {
        setIsComplete(true);
        setPercent(100);
        addLog("🎉 Import bereits komplett!", true);
        setRunning(false);
        return;
      }

      nextOffsetRef.current = init.nextOffset;
    } catch (err) {
      addLog(`❌ Init-Fehler: ${err instanceof Error ? err.message : "Timeout"}`, false);
      setRunning(false);
      return;
    }

    // Launch workers
    const errRef = { count: 0 };
    await Promise.all(
      Array.from({ length: PARALLEL_WORKERS }, (_, i) => worker(i + 1, errRef))
    );

    if (nextOffsetRef.current >= totalRef.current && totalRef.current > 0) {
      setIsComplete(true);
      setPercent(100);
      const elapsed = ((Date.now() - importStartRef.current) / 1000).toFixed(0);
      addLog(`🎉 Import komplett! ${totalImportedRef.current.toLocaleString("de-CH")} Produkte in ${elapsed}s.`, true);
    }

    setRunning(false);
    setEta("");
  }, [secret, scrubMode, feedKey, addLog, updateSpeed, worker]);

  const stopImport = () => {
    stopRef.current = true;
    addLog("🛑 Stop angefordert...", true);
  };

  if (authorized === false) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.logo}>Preis<span style={{ color: "#D81E05" }}>Alarm</span></h1>
          <p style={{ color: "#ef4444", marginTop: 16 }}>Zugriff verweigert. Bitte URL mit ?secret=... aufrufen.</p>
        </div>
      </div>
    );
  }
  if (authorized === null) return null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>
          Preis<span style={{ color: "#D81E05" }}>Alarm</span>
          <span style={{ fontWeight: 400, fontSize: 14, color: "#6b7280", marginLeft: 8 }}>Feed Import</span>
        </h1>

        {/* Progress */}
        <div style={styles.barBg}>
          <div style={{ ...styles.barFill, width: `${percent}%`, background: isComplete ? "#22c55e" : "#D81E05" }} />
        </div>
        <div style={styles.percentRow}>
          <span>{percent}%{eta && ` — ${eta}`}</span>
          <span>{batchNum > 0 && `Batch ${batchNum}/${totalBatches}`}</span>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <Stat label="Importiert" value={totalImported.toLocaleString("de-CH")} />
          <Stat label="Fehler" value={String(totalErrors)} />
          <Stat label="Total Feed" value={total ? total.toLocaleString("de-CH") : "—"} />
          <Stat label="Letzte Batch" value={lastDuration ? `${(lastDuration / 1000).toFixed(1)}s` : "—"} />
          <Stat label="Speed" value={speed > 0 ? `${speed} P/s` : "—"} highlight={speed > 0} />
          <Stat label="Worker" value={running ? `${activeWorkers}/${PARALLEL_WORKERS}` : "—"} />
        </div>

        {/* Feed selector + Mode toggle */}
        {!running && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[
                { key: "xxl_parfum", label: "XXL Parfum" },
                { key: "import_parfumerie", label: "Import Parfumerie" },
              ].map((f) => (
                <button key={f.key} onClick={() => setFeedKey(f.key)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid",
                    borderColor: feedKey === f.key ? "#D81E05" : "#333",
                    background: feedKey === f.key ? "#D81E05" : "#222",
                    color: feedKey === f.key ? "white" : "#9ca3af",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: scrubMode ? "#f59e0b" : "#6b7280", cursor: "pointer" }}>
              <input type="checkbox" checked={scrubMode} onChange={(e) => setScrubMode(e.target.checked)}
                style={{ accentColor: "#f59e0b" }} />
              Scrub-Modus (Daten komplett überschreiben)
            </label>
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          {!running ? (
            <button onClick={runImport} style={{ ...styles.btnStart, background: scrubMode ? "#d97706" : "#D81E05" }}>
              ▶ {isComplete ? "Neuer Zyklus" : percent > 0 ? "Weiter" : scrubMode ? "Scrub starten" : "Import starten"}
            </button>
          ) : (
            <button onClick={stopImport} style={styles.btnStop}>■ Stop</button>
          )}
        </div>

        {/* Log */}
        <div style={styles.logBox}>
          <div style={styles.logHeader}>Log</div>
          <div style={styles.logContent}>
            {log.length === 0 && (
              <div style={{ color: "#6b7280", padding: 8, fontSize: 12 }}>
                Klicke &quot;Import starten&quot; um zu beginnen...
              </div>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{ ...styles.logEntry, color: entry.ok ? "#9ca3af" : "#ef4444" }}>
                <span style={{ color: "#4b5563" }}>{entry.time}</span> {entry.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ ...styles.stat, ...(highlight ? styles.statHighlight : {}) }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#0c0c0c",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "40px 16px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    color: "#f5f5f5",
  },
  card: { background: "#1a1a1a", borderRadius: 16, padding: 32, maxWidth: 540, width: "100%" },
  logo: { fontSize: 22, fontWeight: 900, marginBottom: 24 },
  barBg: { background: "#2a2a2a", borderRadius: 8, height: 14, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 8, transition: "width 0.4s ease" },
  percentRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9ca3af", marginTop: 6, marginBottom: 20 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 },
  stat: { background: "#222", borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1, color: "#6b7280", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 700 },
  statHighlight: { background: "#1a2e1a", border: "1px solid #22c55e33" },
  controls: { marginBottom: 20 },
  btnStart: { width: "100%", padding: "14px 24px", borderRadius: 10, border: "none", background: "#D81E05", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  btnStop: { width: "100%", padding: "14px 24px", borderRadius: 10, border: "1px solid #333", background: "#222", color: "#ccc", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  logBox: { background: "#111", borderRadius: 10, overflow: "hidden" },
  logHeader: { padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1, color: "#6b7280", borderBottom: "1px solid #222" },
  logContent: { maxHeight: 300, overflowY: "auto" as const, padding: "4px 0" },
  logEntry: { padding: "4px 12px", fontSize: 12, lineHeight: "1.6", fontFamily: "monospace" },
};
