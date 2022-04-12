import { Poll } from "@prisma/client";
import axios from "axios";

export interface UpdatePollPayload {
  title?: string;
  timeZone?: string;
  location?: string;
  description?: string;
  optionsToDelete?: string[];
  optionsToAdd?: string[];
  notifications?: boolean;
  closed?: boolean;
}

export const updatePoll = async (
  urlId: string,
  payload: UpdatePollPayload,
): Promise<Poll> => {
  try {
    const { data } = await axios.patch<Poll>(`/api/poll/${urlId}`, payload);
    return data;
  } catch (err) {
    throw err;
  }
};
