import { trpc } from "@rallly/backend";

export const useWhoAmI = () => {
  const { data: whoAmI } = trpc.user.whoAmI.useQuery();
  return whoAmI;
};
