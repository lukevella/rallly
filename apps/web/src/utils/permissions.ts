export function isOwner(
  resource: { userId?: string | null; guestId?: string | null },
  user: { id: string },
) {
  return resource.userId === user.id || resource.guestId === user.id;
}
