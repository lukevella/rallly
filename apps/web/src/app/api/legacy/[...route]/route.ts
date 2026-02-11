import { prisma } from "@rallly/database";
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api/legacy");

app.get("/p/:participantUrlId", async (c) => {
  const poll = await prisma.poll.findUnique({
    where: { participantUrlId: c.req.param("participantUrlId") },
    select: { id: true },
  });

  if (!poll) {
    return c.notFound();
  }

  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.redirect(`/invite/${poll.id}`, 301);
});

app.get("/admin/:adminUrlId", async (c) => {
  const poll = await prisma.poll.findUnique({
    where: { adminUrlId: c.req.param("adminUrlId") },
    select: { id: true },
  });

  if (!poll) {
    return c.notFound();
  }

  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.redirect(`/poll/${poll.id}`, 301);
});

export const GET = handle(app);
