import "server-only";

import { GoogleCalendarService } from "@/features/calendars/google/service";

type CalendarServiceProvider = {
  provider: string;
  credentials: unknown;
};

export const createCalendarService = async (
  service: CalendarServiceProvider,
) => {
  switch (service.provider) {
    case "google":
      return new GoogleCalendarService({
        credentials: GoogleCalendarService.credentialsSchema.parse(
          service.credentials,
        ),
      });
    default:
      throw new Error(`Unsupported provider: ${service.provider}`);
  }
};
