export type NonprofitApplicationStatus = "approved" | "rejected" | "failed";

export type NonprofitStatus = {
  grantedAt: Date | null;
  latestApplication: {
    status: NonprofitApplicationStatus;
    reason: string | null;
  } | null;
};
