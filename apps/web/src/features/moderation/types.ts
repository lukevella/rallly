export type ModerationVerdict = "flagged" | "safe";

export type ModerationResult = {
  verdict: ModerationVerdict;
  reason: string;
};
