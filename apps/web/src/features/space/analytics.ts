import { posthog } from "@rallly/posthog/server";

export function trackSpaceCreated({
  space,
  userId,
}: {
  space: {
    id: string;
    name: string;
  };
  userId: string;
}): void {
  if (!posthog) return;

  posthog.groupIdentify({
    groupType: "space",
    groupKey: space.id,
    properties: {
      name: space.name,
      member_count: 1,
      seat_count: 1,
      tier: "hobby",
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_create",
    properties: {
      space_id: space.id,
      space_name: space.name,
    },
    groups: {
      space: space.id,
    },
  });
}

export function trackSpaceUpdated({
  spaceId,
  name,
  userId,
}: {
  spaceId: string;
  userId: string;
  name?: string;
}): void {
  if (!posthog) return;

  posthog.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      name,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_update",
    properties: {
      space_id: spaceId,
      name: name,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackSpaceDeleted({
  spaceId,
  userId,
}: {
  spaceId: string;
  userId: string;
}): void {
  if (!posthog) return;

  posthog.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      deleted: true,
      deleted_at: new Date(),
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_delete",
    properties: {
      space_id: spaceId,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackMemberAdded({
  spaceId,
  memberCount,
  userId,
}: {
  spaceId: string;
  memberCount: number;
  userId: string;
}): void {
  if (!posthog) return;

  posthog.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      member_count: memberCount,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_member_add",
    properties: {
      space_id: spaceId,
      member_count: memberCount,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackMemberRemoved({
  spaceId,
  memberCount,
  userId,
}: {
  spaceId: string;
  memberCount: number;
  userId: string;
}): void {
  if (!posthog) return;

  posthog.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      member_count: memberCount,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_member_remove",
    properties: {
      space_id: spaceId,
      member_count: memberCount,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackInviteSent({
  spaceId,
  role,
  userId,
}: {
  spaceId: string;
  role: string;
  userId: string;
}): void {
  if (!posthog) return;

  posthog?.capture({
    distinctId: userId,
    event: "space_invite_sent",
    properties: {
      space_id: spaceId,
      role,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackSeatCountChanged({
  spaceId,
  seatCount,
}: {
  spaceId: string;
  seatCount: number;
}): void {
  posthog?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      seat_count: seatCount,
    },
  });
}
