export function isUserOnboarded({
  name,
  timeZone,
  locale,
}: {
  name?: string | null;
  timeZone?: string | null;
  locale?: string | null;
}) {
  return name && timeZone && locale;
}
