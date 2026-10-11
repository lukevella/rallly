import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PollLayout } from "./poll-layout";

const navigation = vi.hoisted(() => ({ pathname: "/poll/abc" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => ({ id: "abc", title: "Team offsite" }),
}));

vi.mock("@/features/poll/components/manage-poll", () => ({
  default: () => null,
}));

vi.mock("@/features/poll/components/notification-toggle", () => ({
  NotificationToggle: () => null,
}));

vi.mock("@/features/poll/components/poll-context-provider", () => ({
  LegacyPollContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

describe("PollLayout's Share button", () => {
  it("opens the share page from the poll page", () => {
    navigation.pathname = "/poll/abc";
    render(<PollLayout>content</PollLayout>);
    expect(screen.getByRole("link", { name: "Share" })).toHaveAttribute(
      "href",
      "/poll/abc/share",
    );
  });

  it("is left out on the share page itself", () => {
    navigation.pathname = "/poll/abc/share";
    render(<PollLayout>content</PollLayout>);
    expect(
      screen.queryByRole("link", { name: "Share" }),
    ).not.toBeInTheDocument();
  });
});
