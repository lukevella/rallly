import { describe, expect, it } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "./route";

describe("removed private API", () => {
  it.each([
    ["GET", GET],
    ["POST", POST],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ])("%s responds 410 with the migration guide", async (_method, handler) => {
    const res = handler();

    expect(res.status).toBe(410);
    expect(res.headers.get("Link")).toContain(
      "/api-reference/migrating-from-the-private-api",
    );
    const body = await res.json();
    expect(body.error.code).toBe("GONE");
    expect(body.error.message).toContain("https://api.rallly.co/v1");
  });
});
