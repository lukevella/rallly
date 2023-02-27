import { Option, User } from "@prisma/client";

export type GetPollApiResponse = {
  id: string;
  title: string;
  authorName: string;
  location: string | null;
  description: string | null;
  options: Option[];
  user: User;
  timeZone: string | null;
  adminUrlId: string;
  participantUrlId: string;
  verified: boolean;
  closed: boolean;
  legacy: boolean;
  demo: boolean;
  notifications: boolean;
  createdAt: Date;
  deleted: boolean;
};
