import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("resolves conflicts between viewport-unit and standard sizing utilities", () => {
    expect(cn("min-h-svh", "min-h-full")).toBe("min-h-full");
  });

  it("does not treat text-wrap utilities as text colors", () => {
    expect(cn("text-pretty", "text-muted-foreground")).toBe(
      "text-pretty text-muted-foreground",
    );
  });

  it("resolves conflicts within the same class group", () => {
    expect(cn("text-balance", "text-pretty")).toBe("text-pretty");
    expect(cn("text-sm", "text-base")).toBe("text-base");
  });
});
