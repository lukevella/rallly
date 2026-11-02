import { describe, expect, it } from "vitest";
import { llmsTxt } from "@/lib/llms-txt";
import { MARKDOWN_CONTENT_TYPE } from "@/lib/markdown-negotiation";
import { GET } from "./route";

describe("GET /index.md", () => {
  it("serves the site summary as Markdown that varies on Accept", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    expect(response.headers.get("vary")).toBe("Accept");
    expect(await response.text()).toBe(llmsTxt);
  });
});
