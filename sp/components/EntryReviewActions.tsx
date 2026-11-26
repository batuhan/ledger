"use client";

import { useState } from "spacepress/client";
import { setReviewStatus } from "../server";

export function EntryReviewActions({
  entryId,
  initialStatus,
  initialExcludeBudget,
  initialExcludeTotals,
}: {
  entryId: number;
  initialStatus: string;
  initialExcludeBudget: boolean;
  initialExcludeTotals: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [excludeBudget, setExcludeBudget] = useState(initialExcludeBudget);
  const [excludeTotals, setExcludeTotals] = useState(initialExcludeTotals);
  const [saving, setSaving] = useState(false);

  const mark = async (next: "reviewed" | "flagged" | "unreviewed") => {
    setSaving(true);
    try {
      const res = await setReviewStatus({ entryId, reviewStatus: next });
      setStatus(res.reviewStatus);
    } finally {
      setSaving(false);
    }
  };

  const toggleBudget = async () => {
    setSaving(true);
    try {
      const res = await setReviewStatus({ entryId, excludeFromBudget: !excludeBudget });
      setExcludeBudget(res.excludeFromBudget);
    } finally {
      setSaving(false);
    }
  };

  const toggleTotals = async () => {
    setSaving(true);
    try {
      const res = await setReviewStatus({ entryId, excludeFromTotals: !excludeTotals });
      setExcludeTotals(res.excludeFromTotals);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="action-bar">
      <span className="pill">{status}</span>
      <button type="button" className="btn btn-sm" disabled={saving} onClick={() => mark("reviewed")}>
        Mark reviewed
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={saving} onClick={() => mark("flagged")}>
        Flag
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={saving} onClick={toggleBudget}>
        {excludeBudget ? "Include in budget" : "Exclude from budget"}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={saving} onClick={toggleTotals}>
        {excludeTotals ? "Include in totals" : "Exclude from totals"}
      </button>
    </div>
  );
}
