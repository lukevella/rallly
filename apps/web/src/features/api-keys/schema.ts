import * as z from "zod";

// Cap on active (not revoked, not expired) keys per space. With per-space rate
// limiting this is not a security control, just clutter prevention.
export const MAX_ACTIVE_API_KEYS_PER_SPACE = 10;

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export const revokeApiKeySchema = z.object({
  id: z.string(),
});
