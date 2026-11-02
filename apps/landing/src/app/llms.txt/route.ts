import { llmsTxt } from "@/lib/llms-txt";

export function GET() {
  return new Response(llmsTxt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
