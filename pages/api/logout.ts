import { withSessionRoute } from "utils/auth";

export default withSessionRoute((req, res) => {
  req.session.destroy();
  res.send({ ok: true });
});
