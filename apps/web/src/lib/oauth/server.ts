import "server-only";

import { zValidator } from "@hono/zod-validator";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { generateCodeVerifier, generateState } from "arctic";
import type { Context } from "hono";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { handle } from "hono/vercel";
import * as z from "zod";
import { FLASH_MAX_AGE, flashCookieName } from "@/lib/flash/constants";
import { validateRedirectUrl } from "@/lib/utils/redirect";
import { OAUTH_FLASH_KEY } from "./constants";
import type { CreateOAuthOptions } from "./types";

const logger = createLogger("oauth");

export function OAuthIntegration<T extends string>(
  options: CreateOAuthOptions<T>,
) {
  const {
    basePath,
    getIntegration,
    cookieConfig = {
      prefix: "oauth.",
      maxAge: 600, // 10 minutes
      secure: true,
      sameSite: "lax",
    },
  } = options;

  const { prefix = "oauth.", ...cookieOptions } = cookieConfig;
  const CODE_VERIFIER = `${prefix}code-verifier`;
  const REDIRECT_TO = `${prefix}redirect-to`;
  const STATE = `${prefix}state`;

  // Outcome travels as a one-shot flash (`lib/flash`), not a query param, so
  // a reload of the landing page never replays the toast.
  const setOutcome = (
    c: Context,
    outcome: { connected: string } | { error: string },
  ) => {
    setCookie(
      c,
      flashCookieName(OAUTH_FLASH_KEY),
      "connected" in outcome
        ? `connected:${outcome.connected}`
        : `error:${outcome.error}`,
      {
        httpOnly: false,
        secure: cookieOptions.secure,
        sameSite: "lax",
        maxAge: FLASH_MAX_AGE,
        path: "/",
      },
    );
  };

  const app = new Hono().basePath(basePath);

  // Create schema with available provider names
  const validateParams = zValidator(
    "param",
    z.object({
      id: z.string(),
    }),
  );

  // Authorization endpoint
  app.get("/auth/:id", validateParams, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const integration = await getIntegration({
        integrationId: id as T,
        callbackUrl: absoluteUrl(`${basePath}/callback/${id}`),
      });

      if (!integration) {
        return c.json({ error: `${id} integration not configured` }, 500);
      }

      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const redirectTo = validateRedirectUrl(c.req.query("redirect")) || "/";

      const authorizationUrl = integration.getAuthorizationUrl(
        state,
        codeVerifier,
      );

      // Set secure cookies
      setCookie(c, STATE, state, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: "/",
      });

      setCookie(c, CODE_VERIFIER, codeVerifier, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: "/",
      });

      setCookie(c, REDIRECT_TO, redirectTo, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: "/",
      });

      return c.redirect(authorizationUrl.toString());
    } catch (error) {
      logger.error({ error }, "OAuth auth initiation failed");

      return c.json({ error: "Failed to initiate OAuth connection" }, 404);
    }
  });

  // OAuth callback endpoint
  app.get("/callback/:id", validateParams, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const integration = await getIntegration({
        integrationId: id as T,
        callbackUrl: absoluteUrl(`${basePath}/callback/${id}`),
      });

      if (!integration) {
        return c.json({ error: `${id} integration not configured` }, 404);
      }

      const code = c.req.query("code");
      const state = c.req.query("state");
      const storedState = getCookie(c, STATE);
      const codeVerifier = getCookie(c, CODE_VERIFIER);
      const storedRedirect = getCookie(c, REDIRECT_TO) || "/";

      const redirectTo = validateRedirectUrl(storedRedirect) || "/";

      // Validate OAuth callback parameters
      if (
        !code ||
        !state ||
        !storedState ||
        state !== storedState ||
        !codeVerifier
      ) {
        setOutcome(c, { error: "invalid_request" });
        return c.redirect(new URL(redirectTo, absoluteUrl()).toString());
      }

      // Exchange code for tokens
      const tokens = await integration.exchangeCode(code, codeVerifier);

      const userInfo = await integration.getUserInfo(tokens);

      await integration.onConnect?.({
        providerAccountId: userInfo.id,
        userInfo,
        provider: integration.provider,
        tokens,
      });

      setOutcome(c, { connected: id });
      return c.redirect(new URL(redirectTo, absoluteUrl()).toString());
    } catch (error) {
      logger.error({ error }, "OAuth connection failed");

      const redirectTo = getCookie(c, REDIRECT_TO) || "/";
      setOutcome(c, { error: "connection_failed" });
      return c.redirect(new URL(redirectTo, absoluteUrl()).toString());
    }
  });

  return {
    handler: handle(app),
  };
}
