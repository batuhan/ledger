"use client";

import { useState } from "typedpress/client";
import { refreshMarketPrices } from "../server";

export function RefreshPricesButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState("");

  const run = async () => {
    setBusy(true);
    setDone(false);
    try {
      const res = await refreshMarketPrices({});
      setSummary(`Updated ${res.updated} quote(s), skipped ${res.skipped}. Refresh page to see latest values.`);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action-bar">
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={run}>
        {busy ? "Refreshing quotes…" : "Refresh Live Prices"}
      </button>
      {done && <span className="pill pill-ok">{summary}</span>}
    </div>
  );
}
