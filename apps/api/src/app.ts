import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Rallly API",
        version: "0.0.1",
      },
    },
  }),
);

app.get(
  "/docs",
  Scalar({
    url: "/openapi",
    pageTitle: "Rallly API Documentation",
    theme: "purple",
  }),
);
