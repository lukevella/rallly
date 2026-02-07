import * as z from "zod";

export const instanceSettingsSchema = z.object({
  disableUserRegistration: z.boolean(),
});

export type InstanceSettings = z.infer<typeof instanceSettingsSchema>;
