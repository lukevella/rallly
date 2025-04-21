import { z } from "zod";

export const statusSchema = z.enum([
  "upcoming",
  "unconfirmed",
  "past",
  "canceled",
]);

export type Status = z.infer<typeof statusSchema>;
