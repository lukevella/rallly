import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";
import type { SpaceTier } from "./schema";

type Action = "invite" | "finalize" | "duplicate" | "update";
type Subject = "Member" | "Poll" | "AdvancedPollSettings";

export type SpaceAbilityContext = {
  tier: SpaceTier;
};
export type SpaceAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForSpace(context: SpaceAbilityContext) {
  const { can, build } = new AbilityBuilder<SpaceAbility>(createPrismaAbility);

  if (context.tier === "pro") {
    can("invite", "Member");
    can(["finalize", "duplicate"], "Poll");
    can("update", "AdvancedPollSettings");
  }

  return build();
}
