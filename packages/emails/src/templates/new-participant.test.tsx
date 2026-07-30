import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { previewChrome } from "../components/preview-chrome";
import NewParticipantEmail from "./new-participant";

const baseProps = {
  title: "Team Meeting",
  participantName: "Jane Doe",
  pollUrl: "https://rallly.co/poll/abc",
  disableNotificationsUrl: "https://rallly.co/settings",
  chrome: previewChrome,
};

// i18n interpolation does not run under vitest (ICU backend quirk), so
// assertions target default copy substrings and prop content only.
async function renderEmail(props: { note?: string; canReply?: boolean } = {}) {
  return render(await NewParticipantEmail({ ...baseProps, ...props }));
}

describe("NewParticipantEmail", () => {
  it("renders the note as a quote block", async () => {
    const html = await renderEmail({ note: "Running 15 minutes late" });
    expect(html).toContain("Running 15 minutes late");
    expect(html).toContain("border-left");
  });

  it("escapes user provided note content", async () => {
    const html = await renderEmail({ note: '<script>alert("xss")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders no quote block without a note", async () => {
    const html = await renderEmail();
    expect(html).not.toContain("border-left");
  });

  it("shows reply guidance only when a reply address exists", async () => {
    const withReply = await renderEmail({ note: "A note", canReply: true });
    expect(withReply).toContain("You can reply to this email");

    const withoutReply = await renderEmail({ note: "A note" });
    expect(withoutReply).not.toContain("You can reply to this email");
  });
});
