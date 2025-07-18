import type { SpaceMemberRole as PrismaSpaceMemberRole } from "@prisma/client";
import type { SpaceMemberRole } from "@/features/spaces/schema";

export const toDBRole = (role: SpaceMemberRole): PrismaSpaceMemberRole => {
  switch (role) {
    case "member":
      return "MEMBER";
    case "admin":
      return "ADMIN";
    case "owner":
      return "OWNER";
  }
};

export const fromDBRole = (role: PrismaSpaceMemberRole): SpaceMemberRole => {
  switch (role) {
    case "MEMBER":
      return "member";
    case "ADMIN":
      return "admin";
    case "OWNER":
      return "owner";
  }
};
