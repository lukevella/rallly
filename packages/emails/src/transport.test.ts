import { afterEach, beforeEach, expect, test, vi } from "vitest";

const createTransport = vi.fn((_options: unknown) => ({}));

vi.mock("nodemailer", () => ({
  createTransport: (options: unknown) => createTransport(options),
}));

vi.mock("@rallly/logger", () => ({
  logger: { child: () => ({}) },
}));

const { createTransportForProvider } = await import("./transport");

const SMTP_ENV_VARS = [
  "SMTP_USER",
  "SMTP_PWD",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_DEBUG",
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
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining("Only one of SMTP_USER / SMTP_PWD is set"),
  );
  warnSpy.mockRestore();
});

test("does not send partial auth when only SMTP_PWD is set", () => {
  process.env.SMTP_PWD = "password";
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();
});

test("leaves auth undefined and does not warn when neither is set", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  createTransportForProvider("smtp");

  expect(createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ auth: undefined }),
  );
  expect(warnSpy).not.toHaveBeenCalledWith(
    expect.stringContaining("Only one of SMTP_USER / SMTP_PWD is set"),
  );
  warnSpy.mockRestore();
});
