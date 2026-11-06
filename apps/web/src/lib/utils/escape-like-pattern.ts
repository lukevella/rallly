/**
 * Prisma passes `contains` values to ILIKE as is, so `%` and `_` act as
 * wildcards. Escape them (and the escape character) to match literally.
 */
export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
