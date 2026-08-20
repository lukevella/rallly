import { describe, expect, it } from "vitest";
import { footerLinksSchema } from "./schema";

/**
 * Guards the action's contract: whatever the control panel form submits must
 * survive `footerLinksSchema` (the action's inputSchema) in the exact shape
 * `updateInstanceFooterLinks` writes to the JSON column.
 */
describe("footer links action contract", () => {
  it("accepts the payload the form submits and yields a writable array", () => {
    const formValues = {
      footerLinks: [
        { label: "Impressum", href: "https://example.de/impressum" },
        { label: "Datenschutz", href: "https://example.de/datenschutz" },
      ],
    };

    const parsed = footerLinksSchema.parse(formValues);

    expect(Array.isArray(parsed.footerLinks)).toBe(true);
    expect(parsed.footerLinks).toEqual(formValues.footerLinks);
    // Must be plain JSON — Prisma writes this straight into a JSONB column
    expect(JSON.parse(JSON.stringify(parsed.footerLinks))).toEqual(
      parsed.footerLinks,
    );
  });

  it("accepts clearing every link", () => {
    expect(footerLinksSchema.parse({ footerLinks: [] }).footerLinks).toEqual(
      [],
    );
  });

  it("rejects a payload the server must never persist", () => {
    expect(
      footerLinksSchema.safeParse({
        footerLinks: [{ label: "Evil", href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
});
