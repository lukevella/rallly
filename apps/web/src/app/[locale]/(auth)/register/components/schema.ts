import { z } from "zod";

import { isValidName } from "@/utils/is-valid-name";

export const registerNameFormSchema = z.object({
  name: z.string().trim().min(1).max(100).refine(isValidName, {
    error: "Please enter a valid name, not a URL, email, or phone number",
  }),
  email: z.email(),
});

export type RegisterNameFormValues = z.infer<typeof registerNameFormSchema>;
