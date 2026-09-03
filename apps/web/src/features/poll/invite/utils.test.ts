import { describe, expect, it } from "vitest";
import { derivePollInviteStatus } from "./utils";

describe("derivePollInviteStatus", () => {
  it("is sent when nothing has happened", () => {
    expect(
      derivePollInviteStatus({ openedAt: null, participantId: null }),
    ).toBe("sent");
  });

  it("is opened once the invite link was followed", () => {
    expect(
      derivePollInviteStatus({
        openedAt: new Date("2026-09-03T10:00:00Z"),
        participantId: null,
      }),
    ).toBe("opened");
  });

  it("is responded once a participant is joined, even without an open", () => {
    expect(
      derivePollInviteStatus({ openedAt: null, participantId: "p1" }),
    ).toBe("responded");
  });

  it("responded wins over opened", () => {
    expect(
      derivePollInviteStatus({
        openedAt: new Date("2026-09-03T10:00:00Z"),
        participantId: "p1",
      }),
    ).toBe("responded");
  });
});
