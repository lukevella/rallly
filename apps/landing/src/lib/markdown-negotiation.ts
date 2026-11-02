import { languages } from "@/i18n/settings";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

function mediaTypeQuality(accept: string, mediaType: string) {
  let quality = 0;
  for (const range of accept.split(",")) {
    const [type = "", ...params] = range.split(";").map((part) => part.trim());
    if (type.toLowerCase() !== mediaType) continue;
    const q = params.find((param) => param.startsWith("q="));
    const value = q ? Number(q.slice(2)) : 1;
    if (Number.isFinite(value)) quality = Math.max(quality, value);
  }
  return quality;
}

// Browsers never list text/markdown, so an explicit ask for it at least as
// strong as text/html comes from an agent.
export function prefersMarkdown(accept: string | null) {
  if (!accept) return false;
  const markdown = mediaTypeQuality(accept, "text/markdown");
  return markdown > 0 && markdown >= mediaTypeQuality(accept, "text/html");
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
