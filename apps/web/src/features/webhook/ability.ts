import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";

type Action = "update" | "delete";
type Subject = Subjects<{
  Webhook: {
    spaceId: string;
  };
}>;

export type WebhookAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForWebhooks(context: { spaceId: string }) {
  const { can, build } = new AbilityBuilder<WebhookAbility>(
    createPrismaAbility,
  );

  // An endpoint can only be managed from within the space that owns it.
  can(["update", "delete"], "Webhook", { spaceId: context.spaceId });

  return build();
}
