import { Poll } from "@prisma/client";
import axios from "axios";

export const createDemo = async (): Promise<Poll> => {
  const { data } = await axios.post<Poll>("/api/poll/create-demo");
  return data;
};
