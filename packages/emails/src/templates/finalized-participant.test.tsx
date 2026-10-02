import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { previewChrome } from "../components/preview-chrome";
import FinalizeParticipantEmail from "./finalized-participant";

const baseProps = {
  title: "Team Meeting",
  hostName: "Jane Doe",
  pollUrl: "https://rallly.co/invite/abc",
  date: "Friday, 12 June 2026",
  time: "6:00 PM to 7:00 PM BST",
  chrome: previewChrome,
};

// Text only: styled components put inline styles on every tag.
async function renderText(props: { vote?: "yes" | "ifNeedBe" | "no" } = {}) {
  const html = await render(
    await FinalizeParticipantEmail({ ...baseProps, ...props }),
  );
  return html.replace(/<[^>]+>/g, "");
}

describe("FinalizeParticipantEmail", () => {
  it.each([
    ["yes", "Yes"],
    ["ifNeedBe", "If need be"],
    ["no", "No"],
  ] as const)("states a %s vote on the booked date", async (vote, label) => {
    const text = await renderText({ vote });
    expect(text).toContain(`You voted ${label} for this date.`);
  });

  it("omits the vote line when the invitee didn't vote", async () => {
    const text = await renderText();
    expect(text).not.toContain("You voted");
  });
});
