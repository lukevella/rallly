import { llmsTxt } from "@/lib/llms-txt";
import { MARKDOWN_CONTENT_TYPE } from "@/lib/markdown-negotiation";

// The proxy rewrites the homepage here when a client asks for Markdown.
export function GET() {
  return new Response(llmsTxt, {
    headers: { "Content-Type": MARKDOWN_CONTENT_TYPE, Vary: "Accept" },
  });
}
