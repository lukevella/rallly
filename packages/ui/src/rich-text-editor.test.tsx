import { render } from "@testing-library/react";
import { Link } from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";
import { Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { MarkdownDescription } from "./markdown-description";

// Mirrors the extension set in rich-text-editor.tsx so this test exercises the
// exact serializer the editor ships. Kept in sync by hand — the component's
// list is the source of truth.
function makeEditor(content: string, contentType: "html" | "markdown") {
  return new Editor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        strike: false,
        horizontalRule: false,
        underline: false,
        link: false,
      }),
      Markdown,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["mailto"],
      }),
    ],
    content,
    contentType,
  });
}

function htmlToMarkdown(html: string) {
  const editor = makeEditor(html, "html");
  const md = editor.getMarkdown();
  editor.destroy();
  return md;
}

function roundTrip(markdown: string) {
  const editor = makeEditor(markdown, "markdown");
  const md = editor.getMarkdown();
  editor.destroy();
  return md;
}

describe("RichTextEditor markdown serialization", () => {
  it("serializes the allowed formatting subset to markdown", () => {
    const md = htmlToMarkdown(
      "<p><strong>bold</strong> and <em>italic</em></p>" +
        "<ul><li><p>one</p></li><li><p>two</p></li></ul>" +
        "<ol><li><p>first</p></li><li><p>second</p></li></ol>" +
        '<p><a href="https://example.com">link</a></p>',
    );
    expect(md).toContain("**bold**");
    expect(md).toContain("*italic*");
    expect(md).toContain("- one");
    expect(md).toContain("- two");
    expect(md).toContain("1. first");
    expect(md).toContain("2. second");
    expect(md).toContain("[link](https://example.com)");
  });

  it("round-trips formatted markdown (parse -> serialize)", () => {
    const source =
      "**bold** and *italic*\n\n- one\n- two\n\n1. first\n2. second";
    expect(roundTrip(source).trim()).toBe(source);
  });

  it("keeps plain text (existing descriptions) intact", () => {
    const source = "Just a regular description with no formatting.";
    expect(roundTrip(source).trim()).toBe(source);
  });

  it("emits markdown the MarkdownDescription renderer displays as intended", () => {
    // Closes the loop: whatever the editor produces must render as the intended
    // tags when shown on the poll/event page.
    const md = htmlToMarkdown(
      "<p>Meet at <strong>noon</strong></p><ul><li><p>bring ID</p></li></ul>",
    );
    const { container } = render(<MarkdownDescription content={md} />);
    expect(container.querySelector("strong")?.textContent).toBe("noon");
    expect(container.querySelector("ul")).not.toBeNull();
    expect(container.querySelector("li")?.textContent).toContain("bring ID");
  });
});
