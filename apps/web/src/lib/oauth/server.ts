import "server-only";

import { zValidator } from "@hono/zod-validator";
import { generateCodeVerifier, generateState } from "arctic";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { handle } from "hono/vercel";
import { z } from "zod";
import type { CreateOAuthOptions } from "./types";

export function OAuthIntegration<T extends string>(
  options: CreateOAuthOptions<T>,
) {
  const {
    baseUrl,
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

  const app = new Hono().basePath(baseUrl);

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

      const callbackUrl = new URL(`${baseUrl}/callback/${id}`, c.req.url);

      const integration = getIntegration({
        integrationId: id as T,
        callbackUrl: callbackUrl.toString(),
      });

      if (!integration) {
        return c.json({ error: `${id} integration not configured` }, 500);
      }

      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const redirectTo = c.req.query("redirect") || "/";

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
      console.error("OAuth auth initiation failed:", error);

      return c.json({ error: "Failed to initiate OAuth connection" }, 404);
    }
  });

  // OAuth callback endpoint
  app.get("/callback/:id", validateParams, async (c) => {
    try {
      const { id } = c.req.valid("param");

      const callbackUrl = new URL(`${baseUrl}/callback/${id}`, c.req.url);

      const integration = getIntegration({
        integrationId: id as T,
        callbackUrl: callbackUrl.toString(),
      });

      if (!integration) {
        return c.json({ error: `${id} integration not configured` }, 404);
      }

      const code = c.req.query("code");
      const state = c.req.query("state");
      const storedState = getCookie(c, STATE);
      const codeVerifier = getCookie(c, CODE_VERIFIER);
      const storedRedirect = getCookie(c, REDIRECT_TO) || "/";

      const redirectTo =
        storedRedirect.startsWith("/") && !storedRedirect.startsWith("//")
          ? storedRedirect
          : "/";

      // Validate OAuth callback parameters
      if (
        !code ||
        !state ||
        !storedState ||
        state !== storedState ||
        !codeVerifier
      ) {
        const errorUrl = new URL(redirectTo, c.req.url);
        errorUrl.searchParams.set("error", "invalid_request");
        return c.redirect(errorUrl.toString());
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

      // Redirect with success
      const successUrl = new URL(redirectTo, c.req.url);
      successUrl.searchParams.set("connected", "true");
      successUrl.searchParams.set("integration", id);

      return c.redirect(successUrl.toString());
    } catch (error) {
      console.error("OAuth connection failed:", error);

      const redirectTo = getCookie(c, REDIRECT_TO) || "/";
      const errorUrl = new URL(redirectTo, c.req.url);
      errorUrl.searchParams.set("error", "connection_failed");
      return c.redirect(errorUrl.toString());
    }
  });

  return {
    handler: handle(app),
  };
}
