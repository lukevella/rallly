import { absoluteUrl } from "./absolute-url";

describe("absoluteUrl", () => {
  describe("when NEXT_PUBLIC_BASE_URL is set", () => {
    beforeAll(() => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    });

    afterAll(() => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    });

    it("should return the value of NEXT_PUBLIC_BASE_URL", () => {
      expect(absoluteUrl()).toBe("https://example.com");
    });
    it("should return the correct absolute URL with query params", () => {
      expect(absoluteUrl("/", { test: "test" })).toBe(
        "https://example.com/?test=test",
      );
    });
    it("should return the correct absolute URL with a subpath and query params", () => {
      expect(absoluteUrl("/test", { test: "test" })).toBe(
        "https://example.com/test?test=test",
      );
    });
  });

  describe("when NEXT_PUBLIC_BASE_URL is not set", () => {
    it("should return the correct absolute URL with a subpath and query params", () => {
      expect(absoluteUrl("/test", { test: "test" })).toBe(
        "http://localhost:3000/test?test=test",
      );
    });

    describe("when NEXT_PUBLIC_VERCEL_URL is set", () => {
      beforeAll(() => {
        process.env.NEXT_PUBLIC_VERCEL_URL = "example.vercel.com";
      });

      afterAll(() => {
        delete process.env.NEXT_PUBLIC_VERCEL_URL;
      });

      it("should return the correct absolute URL with a subpath and query params", () => {
        expect(absoluteUrl("/test", { test: "test" })).toBe(
          "https://example.vercel.com/test?test=test",
        );
      });
    });
  });
});
