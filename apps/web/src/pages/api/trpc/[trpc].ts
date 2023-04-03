import { trpcNextApiHandler } from "@rallly/backend/next/trpc/server";

export const config = {
  api: {
    externalResolver: true,
  },
  runtime: "edge",
  regions: ["iad1"],
};
// export API handler
export default trpcNextApiHandler;
