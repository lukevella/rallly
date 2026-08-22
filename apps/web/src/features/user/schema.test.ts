import { describe, expect, it } from "vitest";
import { JOB_TITLE_OTHER_MAX_LENGTH } from "@/features/user/constants";
import { jobTitleFieldSchema } from "@/features/user/schema";

describe("jobTitleFieldSchema", () => {
  // Better-Auth runs an additional field's validator against every value that
  // isn't `undefined`, so a non-nullable schema here would make the field
  // impossible to erase — and an un-withdrawable answer can't rest on consent.
  it("accepts null, which is how the answer is withdrawn", () => {
    expect(jobTitleFieldSchema.parse(null)).toBeNull();
  });

  it("accepts a picklist key", () => {
    expect(jobTitleFieldSchema.parse("executive_assistant")).toBe(
      "executive_assistant",
    );
  });

  it("trims free text, since the parsed value is what gets stored", () => {
    expect(jobTitleFieldSchema.parse("  Practice manager  ")).toBe(
      "Practice manager",
    );
  });

  it("rejects blank and whitespace-only free text", () => {
    expect(jobTitleFieldSchema.safeParse("").success).toBe(false);
    expect(jobTitleFieldSchema.safeParse("   ").success).toBe(false);
  });

  it("caps free text length", () => {
    const atLimit = "a".repeat(JOB_TITLE_OTHER_MAX_LENGTH);
    expect(jobTitleFieldSchema.parse(atLimit)).toBe(atLimit);
    expect(jobTitleFieldSchema.safeParse(`${atLimit}a`).success).toBe(false);
  });
});
