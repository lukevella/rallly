import { withSessionRoute } from "utils/auth";

import { prisma } from "../../db";

export default withSessionRoute(async (req, res) => {
  if (req.session.user?.isGuest === false) {
    const user = await prisma.user.findUnique({
      where: { id: req.session.user.id },
    });

    res.json({
      user: user
        ? { id: user.id, name: user.name, email: user.email, isGuest: false }
        : null,
    });

    return;
  }
  res.json({ user: req.session.user ?? null });
});
