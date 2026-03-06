import { timezoneSchema } from "./timezone-schema";

describe("timezoneSchema", () => {
  it("should accept a geographic timezone", () => {
    expect(timezoneSchema.safeParse("Europe/London").success).toBe(true);
  });

  it("should canonicalize a legacy alias", () => {
    const result = timezoneSchema.safeParse("America/Montreal");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("America/Toronto");
    }
  });

  it("should reject Etc/ timezones", () => {
    expect(timezoneSchema.safeParse("Etc/GMT-1").success).toBe(false);
  });

  it("should reject GMT", () => {
    expect(timezoneSchema.safeParse("GMT").success).toBe(false);
  });

  it("should reject UTC", () => {
    expect(timezoneSchema.safeParse("UTC").success).toBe(false);
  });

  it("should reject an invalid timezone", () => {
    expect(timezoneSchema.safeParse("Not/A_Timezone").success).toBe(false);
  });
});
