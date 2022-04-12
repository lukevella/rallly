import { Participant, Vote } from "@prisma/client";
import axios from "axios";

export interface AddParticipantPayload {
  pollId: string;
  name: string;
  votes: string[];
}

export type AddParticipantResponse = Participant & {
  votes: Vote[];
};

export const addParticipant = async (
  payload: AddParticipantPayload,
): Promise<AddParticipantResponse> => {
  const res = await axios.post<AddParticipantResponse>(
    `/api/poll/${payload.pollId}/participant`,
    payload,
  );

  return res.data;
};
