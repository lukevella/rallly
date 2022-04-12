import { Option, Participant, Role, Vote } from "@prisma/client";

export interface ParticipantForm {
  name: string;
  votes: string[];
}
export interface PollProps {
  pollId: string;
  role: Role | "readOnly";
  timeZone: string | null;
  options: Array<Option & { votes: Vote[] }>;
  participants: Array<Participant & { votes: Vote[] }>;
  highScore: number;
  initialName?: string;
  onChangeTargetTimeZone: (timeZone: string) => void;
  targetTimeZone: string;
}
