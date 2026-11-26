"use client";

import { useState } from "react";
import { useMutation } from "spacepress/react";
import { api } from "../_generated/api";

export function RefreshPricesButton() {
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState("");
  const refresh = useMutation(api.actions.refreshMarketPrices);

  const run = async () => {
    setDone(false);
    const res = await refresh.mutate({});
    setSummary(`Updated ${res.updated} quote(s), skipped ${res.skipped}. Refresh page to see latest values.`);
    setDone(true);
  };

  return (
    <div className="action-bar">
      <button type="button" className="btn btn-ghost" disabled={refresh.pending} onClick={run}>
        {refresh.pending ? "Refreshing quotes…" : "Refresh Live Prices"}
      </button>
      {done && <span className="pill pill-ok">{summary}</span>}
    </div>
  );
}
