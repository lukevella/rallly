import { withSessionRoute } from "@rallly/backend/server/session";

export const config = {
  api: {
    externalResolver: true,
  },
};
// export API handler
export default withSessionRoute;
