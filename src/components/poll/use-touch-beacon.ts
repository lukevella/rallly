import { useMount } from "react-use";

import { trpc } from "../../utils/trpc";

/**
 * Touching a poll updates a column with the current date. This information is used to
 * find polls that haven't been accessed for some time so that they can be deleted by house keeping.
 */
export const useTouchBeacon = (pollId: string) => {
  const touchMutation = trpc.useMutation(["polls.touch"]);

  useMount(() => {
    touchMutation.mutate({ pollId });
  });
};
