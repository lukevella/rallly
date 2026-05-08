import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { polls } from "./routes/polls";

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.route("/v1/polls", polls);

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Rallly API",
        version: "0.0.1",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
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
