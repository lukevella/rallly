import { Participant, Vote, VoteType } from "@prisma/client";
import axios from "axios";

export interface UpdateParticipantPayload {
  pollId: string;
  participantId: string;
  name: string;
  votes: Array<{ optionId: string; type: VoteType }>;
}

export const updateParticipant = async (
  payload: UpdateParticipantPayload,
): Promise<Participant & { votes: Vote[] }> => {
  const { pollId, participantId, ...body } = payload;
  const res = await axios.patch<Participant & { votes: Vote[] }>(
    `/api/poll/${pollId}/participant/${participantId}`,
    body,
  );
  return res.data;
};
