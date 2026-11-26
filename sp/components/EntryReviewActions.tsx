"use client";

import { useState } from "react";
import { useMutation } from "spacepress/react";
import { api } from "../_generated/api";

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
  const updateReview = useMutation(api.actions.setReviewStatus);

  const mark = async (next: "reviewed" | "flagged" | "unreviewed") => {
    const res = await updateReview.mutate({ entryId, reviewStatus: next });
    setStatus(res.reviewStatus);
  };

  const toggleBudget = async () => {
    const res = await updateReview.mutate({ entryId, excludeFromBudget: !excludeBudget });
    setExcludeBudget(res.excludeFromBudget);
  };

  const toggleTotals = async () => {
    const res = await updateReview.mutate({ entryId, excludeFromTotals: !excludeTotals });
    setExcludeTotals(res.excludeFromTotals);
  };

  return (
    <div className="action-bar">
      <span className="pill">{status}</span>
      <button type="button" className="btn btn-sm" disabled={updateReview.pending} onClick={() => mark("reviewed")}>
        Mark reviewed
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={updateReview.pending} onClick={() => mark("flagged")}>
        Flag
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={updateReview.pending} onClick={toggleBudget}>
        {excludeBudget ? "Include in budget" : "Exclude from budget"}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={updateReview.pending} onClick={toggleTotals}>
        {excludeTotals ? "Include in totals" : "Exclude from totals"}
      </button>
    </div>
  );
}
