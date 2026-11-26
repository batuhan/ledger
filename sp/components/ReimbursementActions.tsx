"use client";

import { useState } from "react";
import { useMutation } from "spacepress/react";
import { api } from "../_generated/api";

export function ReimbursementActions({
  claimId,
  initialState,
}: {
  claimId: number;
  initialState: string;
}) {
  const [claimState, setClaimState] = useState(initialState);
  const updateState = useMutation(api.actions.updateReimbursementState);

  const transition = async (nextState: "draft" | "submitted" | "approved" | "rejected") => {
    const res = await updateState.mutate({ claimId, claimState: nextState });
    setClaimState(res.claimState);
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
        disabled={updateState.pending || claimState === "paid" || claimState === "submitted" || claimState === "approved"}
        onClick={() => transition("submitted")}
      >
        Submit Claim
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={updateState.pending || claimState === "paid" || claimState === "approved"}
        onClick={() => transition("approved")}
      >
        Mark Approved
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={updateState.pending || claimState === "paid" || claimState === "rejected"}
        onClick={() => transition("rejected")}
      >
        Reject
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={updateState.pending || claimState === "paid" || claimState === "draft"}
        onClick={() => transition("draft")}
      >
        Back to Draft
      </button>
    </div>
  );
}
