import { posthog } from "@rallly/posthog/server";
import { toSnakeCaseKeys } from "es-toolkit";
import type { SpaceTier } from "@/features/space/schema";

export function updateSpaceGroup({
  spaceId,
  properties,
}: {
  spaceId: string;
  properties: {
    seatCount?: number;
    memberCount?: number;
    tier?: SpaceTier;
    name?: string;
    deleted?: boolean;
    deletedAt?: Date;
  };
}) {
  posthog?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: toSnakeCaseKeys(properties),
  });
}

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

  updateSpaceGroup({
    spaceId: space.id,
    properties: {
      name: space.name,
      memberCount: 1,
      seatCount: 1,
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

  updateSpaceGroup({
    spaceId,
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

  updateSpaceGroup({
    spaceId,
    properties: {
      deleted: true,
      deletedAt: new Date(),
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

export function trackMemberJoin({
  spaceId,
  memberCount,
  userId,
}: {
  spaceId: string;
  memberCount: number;
  userId: string;
}): void {
  if (!posthog) return;

  updateSpaceGroup({
    spaceId,
    properties: {
      memberCount,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_member_join",
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

  updateSpaceGroup({
    spaceId,
    properties: {
      memberCount,
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
  email,
}: {
  spaceId: string;
  role: string;
  userId: string;
  email: string;
}): void {
  if (!posthog) return;

  posthog?.capture({
    distinctId: userId,
    event: "space_member_invite",
    properties: {
      space_id: spaceId,
      role,
      email,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackMemberLeaveSpace({
  spaceId,
  memberCount,
  userId,
}: {
  spaceId: string;
  memberCount: number;
  userId: string;
}): void {
  if (!posthog) return;

  updateSpaceGroup({
    spaceId,
    properties: {
      memberCount,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_member_leave",
    properties: {
      space_id: spaceId,
      member_count: memberCount,
    },
    groups: {
      space: spaceId,
    },
  });
}

export function trackSetActiveSpace({
  spaceId,
  userId,
  name,
}: {
  spaceId: string;
  userId: string;
  name: string;
}) {
  if (!posthog) return;

  updateSpaceGroup({
    spaceId,
    properties: {
      name,
    },
  });

  posthog.capture({
    distinctId: userId,
    event: "space_set_active",
    properties: {
      $set: {
        active_space_id: spaceId,
      },
    },
    groups: {
      space: spaceId,
    },
  });
}
