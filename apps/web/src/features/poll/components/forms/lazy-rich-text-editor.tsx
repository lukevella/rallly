"use client";

import type { RichTextEditor as RichTextEditorType } from "@rallly/ui/rich-text-editor";
import dynamic from "next/dynamic";

export const LazyRichTextEditor = dynamic(
  () => import("@rallly/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-32 w-full rounded-lg border border-input bg-transparent shadow-xs" />
    ),
  },
) as typeof RichTextEditorType;
