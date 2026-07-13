import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";

type Action = "revoke";
type Subject = Subjects<{
  ApiKey: {
    spaceId: string;
  };
}>;

export type ApiKeyAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForApiKeys(context: { spaceId: string }) {
  const { can, build } = new AbilityBuilder<ApiKeyAbility>(createPrismaAbility);

  // A key can only be revoked from within the space that owns it.
  can("revoke", "ApiKey", { spaceId: context.spaceId });

  return build();
}
