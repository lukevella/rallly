import type { QUEUED_EMAIL_KINDS } from "./constants";

export type QueuedEmailKind = (typeof QUEUED_EMAIL_KINDS)[number];
