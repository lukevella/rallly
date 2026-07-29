import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MaxCharLength } from "./max-char-length";

function renderIndicator(length: number, maxLength = 2000) {
  return render(
    <MaxCharLength
      length={length}
      maxLength={maxLength}
      label={`${maxLength - length} characters remaining`}
    />,
  );
}

describe("MaxCharLength", () => {
  it("stays hidden below the 85% threshold", () => {
    const { container } = renderIndicator(1699);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("shows the donut and remaining count at the threshold", () => {
    const { container } = renderIndicator(1700);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("300");
  });

  it("announces the remaining count via a polite live region", () => {
    const { container } = renderIndicator(1900);
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion?.textContent).toBe("100 characters remaining");
  });

  it("keeps the live region empty below the threshold", () => {
    const { container } = renderIndicator(100);
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toBe("");
  });

  it("fills the ring proportionally", () => {
    const { container } = renderIndicator(1800);
    const [, arc] = Array.from(container.querySelectorAll("circle"));
    const circumference = Number.parseFloat(
      arc.getAttribute("stroke-dasharray") ?? "0",
    );
    const offset = Number.parseFloat(
      arc.getAttribute("stroke-dashoffset") ?? "0",
    );
    expect(offset / circumference).toBeCloseTo(0.1, 5);
  });

  it("marks the at-limit state with a full ring and a zero count", () => {
    const { container } = renderIndicator(2000);
    const [, arc] = Array.from(container.querySelectorAll("circle"));
    expect(Number.parseFloat(arc.getAttribute("stroke-dashoffset") ?? "")).toBe(
      0,
    );
    expect(arc.classList.contains("stroke-destructive")).toBe(true);
    expect(container.textContent).toContain("0");
  });

  it("clamps the ring and shows a negative count when over the limit", () => {
    const { container } = renderIndicator(2100);
    const [, arc] = Array.from(container.querySelectorAll("circle"));
    expect(Number.parseFloat(arc.getAttribute("stroke-dashoffset") ?? "")).toBe(
      0,
    );
    expect(container.textContent).toContain("-100");
  });
});
