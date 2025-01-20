import { Badge } from "@rallly/ui/badge";

export function VersionBadge() {
  return <Badge>v{process.env.NEXT_PUBLIC_APP_VERSION}</Badge>;
}
