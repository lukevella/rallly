import { User } from "@rallly/database";

export type GetPollApiResponse = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  options: { id: string; start: Date; duration: number }[];
  user: User | null;
  timeZone: string | null;
  adminUrlId: string;
  participantUrlId: string;
  closed: boolean;
  legacy: boolean;
  demo: boolean;
  createdAt: Date;
  deleted: boolean;
};
