import { Link, Option, Participant, Poll, User, Vote } from "@prisma/client";

export interface GetPollApiResponse extends Poll {
  options: Option[];
  participants: Array<Participant & { votes: Vote[] }>;
  user: User;
  role: "admin" | "participant";
  links: Array<Link>;
  pollId: string;
}
