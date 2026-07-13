import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import Markdown from "react-markdown";
import type { Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import type { Plugin } from "unified";
import { cn } from "./lib/utils";

// Autolink bare URLs only — the one GFM behavior we want. Using the full
// remark-gfm would also parse tables, strikethrough, task lists and footnotes,
// which the sanitize schema below can't preserve: tables collapse to empty
// output and footnotes leave dangling anchors. So we wire up just the autolink
// extension instead.
const remarkAutolinkLiteral: Plugin = function () {
  // These data fields are declared by remark-parse's type augmentation, which
  // we don't depend on directly — hence the local shape.
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };
  data.micromarkExtensions ??= [];
  data.micromarkExtensions.push(gfmAutolinkLiteral());
  data.fromMarkdownExtensions ??= [];
  data.fromMarkdownExtensions.push(gfmAutolinkLiteralFromMarkdown());
};

// Locked-down allowlist: only the formatting the editor can produce.
// Deliberately built from scratch rather than extending rehype-sanitize's
// defaultSchema so nothing (task lists, footnotes, images, headings, raw
// classNames) is inherited. This is the primary XSS defense for descriptions,
// which accept arbitrary Markdown when POSTed directly.
const schema: SanitizeSchema = {
  tagNames: ["p", "strong", "em", "a", "ul", "ol", "li", "br"],
  attributes: {
    a: ["href"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
  },
  clobberPrefix: "md-",
  strip: ["script"],
};

export function MarkdownDescription({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2 text-pretty text-foreground text-sm leading-relaxed [&_a]:text-link [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkAutolinkLiteral, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
