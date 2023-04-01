import { withSessionRoute } from "@rallly/backend/next";

export const config = {
  api: {
    externalResolver: true,
  },
};
// export API handler
export default withSessionRoute;
