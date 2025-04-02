import type { PollStatus, VoteType } from "@rallly/database";

export type GetPollApiResponse = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  options: { id: string; startTime: Date; duration: number }[];
  user: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    banned: boolean;
  } | null;
  timeZone: string | null;
  adminUrlId: string;
  status: PollStatus;
  participantUrlId: string;
  createdAt: Date;
  deleted: boolean;
};

export type Vote = {
  optionId: string;
  type: VoteType;
};
