import { z } from "zod";
import {
  disconnectCalendarConnection,
  setCalendarSelection,
  setDefaultCalendar,
  syncCalendars,
} from "@/features/calendars/mutations";
import { getCalendars, getDefaultCalendar } from "@/features/calendars/queries";
import { privateProcedure, router } from "../trpc";

export const calendars = router({
  list: privateProcedure.query(async ({ ctx }) => {
    return getCalendars(ctx.user.id);
  }),
  disconnect: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return disconnectCalendarConnection(ctx.user.id, input.id);
    }),
  sync: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return syncCalendars({ userId: ctx.user.id, connectionId: input.id });
    }),
  getDefault: privateProcedure.query(async ({ ctx }) => {
    return getDefaultCalendar(ctx.user.id);
  }),
  setDefault: privateProcedure
    .input(z.object({ calendarId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return setDefaultCalendar({
        userId: ctx.user.id,
        calendarId: input.calendarId,
      });
    }),
  setSelection: privateProcedure
    .input(
      z.object({
        calendarId: z.string(),
        isSelected: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return setCalendarSelection({
        userId: ctx.user.id,
        calendarId: input.calendarId,
        isSelected: input.isSelected,
      });
    }),
});
