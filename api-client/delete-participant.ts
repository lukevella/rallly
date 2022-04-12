import axios from "axios";

export interface DeleteParticipantPayload {
  pollId: string;
  participantId: string;
}

export const deleteParticipant = async (
  payload: DeleteParticipantPayload,
): Promise<void> => {
  try {
    const { pollId, participantId } = payload;
    await axios.delete(`/api/poll/${pollId}/participant/${participantId}`);
  } catch (err) {
    throw err;
  }
};
