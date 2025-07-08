import { defineAbilityFor } from "./ability";
import type { Action, Subject, User } from "./ability";

export function createServerAbility(user: User) {
  const ability = defineAbilityFor({ user });

  return {
    can: <T extends Subject>(action: Action, subject: T, field?: string) => {
      return ability.can(action, subject, field);
    },

    cannot: <T extends Subject>(action: Action, subject: T, field?: string) => {
      return ability.cannot(action, subject, field);
    },
  };
}
