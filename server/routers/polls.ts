import { z } from "zod";

import { getPollFromLink } from "../../utils/queries";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { createRouter } from "../createRouter";
import { demo } from "./polls/demo";

export const polls = createRouter()
  .merge("demo.", demo)
  .query("get", {
    input: z.object({
      urlId: z.string(),
    }),
    resolve: async ({ input }): Promise<GetPollApiResponse> => {
      return await getPollFromLink(input.urlId);
    },
  });
