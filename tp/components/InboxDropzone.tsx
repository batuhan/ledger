"use client";

import { uploadFile, useState } from "typedpress/client";
import { registerUpload } from "../server";
import styles from "./InboxDropzone.module.css";

export function InboxDropzone({ entityId = 0, accountId = 0 }: { entityId?: number; accountId?: number }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [hasStatus, setHasStatus] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setHasError(false);
    setErrorMsg("");
    setHasResult(false);
    setStatusMsg(`Uploading ${file.name}…`);
    setHasStatus(true);
    try {
      const uploaded = await uploadFile("inboxFiles", file, { filename: file.name });
      const registered = await registerUpload({
        fileId: uploaded.id,
        filename: uploaded.filename,
        mime: uploaded.mime,
        entityId,
        accountId,
      });
      setCreatedSlug(`/inbox/${registered.slug}`);
      setHasResult(true);
      setStatusMsg(`Queued "${registered.title}" for background extraction.`);
    } catch (err) {
      setHasStatus(false);
      setHasError(true);
      const msg = (err as { message?: string })?.message;
      setErrorMsg(msg ? msg : "Upload failed. Ensure you are signed in.");
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const onDrop = async (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) await handleFile(file);
  };

  const onPick = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await handleFile(file);
  };

  return (
    <div
      className={dragging ? `${styles.zone} ${styles.zoneActive}` : styles.zone}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.row}>
        <div>
          <p className={styles.title}>Drop any bank statement, credit card PDF, CSV, or receipt</p>
          <p className={styles.hint}>
            Supports bunq, Wise, HSBC Turkey CSVs, PDF statements, and receipt images (up to 25 MB).
          </p>
        </div>
        <label className={styles.picker}>
          {uploading ? "Uploading…" : "Choose file"}
          <input
            type="file"
            accept=".csv,.pdf,.txt,.json,image/png,image/jpeg,image/webp"
            disabled={uploading}
            onChange={onPick}
          />
        </label>
      </div>
      <p className={styles.status} hidden={!hasStatus}>
        {statusMsg}{" "}
        <a href={createdSlug} hidden={!hasResult}>
          Open import →
        </a>
      </p>
      <p className={styles.error} role="alert" hidden={!hasError}>
        {errorMsg}
      </p>
    </div>
  );
}
