---
name: email-and-password-best-practices
description: This skill provides guidance and enforcement rules for implementing secure email and password authentication using Better Auth.
---

## Email Verification Setup

When enabling email/password authentication, configure `emailVerification.sendVerificationEmail` to verify user email addresses. This helps prevent fake sign-ups and ensures users have access to the email they registered with.

```ts
import { betterAuth } from "better-auth";
import { sendEmail } from "./email"; // your email sending function

export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
});
```

**Note**: The `url` parameter contains the full verification link. The `token` is available if you need to build a custom verification URL.

### Requiring Email Verification

For stricter security, enable `emailAndPassword.requireEmailVerification` to block sign-in until the user verifies their email. When enabled, unverified users will receive a new verification email on each sign-in attempt.

```ts
export const auth = betterAuth({
  emailAndPassword: {
    requireEmailVerification: true,
  },
});
```

**Note**: This requires `sendVerificationEmail` to be configured and only applies to email/password sign-ins.

## Client side validation

While Better Auth validates inputs server-side, implementing client-side validation is still recommended for two key reasons:

1. **Improved UX**: Users receive immediate feedback when inputs don't meet requirements, rather than waiting for a server round-trip.
2. **Reduced server load**: Invalid requests are caught early, minimizing unnecessary network traffic to your auth server.

## Callback URLs

Always use absolute URLs (including the origin) for callback URLs in sign-up and sign-in requests. This prevents Better Auth from needing to infer the origin, which can cause issues when your backend and frontend are on different domains.

```ts
const { data, error } = await authClient.signUp.email({
  callbackURL: "https://example.com/callback", // absolute URL with origin
});
```

## Password Reset Flows

Password reset flows are essential to any email/password system, we recommend setting this up.

To allow users to reset a password first you need to provide `sendResetPassword` function to the email and password authenticator.

```ts
import { betterAuth } from "better-auth";
import { sendEmail } from "./email"; // your email sending function

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    // Custom email sending function to send reset-password email
    sendResetPassword: async ({ user, url, token }, request) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
    // Optional event hook
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
});
```

### Security considerations

Better Auth implements several security measures in the password reset flow:

#### Timing attack prevention

- **Background email sending**: Better Auth uses `runInBackgroundOrAwait` internally to send reset emails without blocking the response. This prevents attackers from measuring response times to determine if an email exists.
- **Dummy operations on invalid requests**: When a user is not found, Better Auth still performs token generation and a database lookup (with a dummy value) to maintain consistent response times.
- **Constant response message**: The API always returns `"If this email exists in our system, check your email for the reset link"` regardless of whether the user exists.

On serverless platforms, configure a background task handler to ensure emails are sent reliably:

```ts
export const auth = betterAuth({
  advanced: {
    backgroundTasks: {
      handler: (promise) => {
        // Use platform-specific methods like waitUntil
        waitUntil(promise);
      },
    },
  },
});
```

#### Token security

- **Cryptographically random tokens**: Reset tokens are generated using `generateId(24)`, producing a 24-character alphanumeric string (a-z, A-Z, 0-9) with high entropy.
- **Token expiration**: Tokens expire after **1 hour** by default. Configure with `resetPasswordTokenExpiresIn` (in seconds):

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 30, // 30 minutes
  },
});
```

- **Single-use tokens**: Tokens are deleted immediately after successful password reset, preventing reuse.

#### Session revocation

Enable `revokeSessionsOnPasswordReset` to invalidate all existing sessions when a password is reset. This ensures that if an attacker has an active session, it will be terminated:

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
  },
});
```

#### Redirect URL validation

The `redirectTo` parameter is validated against your `trustedOrigins` configuration to prevent open redirect attacks. Malicious redirect URLs will be rejected with a 403 error.

#### Password requirements

During password reset, the new password must meet length requirements:
- **Minimum**: 8 characters (default), configurable via `minPasswordLength`
- **Maximum**: 128 characters (default), configurable via `maxPasswordLength`

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 256,
  },
});
```

### Sending the password reset

Once the password reset configurations are set-up, you can now call the `requestPasswordReset` function to send reset password link to user. If the user exists, it will trigger the `sendResetPassword` function you provided in the auth config.

```ts
const data = await auth.api.requestPasswordReset({
  body: {
    email: "john.doe@example.com", // required
    redirectTo: "https://example.com/reset-password",
  },
});
```

Or authClient:

```ts
const { data, error } = await authClient.requestPasswordReset({
  email: "john.doe@example.com", // required
  redirectTo: "https://example.com/reset-password",
});
```

**Note**: While the `email` is required, we also recommend configuring the `redirectTo` for a smoother user experience.

## Password Hashing

Better Auth uses `scrypt` by default for password hashing. This is a solid choice because:

- It's designed to be slow and memory-intensive, making brute-force attacks costly
- It's natively supported by Node.js (no external dependencies)
- OWASP recommends it when Argon2id isn't available

### Custom Hashing Algorithm

To use a different algorithm (e.g., Argon2id), provide custom `hash` and `verify` functions in the `emailAndPassword.password` configuration:

```ts
import { betterAuth } from "better-auth";
import { hash, verify, type Options } from "@node-rs/argon2";

const argon2Options: Options = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel lanes
  outputLen: 32, // 32 byte output
  algorithm: 2, // Argon2id variant
};

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password) => hash(password, argon2Options),
      verify: ({ password, hash: storedHash }) =>
        verify(storedHash, password, argon2Options),
    },
  },
});
```

**Note**: If you switch hashing algorithms on an existing system, users with passwords hashed using the old algorithm won't be able to sign in. Plan a migration strategy if needed.
