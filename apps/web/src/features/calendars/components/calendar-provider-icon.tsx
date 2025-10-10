import GoogleCalendarIcon from "@/features/calendars/assets/google-calendar.svg";
import OutlookIcon from "@/features/calendars/assets/outlook.svg";

export function CalendarProviderIcon({
  provider,
  size,
}: {
  provider: string;
  size: number;
}) {
  switch (provider) {
    case "google":
      return (
        <GoogleCalendarIcon width={size} height={size} alt="Google Calendar" />
      );
    case "microsoft":
      return (
        <OutlookIcon width={size} height={size} alt="Microsoft Calendar" />
      );
    default:
      return null;
  }
}
