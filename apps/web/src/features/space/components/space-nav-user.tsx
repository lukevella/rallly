"use client";

import { useSpace } from "@/features/space/client";
import { SpaceRole } from "@/features/space/components/space-role";
import { NavUser } from "@/features/user/components/nav-user";

// NavUser with the member's role in the active space instead of their
// email. Lives in space rather than user because the composition needs the
// space context and user cannot import space without a feature cycle.
export function SpaceNavUser() {
  const { data: space } = useSpace();

  return <NavUser subtitle={<SpaceRole role={space.role} />} />;
}
