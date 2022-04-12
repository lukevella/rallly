import { Link, Option, Participant, Poll, User, Vote } from "@prisma/client";

export interface GetPollApiResponse extends Omit<Poll, "verificationCode"> {
  options: Array<Option & { votes: Vote[] }>;
  participants: Array<Participant & { votes: Vote[] }>;
  user: User;
  role: "admin" | "participant";
  links: Array<Link>;
  pollId: string;
}

export interface GetPollResponse extends Omit<GetPollApiResponse, "createdAt"> {
  createdAt: string;
}
