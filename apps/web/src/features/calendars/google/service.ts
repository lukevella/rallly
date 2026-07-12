import "server-only";

import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import * as z from "zod";
import { env } from "@/env";
import type { CalendarInfo, CalendarService } from "@/features/calendars/types";

export class GoogleCalendarService implements CalendarService {
  private readonly client: calendar_v3.Calendar;
  static credentialsSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
  });
  constructor(params: {
    credentials: z.infer<typeof GoogleCalendarService.credentialsSchema>;
  }) {
    const oauth2Client = new google.auth.OAuth2({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    });

    oauth2Client.setCredentials({
      access_token: params.credentials.accessToken,
      refresh_token: params.credentials.refreshToken,
    });

    this.client = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });
  }

  async listCalendars(): Promise<CalendarInfo[]> {
    const calendarList = await this.client.calendarList.list();

    if (!calendarList.data.items) {
      return [];
    }

    return calendarList.data.items.map((item) => ({
      id: item.id as string,
      timeZone: item.timeZone ?? undefined,
      name: item.summary ?? "No name",
      isPrimary: Boolean(item.primary),
      isSelected: Boolean(item.selected),
      isDeleted: Boolean(item.deleted),
      isWritable: item.accessRole === "owner" || item.accessRole === "writer",
      _rawData: item,
    }));
  }
}
