import { QUEUED_EMAIL_KINDS } from "./constants";
import type { QueuedEmailKind } from "./types";

export function isQueuedEmailKind(kind: string): kind is QueuedEmailKind {
  return (QUEUED_EMAIL_KINDS as readonly string[]).includes(kind);
}
