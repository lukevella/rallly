import { z } from "zod";

export const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(10),
  q: z.string().optional(),
  role: z.enum(["all", "member", "admin"]).optional().catch("all"),
});
