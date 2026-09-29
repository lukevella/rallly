import "server-only";

import { zValidator } from "@hono/zod-validator";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { generateCodeVerifier, generateState } from "arctic";
import type { Context } from "hono";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
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
  // Marks a browser that started an admin consent grant, so a decline, which
  // Microsoft reports with `error` and no `admin_consent`, is told apart from
  // a user declining an ordinary connect.
  const ADMIN_CONSENT = `${prefix}admin-consent`;

  // Outcome travels as a one-shot flash (`lib/flash`), not a query param, so
  // a reload of the landing page never replays the toast.
  const setOutcome = (
    c: Context,
    outcome:
      | { connected: string }
      | { adminConsent: string }
      | { error: string; integrationId: string },
  ) => {
    let value: string;
    if ("connected" in outcome) {
      value = `connected:${outcome.connected}`;
    } else if ("adminConsent" in outcome) {
      value = `admin_consent:${outcome.adminConsent}`;
    } else {
      value = `error:${outcome.error}:${outcome.integrationId}`;
    }
    setCookie(c, flashCookieName(OAUTH_FLASH_KEY), value, {
      httpOnly: false,
      secure: cookieOptions.secure,
      sameSite: "lax",
      maxAge: FLASH_MAX_AGE,
      path: "/",
    });
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
        flow: "connect",
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

      deleteCookie(c, ADMIN_CONSENT, { path: "/" });

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

  // A link a user hands to their administrator when their organization does
  // not let users approve apps themselves. It carries no session: the
  // administrator need not have a Rallly account.
  app.get("/admin-consent/:id", validateParams, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const integration = await getIntegration({
        integrationId: id as T,
        callbackUrl: absoluteUrl(`${basePath}/callback/${id}`),
        flow: "admin_consent",
      });

      if (!integration?.getAdminConsentUrl) {
        return c.json({ error: `${id} does not support admin consent` }, 404);
      }

      const state = generateState();
      const redirectTo = validateRedirectUrl(c.req.query("redirect")) || "/";

      setCookie(c, STATE, state, {
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

      setCookie(c, ADMIN_CONSENT, id, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: "/",
      });

      return c.redirect(integration.getAdminConsentUrl(state).toString());
    } catch (error) {
      logger.error({ error }, "Admin consent initiation failed");

      return c.json({ error: "Failed to initiate admin consent" }, 404);
    }
  });

  // OAuth callback endpoint
  app.get("/callback/:id", validateParams, async (c) => {
    try {
      const { id } = c.req.valid("param");
      const isAdminConsentGranted =
        c.req.query("admin_consent")?.toLowerCase() === "true";
      const isAdminConsent =
        isAdminConsentGranted || getCookie(c, ADMIN_CONSENT) === id;

      const integration = await getIntegration({
        integrationId: id as T,
        callbackUrl: absoluteUrl(`${basePath}/callback/${id}`),
        flow: isAdminConsent ? "admin_consent" : "connect",
      });

      if (!integration || (isAdminConsent && !integration.getAdminConsentUrl)) {
        return c.json({ error: `${id} integration not configured` }, 404);
      }

      const code = c.req.query("code");
      const state = c.req.query("state");
      const storedState = getCookie(c, STATE);
      const codeVerifier = getCookie(c, CODE_VERIFIER);
      const storedRedirect = getCookie(c, REDIRECT_TO) || "/";

      const redirectTo = validateRedirectUrl(storedRedirect) || "/";

      // The return leg of an admin consent grant carries no code; the
      // administrator's own sign in was never meant to create a connection.
      if (isAdminConsent) {
        deleteCookie(c, ADMIN_CONSENT, { path: "/" });
        if (!state || !storedState || state !== storedState) {
          setOutcome(c, { error: "invalid_request", integrationId: id });
        } else if (isAdminConsentGranted) {
          setOutcome(c, { adminConsent: id });
        } else {
          setOutcome(c, { error: "admin_consent_denied", integrationId: id });
        }
        return c.redirect(new URL(redirectTo, absoluteUrl()).toString());
      }

      // Validate OAuth callback parameters
      if (
        !code ||
        !state ||
        !storedState ||
        state !== storedState ||
        !codeVerifier
      ) {
        setOutcome(c, { error: "invalid_request", integrationId: id });
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
      setOutcome(c, {
        error: "connection_failed",
        integrationId: c.req.param("id") ?? "",
      });
      return c.redirect(new URL(redirectTo, absoluteUrl()).toString());
    }
  });

  return {
    handler: handle(app),
  };
}
