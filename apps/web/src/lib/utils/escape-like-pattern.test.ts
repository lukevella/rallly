import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./escape-like-pattern";

describe("escapeLikePattern", () => {
  it("escapes wildcards and backslashes", () => {
    expect(escapeLikePattern("50%_off\\now")).toBe("50\\%\\_off\\\\now");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeLikePattern("Graduate seminar")).toBe("Graduate seminar");
  });
});
