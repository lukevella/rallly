import type { SpaceMemberRole as PrismaSpaceMemberRole } from "@prisma/client";
import type { MemberRole } from "@/features/space/schema";

export const toDBRole = (role: MemberRole): PrismaSpaceMemberRole => {
  switch (role) {
    case "member":
      return "MEMBER";
    case "admin":
      return "ADMIN";
  }
};

export const fromDBRole = (role: PrismaSpaceMemberRole): MemberRole => {
  switch (role) {
    case "MEMBER":
      return "member";
    case "ADMIN":
      return "admin";
  }
};
