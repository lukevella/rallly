import { GetPollResponse } from "api-client/get-poll";
import React from "react";

export const PollContext = React.createContext<GetPollResponse | null>(null);

export const usePoll = () => {
  const context = React.useContext(PollContext);
  if (!context) {
    throw new Error("Tried to get poll from context but got undefined");
  }
  return context;
};
