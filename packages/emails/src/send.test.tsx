import { afterEach, beforeEach, expect, test, vi } from "vitest";

const sendMail = vi.fn(async (_options: unknown) => ({}));

vi.mock("./transport", () => ({
  getTransport: () => ({ sendMail }),
}));

vi.mock("@rallly/logger", () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}));

const { sendRawEmail } = await import("./send");

const savedSupportEmail = process.env.SUPPORT_EMAIL;

beforeEach(() => {
  sendMail.mockClear();
  process.env.SUPPORT_EMAIL = "support@example.com";
});

afterEach(() => {
  if (savedSupportEmail === undefined) {
    delete process.env.SUPPORT_EMAIL;
  } else {
    process.env.SUPPORT_EMAIL = savedSupportEmail;
  }
});

test("emits one-click unsubscribe headers when a URL is given", async () => {
  await sendRawEmail({
    to: "user@example.com",
    subject: "Hello",
    text: "Hi",
    listUnsubscribeUrl: "https://rallly.co/api/unsubscribe/token",
  });

  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0]).toMatchObject({
    headers: {
      "List-Unsubscribe": "<https://rallly.co/api/unsubscribe/token>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
});

test("omits unsubscribe headers when no URL is given", async () => {
  await sendRawEmail({
    to: "user@example.com",
    subject: "Hello",
    text: "Hi",
  });

  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0]).toMatchObject({ headers: undefined });
});
