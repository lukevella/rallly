import absoluteUrl from "utils/absolute-url";
import { sendEmailTemplate } from "utils/api-utils";
import { createToken, withSessionRoute } from "utils/auth";

export default withSessionRoute(async (req, res) => {
  switch (req.method) {
    case "POST": {
      const email = req.body.email;
      const homePageUrl = absoluteUrl(req).origin;
      const token = await createToken({
        email,
      });

      const loginUrl = `${homePageUrl}/login?code=${token}`;

      await sendEmailTemplate({
        templateName: "login",
        to: email,
        subject: "Rallly - Login",
        templateVars: {
          loginUrl,
          homePageUrl,
        },
      });
      return;
    }
    default:
      res.status(405);
      return;
  }
});
