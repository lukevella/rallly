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

test("omits the one-click flag for a non-https URL", async () => {
  await sendRawEmail({
    to: "user@example.com",
    subject: "Hello",
    text: "Hi",
    listUnsubscribeUrl: "http://localhost:3000/api/unsubscribe/token",
  });

  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0]).toMatchObject({
    headers: {
      "List-Unsubscribe": "<http://localhost:3000/api/unsubscribe/token>",
    },
  });
  expect(sendMail.mock.calls[0][0]).not.toHaveProperty(
    "headers.List-Unsubscribe-Post",
  );
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

test("redirects SES feedback to SES_FEEDBACK_EMAIL when set", async () => {
  process.env.SES_FEEDBACK_EMAIL = "complaints@example.com";
  try {
    await sendRawEmail({
      to: "user@example.com",
      subject: "Hello",
      text: "Hi",
    });
  } finally {
    delete process.env.SES_FEEDBACK_EMAIL;
  }

  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0]).toMatchObject({
    ses: { FeedbackForwardingEmailAddress: "complaints@example.com" },
  });
});

test("passes no SES options when SES_FEEDBACK_EMAIL is unset", async () => {
  await sendRawEmail({
    to: "user@example.com",
    subject: "Hello",
    text: "Hi",
  });

  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0]).toMatchObject({ ses: undefined });
});
