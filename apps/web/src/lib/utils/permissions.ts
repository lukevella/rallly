export function isOwner(
  resource: { userId?: string | null },
  user: { id: string },
) {
  return resource.userId === user.id;
}
