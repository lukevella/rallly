import { describe, expect, it } from "vitest";

import { getValueByPath } from "./get-value-by-path";

describe("getValueByPath", () => {
  describe("when the path is not nested", () => {
    it("should return the value of the key", () => {
      const path = "key";
      const obj = { key: "value" };
      const value = getValueByPath(obj, path);
      expect(value).toBe("value");
    });
  });

  describe("when the path is nested", () => {
    it("should return the value of the nested key", () => {
      const path = "nested.key";
      const obj = { nested: { key: "value" } };
      const value = getValueByPath(obj, path);
      expect(value).toBe("value");
    });
  });

  describe("when the path is deeply nested", () => {
    it("should return the value of the deeply nested key", () => {
      const path = "deeply.nested.key";
      const obj = { deeply: { nested: { key: "value" } } };
      const value = getValueByPath(obj, path);
      expect(value).toBe("value");
    });
  });

  describe("when the path is not found", () => {
    it("should return undefined", () => {
      const path = "key";
      const obj = {};
      const value = getValueByPath(obj, path);
      expect(value).toBeUndefined();
    });
  });
});
