import { describe, expect, it } from "vitest";
import {
  camelToSnakeCase,
  convertKeysToSnakeCase,
} from "./camel-to-snake-case";

describe("camelToSnakeCase", () => {
  it("should convert camelCase to snake_case", () => {
    expect(camelToSnakeCase("firstName")).toBe("first_name");
    expect(camelToSnakeCase("hasLocation")).toBe("has_location");
    expect(camelToSnakeCase("optionCount")).toBe("option_count");
    expect(camelToSnakeCase("participantId")).toBe("participant_id");
  });

  it("should handle single words", () => {
    expect(camelToSnakeCase("name")).toBe("name");
    expect(camelToSnakeCase("title")).toBe("title");
  });

  it("should handle multiple capital letters", () => {
    expect(camelToSnakeCase("XMLHttpRequest")).toBe("_x_m_l_http_request");
    expect(camelToSnakeCase("HTMLElement")).toBe("_h_t_m_l_element");
  });

  it("should handle empty string", () => {
    expect(camelToSnakeCase("")).toBe("");
  });
});

describe("convertKeysToSnakeCase", () => {
  it("should convert object keys from camelCase to snake_case", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      hasLocation: true,
      optionCount: 5,
    };

    const expected = {
      first_name: "John",
      last_name: "Doe",
      has_location: true,
      option_count: 5,
    };

    expect(convertKeysToSnakeCase(input)).toEqual(expected);
  });

  it("should handle nested values without converting them", () => {
    const input = {
      userInfo: {
        firstName: "John", // This nested object won't be converted
      },
      hasLocation: true,
    };

    const expected = {
      user_info: {
        firstName: "John", // Nested objects are not recursively converted
      },
      has_location: true,
    };

    expect(convertKeysToSnakeCase(input)).toEqual(expected);
  });

  it("should handle empty object", () => {
    expect(convertKeysToSnakeCase({})).toEqual({});
  });

  it("should handle various value types", () => {
    const input = {
      stringValue: "test",
      numberValue: 42,
      booleanValue: true,
      nullValue: null,
      undefinedValue: undefined,
      arrayValue: [1, 2, 3],
    };

    const expected = {
      string_value: "test",
      number_value: 42,
      boolean_value: true,
      null_value: null,
      undefined_value: undefined,
      array_value: [1, 2, 3],
    };

    expect(convertKeysToSnakeCase(input)).toEqual(expected);
  });
});
