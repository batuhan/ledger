"use client";

import { useState } from "react";
import { useMutation } from "spacepress/react";
import { api } from "../_generated/api";

export function ProposalActions({
  proposalId,
  initialStatus,
}: {
  proposalId: number;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const approveMut = useMutation(api.actions.approveProposal);
  const rejectMut = useMutation(api.actions.rejectProposal);

  const approve = async () => {
    const res = await approveMut.mutate({ proposalId });
    setStatus(res.status);
  };

  const reject = async () => {
    const res = await rejectMut.mutate({ proposalId });
    setStatus(res.status);
  };

  const busy = approveMut.pending || rejectMut.pending;

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
  const applyAll = useMutation(api.actions.applyAllProposals);

  const run = async () => {
    await applyAll.mutate({ ingestItemId });
    setRemaining(0);
  };

  return (
    <button type="button" className="btn" disabled={applyAll.pending || remaining === 0} onClick={run}>
      {applyAll.pending ? "Applying…" : remaining === 0 ? "All proposals applied" : `Apply all ${remaining} pending`}
    </button>
  );
}
