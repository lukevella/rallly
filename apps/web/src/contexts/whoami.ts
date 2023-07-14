import { trpc } from "@rallly/backend";

export const useWhoAmI = () => {
  const { data: whoAmI } = trpc.whoami.get.useQuery();
  return whoAmI;
};
