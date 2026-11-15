import { languages } from "@/i18n/settings";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

function parseAccept(accept: string) {
  return accept.split(",").map((range) => {
    const [type = "", ...params] = range.split(";").map((part) => part.trim());
    const q = params.find((param) => param.toLowerCase().startsWith("q="));
    const quality = q ? Number(q.slice(2)) : 1;
    return {
      type: type.toLowerCase(),
      quality: Number.isFinite(quality) ? quality : 0,
    };
  });
}

// RFC 9110: a media type takes its quality from the most specific range that
// matches it, so text/* and */* also rank text/html.
function htmlQuality(ranges: ReturnType<typeof parseAccept>) {
  for (const type of ["text/html", "text/*", "*/*"]) {
    const matches = ranges.filter((range) => range.type === type);
    if (matches.length > 0) {
      return Math.max(...matches.map((range) => range.quality));
    }
  }
  return 0;
}

// Browsers never list text/markdown, so an explicit ask for it at least as
// strong as text/html comes from an agent. Wildcards alone never select
// Markdown.
export function prefersMarkdown(accept: string | null) {
  if (!accept) return false;
  const ranges = parseAccept(accept);
  const markdown = Math.max(
    0,
    ...ranges
      .filter((range) => range.type === "text/markdown")
      .map((range) => range.quality),
  );
  return markdown > 0 && markdown >= htmlQuality(ranges);
}

export function isHomePath(pathname: string) {
  const path = pathname.replace(/\/+$/, "");
  return path === "" || languages.some((locale) => path === `/${locale}`);
}

export function notFoundMarkdown(baseUrl: string) {
  return `# Page not found

There is no page at this address on Rallly. It may have moved, or the link may be mistyped.

- [Home](${baseUrl}/): what Rallly is, in Markdown
- [llms.txt](${baseUrl}/llms.txt): summary for agents, including when to use Rallly
- [Sitemap](${baseUrl}/sitemap.xml): every public page
- [Docs and API reference](https://support.rallly.co)
`;
}
