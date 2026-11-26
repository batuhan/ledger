"use client";

import { useState } from "typedpress/client";
import { updateReimbursementState } from "../server";

export function ReimbursementActions({
  claimId,
  initialState,
}: {
  claimId: number;
  initialState: string;
}) {
  const [claimState, setClaimState] = useState(initialState);
  const [busy, setBusy] = useState(false);

  const transition = async (nextState: "draft" | "submitted" | "approved" | "rejected") => {
    setBusy(true);
    try {
      const res = await updateReimbursementState({ claimId, claimState: nextState });
      setClaimState(res.claimState);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action-bar">
      <span
        className={
          claimState === "paid" || claimState === "approved"
            ? "pill pill-ok"
            : claimState === "rejected"
              ? "pill pill-danger"
              : "pill pill-warn"
        }
      >
        {claimState}
      </span>
      <button
        type="button"
        className="btn btn-sm"
        disabled={busy || claimState === "paid" || claimState === "submitted" || claimState === "approved"}
        onClick={() => transition("submitted")}
      >
        Submit Claim
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={busy || claimState === "paid" || claimState === "approved"}
        onClick={() => transition("approved")}
      >
        Mark Approved
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={busy || claimState === "paid" || claimState === "rejected"}
        onClick={() => transition("rejected")}
      >
        Reject
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={busy || claimState === "paid" || claimState === "draft"}
        onClick={() => transition("draft")}
      >
        Back to Draft
      </button>
    </div>
  );
}
