export type NonprofitApplicationStatus = "approved" | "rejected" | "failed";

// Why an application ended the way it did, for analytics. The deterministic
// codes never reach the model; the verifier codes always did.
export type NonprofitReasonCode =
  | "invalid_website"
  | "freemail_domain"
  | "domain_mismatch"
  | "verifier_approved"
  | "verifier_rejected"
  | "verifier_error";

export type NonprofitStatus = {
  grantedAt: Date | null;
  latestApplication: {
    status: NonprofitApplicationStatus;
    reason: string | null;
  } | null;
};
