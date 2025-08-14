import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";

import { LeaveSpaceDialog } from "./leave-space-dialog";

describe("LeaveSpaceDialog", () => {
  const defaultProps = {
    spaceName: "Test Space",
    onConfirm: vi.fn(),
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog when open", () => {
    render(<LeaveSpaceDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Leave Space" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to leave this space/),
    ).toBeInTheDocument();
  });

  it("shows input field for space name confirmation", () => {
    render(<LeaveSpaceDialog {...defaultProps} />);

    const input = screen.getByLabelText(
      /Please type the space name to confirm/,
    );
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("autoComplete", "off");
    expect(input).toHaveAttribute("data-1p-ignore", "true");
  });

  it("renders cancel and leave space buttons", () => {
    render(<LeaveSpaceDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Leave Space" }),
    ).toBeInTheDocument();
  });

  it("displays form label correctly", () => {
    render(<LeaveSpaceDialog {...defaultProps} />);

    expect(
      screen.getByLabelText("Please type the space name to confirm:"),
    ).toBeInTheDocument();
  });

  it("allows typing in the input field", async () => {
    const user = userEvent.setup();
    render(<LeaveSpaceDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText("Test Space");
    await user.type(input, "Some text");

    expect(input).toHaveValue("Some text");
  });

  it("shows validation error when space name doesn't match", async () => {
    const user = userEvent.setup();
    render(<LeaveSpaceDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText("Test Space");
    const submitButton = screen.getByRole("button", { name: "Leave Space" });

    // Type incorrect space name
    await user.type(input, "Wrong Space Name");
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText("Space name does not match")).toBeInTheDocument();
    });

    // Should not call onConfirm with validation error
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it("trims whitespace from input and accepts correct space name", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<LeaveSpaceDialog {...defaultProps} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Test Space");
    const submitButton = screen.getByRole("button", { name: "Leave Space" });

    // Type space name with leading/trailing whitespace
    await user.type(input, "  Test Space  ");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  it("calls onConfirm when form is submitted with correct space name", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(<LeaveSpaceDialog {...defaultProps} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Test Space");
    const submitButton = screen.getByRole("button", { name: "Leave Space" });

    await user.type(input, "Test Space");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  it("handles async form submission", async () => {
    const user = userEvent.setup();
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    render(<LeaveSpaceDialog {...defaultProps} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Test Space");
    const submitButton = screen.getByRole("button", { name: "Leave Space" });

    await user.type(input, "Test Space");
    await user.click(submitButton);

    // Form submission should be initiated
    expect(onConfirm).toHaveBeenCalled();

    // Resolve the promise
    resolveConfirm();

    // Wait for resolution
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("component props", () => {
    it("uses the provided spaceName as placeholder", () => {
      render(
        <LeaveSpaceDialog {...defaultProps} spaceName="My Custom Space" />,
      );

      expect(
        screen.getByPlaceholderText("My Custom Space"),
      ).toBeInTheDocument();
    });

    it("renders children when provided", () => {
      render(
        <LeaveSpaceDialog {...defaultProps} open={false}>
          <button type="button">Custom Trigger</button>
        </LeaveSpaceDialog>,
      );

      // Children render outside the dialog (as triggers), even when dialog is closed
      expect(
        screen.getByRole("button", { name: "Custom Trigger" }),
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper form labels", () => {
      render(<LeaveSpaceDialog {...defaultProps} />);

      const input = screen.getByLabelText(
        /Please type the space name to confirm/,
      );
      expect(input).toBeInTheDocument();
    });

    it("dialog has proper accessibility attributes", () => {
      render(<LeaveSpaceDialog {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-describedby");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });

    it("form submission works via keyboard", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);

      render(<LeaveSpaceDialog {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByPlaceholderText("Test Space");

      await user.type(input, "Test Space");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });
  });

  describe("validation schema", () => {
    it("validates exact space name match", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);

      render(
        <LeaveSpaceDialog
          {...defaultProps}
          onConfirm={onConfirm}
          spaceName="Exact Match Required"
        />,
      );

      const input = screen.getByPlaceholderText("Exact Match Required");
      const submitButton = screen.getByRole("button", { name: "Leave Space" });

      // Test partial match fails
      await user.type(input, "Exact Match");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Space name does not match"),
        ).toBeInTheDocument();
      });
      expect(onConfirm).not.toHaveBeenCalled();

      // Clear and test exact match succeeds
      await user.clear(input);
      await user.type(input, "Exact Match Required");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });

    it("shows validation message when input is empty", async () => {
      const user = userEvent.setup();
      render(<LeaveSpaceDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "Leave Space" });

      // Try to submit without typing anything
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Space name does not match"),
        ).toBeInTheDocument();
      });

      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });
});
