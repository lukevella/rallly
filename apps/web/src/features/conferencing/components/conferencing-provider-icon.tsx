import GoogleMeetIcon from "@/features/conferencing/assets/google-meet.svg";
import ZoomIcon from "@/features/conferencing/assets/zoom.svg";
import type { ConferencingProvider } from "@/features/conferencing/schema";

export function ConferencingProviderIcon({
  provider,
  size,
}: {
  provider: ConferencingProvider;
  size: number;
}) {
  switch (provider) {
    case "zoom":
      return <ZoomIcon width={size} height={size} aria-hidden="true" />;
    case "meet":
      return <GoogleMeetIcon width={size} height={size} aria-hidden="true" />;
  }
}
