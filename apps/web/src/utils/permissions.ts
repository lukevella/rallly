export function isOwner(
  resource: { userId?: string | null; guestId?: string | null },
  user: { id: string; isGuest: boolean },
) {
  if (user.isGuest) {
    return resource.guestId === user.id;
  }

  return resource.userId === user.id;
}
