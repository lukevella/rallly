import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { previewChrome } from "../components/preview-chrome";
import NewPollEmail from "./new-poll";

const baseProps = {
  title: "Team Meeting",
  name: "Jane Doe",
  adminLink: "https://rallly.co/poll/xyz789",
  participantLink: "https://rallly.co/invite/abc123",
  chrome: previewChrome,
};

describe("NewPollEmail", () => {
  it("renders the participant link as selectable text, not an anchor", async () => {
    const html = await render(await NewPollEmail(baseProps));
    expect(html).not.toContain(`href="${baseProps.participantLink}"`);
    expect(html).toContain("<pre");
    expect(html).toContain("abc123");
  });

  it("splits the participant link so clients cannot auto-link it", async () => {
    const html = await render(await NewPollEmail(baseProps));
    // No contiguous URL in the markup — every delimiter starts a new span.
    expect(html).not.toContain(baseProps.participantLink);
    expect(html).toContain("<span>https</span>");
  });

  it("keeps the full participant link intact in the plain text part", async () => {
    const text = await render(await NewPollEmail(baseProps), {
      plainText: true,
    });
    expect(text).toContain(baseProps.participantLink);
  });

  it("keeps the manage poll button linked to the admin page", async () => {
    const html = await render(await NewPollEmail(baseProps));
    expect(html).toContain(`href="${baseProps.adminLink}"`);
  });
});
