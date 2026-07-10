import { useCallback, useRef, useState } from "react";
import { useSOS } from "../hooks/useSOS";
import "./SOSButton.css";

const HOLD_DURATION_MS = 1500;

const LEVEL_LABELS = {
  1: "Feeling Unsafe",
  2: "Need Help",
  3: "Emergency",
};

export default function SOSButton() {
  const { alert, status, error, geoError, trigger, escalate, resolve } =
    useSOS();

  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (alert) return; // already active, ignore hold — use escalate buttons instead
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        clearHold();
        trigger(1).catch(() => {
          /* error surfaced via `error` state below */
        });
      }
    }, 30);
  }, [alert, clearHold, trigger]);

  const cancelHold = useCallback(() => {
    clearHold();
  }, [clearHold]);

  const handleEscalate = (level) => {
    escalate(level).catch(() => {});
  };

  const handleResolve = () => {
    if (
      window.confirm(
        "Mark yourself as safe? This will stop sharing your location and close the alert.",
      )
    ) {
      resolve().catch(() => {});
    }
  };

  if (alert) {
    return (
      <div className="sos-panel sos-panel--active">
        <div className={`sos-level-badge sos-level-badge--${alert.level}`}>
          Level {alert.level} · {LEVEL_LABELS[alert.level]}
        </div>

        <div className="sos-status-grid">
          <StatusItem label="Guardian Mode" active={alert.guardianModeActive} />
          <StatusItem
            label="Audio recording"
            active={alert.audioRecordingActive}
          />
          <StatusItem
            label="Video recording"
            active={alert.videoRecordingActive}
          />
          <StatusItem label="Police notified" active={alert.policeNotified} />
        </div>

        {alert.address && <p className="sos-address">📍 {alert.address}</p>}

        <div className="sos-escalate-row">
          {alert.level < 2 && (
            <button
              className="sos-btn sos-btn--level2"
              onClick={() => handleEscalate(2)}
            >
              Escalate to Need Help
            </button>
          )}
          {alert.level < 3 && (
            <button
              className="sos-btn sos-btn--level3"
              onClick={() => handleEscalate(3)}
            >
              Escalate to Emergency
            </button>
          )}
        </div>

        <button
          className="sos-btn sos-btn--safe"
          onClick={handleResolve}
          disabled={status === "resolving"}
        >
          {status === "resolving" ? "Resolving…" : "I'm Safe Now"}
        </button>

        {error && <p className="sos-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="sos-panel">
      <button
        className="sos-hold-button"
        style={{ "--hold-pct": `${holdProgress}%` }}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        disabled={status === "triggering"}
        aria-label="Press and hold to send an SOS alert"
      >
        <span className="sos-hold-button__label">
          {status === "triggering" ? "Sending…" : "SOS"}
        </span>
      </button>
      <>
        <p className="sos-hint">
          Hold for <strong>{HOLD_DURATION_MS / 1000} seconds</strong> to
          activate emergency mode.
        </p>

        <p
          style={{
            marginTop: "6px",
            color: "#9b2c62",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Your trusted contacts will receive your live location.
        </p>
      </>
      {(error || geoError) && <p className="sos-error">{error || geoError}</p>}
    </div>
  );
}

function StatusItem({ label, active }) {
  return (
    <div className={`sos-status-item ${active ? "sos-status-item--on" : ""}`}>
      <span className="sos-status-dot" />
      {label}
    </div>
  );
}
