import {
  Link,
  Option,
  Participant,
  Poll,
  Role,
  User,
  Vote,
} from "@prisma/client";

export interface GetPollApiResponse extends Poll {
  options: Option[];
  participants: Array<Participant & { votes: Vote[] }>;
  user: User;
  role: Role;
  links: Array<Link>;
  pollId: string;
}
