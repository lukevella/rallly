import { Link, Option, Poll, Role, User } from "@prisma/client";

export interface GetPollApiResponse extends Poll {
  options: Option[];
  user: User;
  role: Role;
  links: Array<Link>;
  pollId: string;
}
