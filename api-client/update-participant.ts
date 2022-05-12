import { VoteType } from "@prisma/client";
import axios from "axios";

export interface UpdateParticipantPayload {
  pollId: string;
  participantId: string;
  name: string;
  votes: { optionId: string; type: VoteType }[];
}

export const updateParticipant = async (
  payload: UpdateParticipantPayload,
): Promise<void> => {
  const { pollId, participantId, ...body } = payload;
  await axios.patch(`/api/poll/${pollId}/participant/${participantId}`, body);
};
