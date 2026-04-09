"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface BatchResult {
  ok: boolean;
  skip: number;
  imported: number;
  errors: number;
  total: number;
  nextSkip: number;
  percent: number;
  isComplete: boolean;
  batchNum?: number;
  totalBatches?: number;
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

function ImportDashboard() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret") || "";

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalImported, setTotalImported] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [batchNum, setBatchNum] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastDuration, setLastDuration] = useState(0);
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Check auth on mount
  useEffect(() => {
    if (!secret) {
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
  }, [secret]);

  const addLog = useCallback((message: string, ok: boolean) => {
    const time = new Date().toLocaleTimeString("de-CH");
    setLog((prev) => [...prev.slice(-100), { time, message, ok }]);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const runImport = useCallback(async () => {
    setRunning(true);
    setIsComplete(false);
    stopRef.current = false;
    let consecutiveErrors = 0;

    while (!stopRef.current) {
      try {
        const res = await fetch(
          `/api/cron/import-feed?secret=${encodeURIComponent(secret)}`,
        );
        const data: BatchResult = await res.json();

        if (data.ok) {
          consecutiveErrors = 0;
          setPercent(data.percent);
          setTotal(data.total);
          setTotalImported((prev) => prev + data.imported);
          setTotalErrors((prev) => prev + data.errors);
          setBatchNum(data.batchNum ?? 0);
          setTotalBatches(data.totalBatches ?? 0);
          setLastDuration(data.durationMs);

          addLog(
            `✅ ${data.message} — ${data.imported} importiert (${(data.durationMs / 1000).toFixed(1)}s)`,
            true,
          );

          if (data.isComplete) {
            setIsComplete(true);
            setPercent(100);
            addLog("🎉 Import komplett! Alle Produkte importiert.", true);
            break;
          }
        } else {
          consecutiveErrors++;
          addLog(`❌ ${data.message}`, false);

          if (consecutiveErrors >= 5) {
            addLog("⛔ 5 Fehler in Folge — Import gestoppt.", false);
            break;
          }

          // Wait 3 seconds before retry
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
      } catch (err) {
        consecutiveErrors++;
        addLog(
          `❌ Netzwerk-Fehler: ${err instanceof Error ? err.message : "Timeout"}`,
          false,
        );

        if (consecutiveErrors >= 5) {
          addLog("⛔ 5 Fehler in Folge — Import gestoppt.", false);
          break;
        }

        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      // Wait 2 seconds between successful batches
      await new Promise((r) => setTimeout(r, 2000));
    }

    setRunning(false);
  }, [secret, addLog]);

  const stopImport = () => {
    stopRef.current = true;
    addLog("🛑 Stop angefordert...", true);
  };

  if (authorized === false) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.logo}>
            Preis<span style={{ color: "#D81E05" }}>Alarm</span>
          </h1>
          <p style={{ color: "#ef4444", marginTop: 16 }}>
            Zugriff verweigert. Bitte URL mit ?secret=... aufrufen.
          </p>
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
          <span style={{ fontWeight: 400, fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
            Feed Import
          </span>
        </h1>

        {/* Progress Bar */}
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${percent}%`,
              background: isComplete ? "#22c55e" : "#D81E05",
            }}
          />
        </div>
        <div style={styles.percentRow}>
          <span>{percent}%</span>
          <span>
            {batchNum > 0 && `Batch ${batchNum}/${totalBatches}`}
          </span>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Importiert</div>
            <div style={styles.statValue}>{totalImported.toLocaleString("de-CH")}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Fehler</div>
            <div style={styles.statValue}>{totalErrors}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Total im Feed</div>
            <div style={styles.statValue}>{total ? total.toLocaleString("de-CH") : "—"}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Letzte Batch</div>
            <div style={styles.statValue}>
              {lastDuration ? `${(lastDuration / 1000).toFixed(1)}s` : "—"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          {!running ? (
            <button onClick={runImport} style={styles.btnStart}>
              ▶ {isComplete ? "Neuer Zyklus" : percent > 0 ? "Weiter" : "Import starten"}
            </button>
          ) : (
            <button onClick={stopImport} style={styles.btnStop}>
              ■ Stop
            </button>
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
              <div
                key={i}
                style={{
                  ...styles.logEntry,
                  color: entry.ok ? "#9ca3af" : "#ef4444",
                }}
              >
                <span style={{ color: "#4b5563" }}>{entry.time}</span>{" "}
                {entry.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0c0c0c",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    color: "#f5f5f5",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: 16,
    padding: 32,
    maxWidth: 540,
    width: "100%",
  },
  logo: { fontSize: 22, fontWeight: 900, marginBottom: 24 },
  barBg: {
    background: "#2a2a2a",
    borderRadius: 8,
    height: 14,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
    transition: "width 0.4s ease",
  },
  percentRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 6,
    marginBottom: 20,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20,
  },
  stat: {
    background: "#222",
    borderRadius: 10,
    padding: 12,
  },
  statLabel: {
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: 700 },
  controls: { marginBottom: 20 },
  btnStart: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 10,
    border: "none",
    background: "#D81E05",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnStop: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#222",
    color: "#ccc",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  logBox: {
    background: "#111",
    borderRadius: 10,
    overflow: "hidden",
  },
  logHeader: {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#6b7280",
    borderBottom: "1px solid #222",
  },
  logContent: {
    maxHeight: 260,
    overflowY: "auto" as const,
    padding: "4px 0",
  },
  logEntry: {
    padding: "4px 12px",
    fontSize: 12,
    lineHeight: "1.6",
    fontFamily: "monospace",
  },
};
