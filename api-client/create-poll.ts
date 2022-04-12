import { Poll } from "@prisma/client";
import axios from "axios";

export interface CreatePollPayload {
  title: string;
  type: "date";
  timeZone?: string;
  location?: string;
  description?: string;
  user: {
    name: string;
    email: string;
  };
  options: string[];
  demo?: boolean;
}

export const createPoll = async (payload: CreatePollPayload): Promise<Poll> => {
  const { data } = await axios.post<Poll>("/api/poll", payload);
  return data;
};
