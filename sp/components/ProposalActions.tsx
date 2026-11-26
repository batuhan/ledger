"use client";

import { useState } from "spacepress/client";
import { applyAllProposals, approveProposal, rejectProposal } from "../server";

export function ProposalActions({
  proposalId,
  initialStatus,
}: {
  proposalId: number;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await approveProposal({ proposalId });
      setStatus(res.status);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      const res = await rejectProposal({ proposalId });
      setStatus(res.status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action-bar">
      <span className="pill">{status}</span>
      <button type="button" className="btn btn-sm" disabled={busy || status === "applied"} onClick={approve}>
        Apply
      </button>
      <button type="button" className="btn btn-sm btn-ghost" disabled={busy || status === "rejected" || status === "applied"} onClick={reject}>
        Reject
      </button>
    </div>
  );
}

export function ApplyAllButton({ ingestItemId, pendingCount }: { ingestItemId: number; pendingCount: number }) {
  const [remaining, setRemaining] = useState(pendingCount);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await applyAllProposals({ ingestItemId });
      setRemaining(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="btn" disabled={busy || remaining === 0} onClick={run}>
      {busy ? "Applying…" : remaining === 0 ? "All proposals applied" : `Apply all ${remaining} pending`}
    </button>
  );
}
