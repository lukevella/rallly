export interface ParticipantForm {
  name: string;
  votes: string[];
}
export interface PollProps {
  pollId: string;
  highScore: number;
  onChangeTargetTimeZone: (timeZone: string) => void;
  targetTimeZone: string;
}
