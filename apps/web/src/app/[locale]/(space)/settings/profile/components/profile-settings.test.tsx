import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ProfileSettings } from "./profile-settings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/feature-flags/client", () => ({
  useFeatureFlag: () => false,
}));

vi.mock("@/features/user/actions", () => ({
  updateUserNameAction: vi.fn(),
  getAvatarUploadUrlAction: vi.fn(),
  updateUserAvatarAction: vi.fn(),
  removeUserAvatarAction: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ executeAsync: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      requestEmailChange: vi.fn(),
      changeEmail: vi.fn(),
    },
  },
}));

function renderProfileSettings() {
  return render(
    <ProfileSettings name="Ada Lovelace" email="ada@example.com" />,
  );
}

describe("ProfileSettings", () => {
  it("renders picture, name and email as rows in one group", () => {
    renderProfileSettings();
    expect(screen.getByText("Picture")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue(
      "Ada Lovelace",
    );
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("only offers to save the name once it has been edited", async () => {
    const user = userEvent.setup();
    renderProfileSettings();

    expect(
      screen.queryByRole("button", { name: /^save$/i }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /name/i }), "!");

    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  it("opens the change email dialog from the email row", async () => {
    const user = userEvent.setup();
    renderProfileSettings();

    await user.click(screen.getByRole("button", { name: /email/i }));

    expect(
      screen.getByRole("textbox", { name: /new email address/i }),
    ).toHaveValue("ada@example.com");
  });
});
