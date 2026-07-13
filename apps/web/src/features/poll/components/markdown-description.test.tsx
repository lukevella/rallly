import { MarkdownDescription } from "@rallly/ui/markdown-description";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function renderMarkdown(content: string) {
  const { container } = render(<MarkdownDescription content={content} />);
  return container;
}

describe("MarkdownDescription", () => {
  describe("allowed formatting", () => {
    it("renders bold, italic and lists", () => {
      const html = renderMarkdown(
        "**bold** and *italic*\n\n- one\n- two\n\n1. first\n2. second",
      ).innerHTML;
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
      expect(html).toContain("<ul>");
      expect(html).toContain("<ol>");
      expect(html.match(/<li>/g)).toHaveLength(4);
    });

    it("renders markdown links with safe rel/target", () => {
      const container = renderMarkdown("[example](https://example.com)");
      const anchor = container.querySelector("a");
      expect(anchor).not.toBeNull();
      expect(anchor?.getAttribute("href")).toBe("https://example.com");
      expect(anchor?.getAttribute("target")).toBe("_blank");
      expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("autolinks bare URLs", () => {
      const anchor = renderMarkdown(
        "see https://example.com for more",
      ).querySelector("a");
      expect(anchor?.getAttribute("href")).toBe("https://example.com");
    });

    it("preserves single line breaks", () => {
      expect(renderMarkdown("line one\nline two").innerHTML).toContain("<br>");
    });
  });

  describe("XSS defense", () => {
    it("never emits an executable script element", () => {
      const container = renderMarkdown(
        "hello <script>alert('xss')</script> world",
      );
      // The payload may survive as inert text, but must never become a real
      // <script> node that the browser would execute.
      expect(container.querySelector("script")).toBeNull();
      expect(container.innerHTML).not.toContain("<script");
    });

    it("strips inline event handlers and raw html", () => {
      const container = renderMarkdown('<img src=x onerror="alert(1)">');
      expect(container.querySelector("img")).toBeNull();
      expect(container.innerHTML).not.toContain("onerror");
    });

    it("strips javascript: protocol links", () => {
      const anchor = renderMarkdown(
        "[click](javascript:alert(1))",
      ).querySelector("a");
      // Either the anchor is dropped or its href is neutralised — never javascript:.
      expect(anchor?.getAttribute("href") ?? "").not.toContain("javascript:");
    });

    it("strips disallowed tags but keeps their text", () => {
      const container = renderMarkdown("# heading\n\n> quote\n\n`code`");
      expect(container.querySelector("h1")).toBeNull();
      expect(container.querySelector("blockquote")).toBeNull();
      expect(container.querySelector("code")).toBeNull();
      expect(container.textContent).toContain("heading");
      expect(container.textContent).toContain("quote");
      expect(container.textContent).toContain("code");
    });
  });
});
