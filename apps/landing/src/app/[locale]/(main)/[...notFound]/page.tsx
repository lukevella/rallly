import { notFound } from "next/navigation";

// ensureStatic = "navigation" requires one complete param set to prerender.
export async function generateStaticParams() {
  return [{ notFound: ["404"] }];
}

export default function CatchAllPage() {
  notFound();
}
