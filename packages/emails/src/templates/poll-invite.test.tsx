import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { previewChrome } from "../components/preview-chrome";
import PollInviteEmail from "./poll-invite";

const baseProps = {
  hostName: "Jessie Smith",
  pollTitle: "Team offsite dates",
  inviteUrl: "https://rallly.co/invite/abc123?invite=token",
  chrome: previewChrome,
};

describe("PollInviteEmail", () => {
  it("tells the invitee that replies reach the host", async () => {
    const html = await render(await PollInviteEmail(baseProps));
    expect(html).toContain("Reply to this email to reach");
  });
});
