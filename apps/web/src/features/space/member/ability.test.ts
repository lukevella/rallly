import { subject } from "@casl/ability";
import { describe, expect, it } from "vitest";
import { defineAbilityForMember } from "./ability";
import type { MemberDTO } from "./types";

const SPACE_ID = "space-1";
const OWNER_ID = "user-owner";
const ADMIN_ID = "user-admin";
const MEMBER_ID = "user-member";

function makeMember(overrides: Partial<MemberDTO>): MemberDTO {
  return {
    id: "member-row",
    name: "Test User",
    email: "test@example.com",
    userId: MEMBER_ID,
    spaceId: SPACE_ID,
    role: "member",
    isOwner: false,
    ...overrides,
  };
}

describe("defineAbilityForMember", () => {
  describe("non-owner admin", () => {
    const ability = defineAbilityForMember({
      user: { id: ADMIN_ID },
      space: { id: SPACE_ID, ownerId: OWNER_ID, role: "admin" },
    });

    const owner = makeMember({
      id: "member-owner",
      userId: OWNER_ID,
      role: "admin",
      isOwner: true,
    });

    it("cannot remove the space owner", () => {
      expect(ability.can("delete", subject("SpaceMember", owner))).toBe(false);
    });

    it("cannot change the space owner's role", () => {
      expect(ability.can("update", subject("SpaceMember", owner))).toBe(false);
    });

    it("cannot remove themselves", () => {
      const self = makeMember({
        id: "member-admin",
        userId: ADMIN_ID,
        role: "admin",
      });
      expect(ability.can("delete", subject("SpaceMember", self))).toBe(false);
      expect(ability.can("update", subject("SpaceMember", self))).toBe(false);
    });

    it("cannot act on members of another space", () => {
      const otherSpaceMember = makeMember({
        id: "member-other",
        spaceId: "space-2",
      });
      expect(
        ability.can("delete", subject("SpaceMember", otherSpaceMember)),
      ).toBe(false);
      expect(
        ability.can("update", subject("SpaceMember", otherSpaceMember)),
      ).toBe(false);
    });

    it("can remove and update a regular member", () => {
      const regularMember = makeMember({});
      expect(ability.can("delete", subject("SpaceMember", regularMember))).toBe(
        true,
      );
      expect(ability.can("update", subject("SpaceMember", regularMember))).toBe(
        true,
      );
    });
  });

  describe("owner admin", () => {
    const ability = defineAbilityForMember({
      user: { id: OWNER_ID },
      space: { id: SPACE_ID, ownerId: OWNER_ID, role: "admin" },
    });

    it("can remove and update other admins", () => {
      const otherAdmin = makeMember({
        id: "member-admin",
        userId: ADMIN_ID,
        role: "admin",
      });
      expect(ability.can("delete", subject("SpaceMember", otherAdmin))).toBe(
        true,
      );
      expect(ability.can("update", subject("SpaceMember", otherAdmin))).toBe(
        true,
      );
    });
  });
});
