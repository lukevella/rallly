import { afterEach, beforeEach, expect, test, vi } from "vitest";

const createTransport = vi.fn((_options: unknown) => ({}));

vi.mock("nodemailer", () => ({
  createTransport: (options: unknown) => createTransport(options),
}));

const { createTransportForProvider } = await import("./transport");

const SMTP_ENV_VARS = [
  "SMTP_USER",
  "SMTP_PWD",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_NAME",
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  createTransport.mockClear();
  for (const name of SMTP_ENV_VARS) {
    savedEnv[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of SMTP_ENV_VARS) {
    if (savedEnv[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = savedEnv[name];
    }
  }
});

test("enables auth when both SMTP_USER and SMTP_PWD are set", () => {
  process.env.SMTP_USER = "user@example.com";
  process.env.SMTP_PWD = "password";

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      auth: { user: "user@example.com", pass: "password" },
    }),
  );
});

test("does not send partial auth when only SMTP_USER is set", () => {
  process.env.SMTP_USER = "user@example.com";

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
});

test("does not send partial auth when only SMTP_PWD is set", () => {
  process.env.SMTP_PWD = "password";

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
});

test("leaves auth undefined when neither is set", () => {
  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
});

test("passes SMTP_NAME as the EHLO name", () => {
  process.env.SMTP_NAME = "rallly.example.com";

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ name: "rallly.example.com" }),
  );
});

test("leaves the EHLO name to nodemailer when SMTP_NAME is unset", () => {
  createTransportForProvider("smtp");

  expect(
    (createTransport.mock.calls[0]?.[0] as { name?: string }).name,
  ).toBeUndefined();
});
