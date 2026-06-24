import { isBusinessEmail } from "../../../src/utils/is-business-email";

describe("isValidBusinessEmail", () => {
  it("should return false because its a free domain", () => {
    expect(isBusinessEmail("marc.zuckerberg@outlook.com")).toBe(false);
  });

  it("should return true because its a business domain", () => {
    expect(isBusinessEmail("marc.zuckerberg@zuckerberg.com")).toBe(true);
  });

  it("should return false because no valid email", () => {
    expect(isBusinessEmail("select * from email")).toBe(false);
  });
});
