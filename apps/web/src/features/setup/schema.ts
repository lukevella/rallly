import { z } from "zod";

export const setupSchema = z.object({
  name: z.string().min(1),
  timeZone: z.string().min(1),
  locale: z.string().min(1),
});

export type SetupFormValues = z.infer<typeof setupSchema>;

export const onboardedUserSchema = z.object({
  name: z.string().min(1),
  timeZone: z.string().min(1),
  locale: z.string().min(1),
});

export type OnboardedUser = z.infer<typeof onboardedUserSchema>;
