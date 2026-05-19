import * as z from "zod";

export const createSheetInputSchema = z.object({
  title: z.string().min(1).max(255),
});

export type CreateSheetInput = z.infer<typeof createSheetInputSchema>;

export const updateSheetInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255),
});

export type UpdateSheetInput = z.infer<typeof updateSheetInputSchema>;

export const createSlotInputSchema = z.object({
  sheetId: z.string(),
  eventTypeId: z.string(),
  startTime: z.date(),
});

export type CreateSlotInput = z.infer<typeof createSlotInputSchema>;

export const createBookingInputSchema = z.object({
  slotId: z.string(),
  name: z.string().min(1).max(100),
  email: z.email(),
  timeZone: z.string().min(1).max(64),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
