import { beforeAll, describe, expect, it } from "vitest";
import { MODERATION_AI_FAILURE_REASON } from "./constants";
import { classifyContent } from "./service";

// Calls the live model, so it only runs on request:
// MODERATION_EVAL=true OPENAI_API_KEY=... pnpm vitest run src/features/moderation/service.test.ts
// Run it before changing the prompt or the model. The legitimate cases are
// shaped after polls the model wrongly flagged; the scams after real flags.
const runEval = process.env.MODERATION_EVAL === "true";

const legitimate: Record<string, string> = {
  "an official government link whose text does not match": `Title:
Committee meeting

Description:
[Notes from the last meeting and next steps](https://www.gov.uk/register-to-vote)`,
  "a payment link on the brand's own domain": `Title:
Team lunch on Friday

Description:
Pick a day. I'll book the table, pay me back at https://paypal.me/jsmith`,
  "a shortened video call link": `Title:
Book club monthly call

Location:
https://bit.ly/bookclub-call (Google Meet)`,
  "a shared document with a login for the team": `Title:
Office rota for December

Description:
Rota is in https://docs.example-school.org/rota. The shared inbox login is office@example-school.org / Winter2026`,
  "a venue phone number": `Title:
Book club dinner

Location:
Trattoria Roma, call +44 20 7946 0958 to change the booking`,
};

const scams: Record<string, string> = {
  "a payment alert asking for a call": `Title:
PayPal: payment of $499.99 authorized

Description:
If you did not authorize this transaction call PayPal support now at +1 (808) 555-0143 to cancel and get a refund.`,
  "a fake antivirus renewal": `Title:
Norton 360 subscription renewed

Description:
Your account was charged $389.00. To cancel and claim your refund within 24 hours call our billing desk +1 802 555 0199.`,
  "a lookalike verification link": `Title:
Poshmark account verification required

Description:
Your seller account is on hold. Verify your identity at https://poshmark-verify-account.com/login to keep selling.`,
  "a password reset on a lookalike domain": `Title:
Doodle: your password expires today

Description:
Update your password at https://doodle-com.security-login.net/reset to keep access to your polls.`,
};

describe.skipIf(!runEval)("classifyContent", () => {
  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("MODERATION_EVAL needs OPENAI_API_KEY");
    }
  });

  it.each(Object.entries(legitimate))(
    "allows %s",
    async (_, text) => {
      const result = await classifyContent(text);
      expect(result.reason).not.toBe(MODERATION_AI_FAILURE_REASON);
      expect(result, result.reason).toMatchObject({ verdict: "safe" });
    },
    60_000,
  );

  it.each(Object.entries(scams))(
    "flags %s",
    async (_, text) => {
      const result = await classifyContent(text);
      expect(result, result.reason).toMatchObject({ verdict: "flagged" });
    },
    60_000,
  );
});
