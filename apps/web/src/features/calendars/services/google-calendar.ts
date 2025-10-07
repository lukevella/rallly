import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import z from "zod";
import type {
  CalendarInfo,
  CalendarService,
} from "@/features/calendars/services/types";
import type { GoogleServiceParams } from "@/features/google/service";
import { GoogleService } from "@/features/google/service";

export class GoogleCalendarService
  extends GoogleService
  implements CalendarService
{
  private readonly client: calendar_v3.Calendar;
  static credentialsSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
  });
  constructor(params: GoogleServiceParams) {
    super(params);

    this.client = google.calendar({
      version: "v3",
      auth: this.oauth2Client,
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
