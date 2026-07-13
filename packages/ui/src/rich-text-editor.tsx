"use client";

import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import {
  BoldIcon,
  ExternalLinkIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "./button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";
import { cn } from "./lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Exported so tests exercise the exact extension set — including the
// isAllowedUri link validation that is the editor's XSS guard.
export const baseExtensions = [
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
    isAllowedUri: (url, ctx) => {
      if (!ctx.defaultValidate(url)) return false;
      // Bare URLs (no scheme) autolink to defaultProtocol — allow them. Only
      // reject when an explicit scheme is present and not in our allowlist,
      // which keeps out javascript:/ftp:/tel: etc.
      const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
      return !scheme || ["http", "https", "mailto"].includes(scheme);
    },
  }),
];

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  id,
  maxLength,
  "aria-labelledby": ariaLabelledBy,
  labels,
}: {
  value?: string;
  onChange?: (markdown: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
  /** Character cap on the Markdown source. Shows a counter as the user nears
   * it and flags the count when exceeded. Advisory — enforcement is server-side. */
  maxLength?: number;
  "aria-labelledby"?: string;
  labels: {
    bold: string;
    italic: string;
    link: string;
    bulletList: string;
    numberedList: string;
    linkPlaceholder: string;
    linkApply: string;
    linkRemove: string;
    linkVisit: string;
  };
}) {
  const editor = useEditor({
    extensions: [
      ...baseExtensions,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value ?? "",
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: id ?? "",
        // Lets InputGroup's focus-within ring key off the editable element.
        "data-slot": "input-group-control",
        "aria-labelledby": ariaLabelledBy ?? "",
        class: cn(
          "min-h-24 w-full px-2.5 py-2 text-sm outline-none",
          "[&_a]:text-link [&_a]:underline",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_p]:leading-relaxed",
          "[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getMarkdown());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (value !== undefined && value !== editor.getMarkdown()) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <InputGroup className={cn("min-h-32 flex-col", className)}>
        <InputGroupAddon align="block-start" />
      </InputGroup>
    );
  }

  return (
    <InputGroup className={cn("flex-col items-stretch", className)}>
      <InputGroupAddon align="block-start">
        <Toolbar editor={editor} labels={labels} />
      </InputGroupAddon>
      <EditorContent editor={editor} />
      {maxLength ? (
        <InputGroupAddon align="block-end" className="justify-end">
          <CharacterCount editor={editor} maxLength={maxLength} />
        </InputGroupAddon>
      ) : null}
      <LinkBubbleMenu editor={editor} labels={labels} />
    </InputGroup>
  );
}

function CharacterCount({
  editor,
  maxLength,
}: {
  editor: TiptapEditor;
  maxLength: number;
}) {
  const { length } = useEditorState({
    editor,
    // Count the Markdown source — that's what the cap (and the iCal
    // DESCRIPTION) sees, so `**bold**` costs more than its rendered text.
    selector: (ctx) => ({ length: ctx.editor.getMarkdown().length }),
  });

  const over = length > maxLength;
  // Stay out of the way until the user is within ~15% of the cap.
  if (!over && length < maxLength * 0.85) {
    return null;
  }

  return (
    <span
      aria-live="polite"
      className={cn(
        "text-xs tabular-nums",
        over ? "font-medium text-destructive" : "text-muted-foreground",
      )}
    >
      {length}/{maxLength}
    </span>
  );
}

function LinkBubbleMenu({
  editor,
  labels,
}: {
  editor: TiptapEditor;
  labels: React.ComponentProps<typeof RichTextEditor>["labels"];
}) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      href: (ctx.editor.getAttributes("link").href as string | undefined) ?? "",
    }),
  });

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkBubbleMenu"
      // Show only when the caret sits inside a link — not while dragging a
      // selection across other text.
      shouldShow={({ editor }) => editor.isEditable && editor.isActive("link")}
      options={{ placement: "bottom", offset: 8 }}
    >
      {state.href ? (
        <a
          href={state.href}
          target="_blank"
          rel="noopener noreferrer"
          title={labels.linkVisit}
          className="flex max-w-80 items-center gap-2 rounded-lg border border-input bg-popover px-2.5 py-1.5 text-sm shadow-md"
        >
          <span className="truncate text-link underline">{state.href}</span>
          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </a>
      ) : null}
    </BubbleMenu>
  );
}

function Toolbar({
  editor,
  labels,
}: {
  editor: TiptapEditor;
  labels: React.ComponentProps<typeof RichTextEditor>["labels"];
}) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isLink: ctx.editor.isActive("link"),
      isBulletList: ctx.editor.isActive("bulletList"),
      isOrderedList: ctx.editor.isActive("orderedList"),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton
        label={labels.bold}
        active={state.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon />
      </ToolbarButton>
      <ToolbarButton
        label={labels.italic}
        active={state.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon />
      </ToolbarButton>
      <LinkButton editor={editor} active={state.isLink} labels={labels} />
      <ToolbarButton
        label={labels.bulletList}
        active={state.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon />
      </ToolbarButton>
      <ToolbarButton
        label={labels.numberedList}
        active={state.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <InputGroupButton
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      data-state={active ? "open" : undefined}
      onMouseDown={(e) => {
        // Keep editor selection while clicking the toolbar.
        e.preventDefault();
      }}
      onClick={onClick}
    >
      {children}
    </InputGroupButton>
  );
}

function LinkButton({
  editor,
  active,
  labels,
}: {
  editor: TiptapEditor;
  active?: boolean;
  labels: React.ComponentProps<typeof RichTextEditor>["labels"];
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const openPopover = () => {
    setUrl(editor.getAttributes("link").href ?? "");
    setOpen(true);
  };

  const apply = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }
    // setLink runs the link extension's isAllowedUri check and returns false for
    // rejected schemes (javascript:, data:, …). Keep the popover open on failure
    // so the typed value isn't silently lost.
    const ok = editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
    if (ok) {
      setOpen(false);
    }
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <InputGroupButton
            size="icon-sm"
            aria-label={labels.link}
            aria-pressed={active}
            title={labels.link}
            data-state={active ? "open" : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openPopover}
          >
            <LinkIcon />
          </InputGroupButton>
        }
      />
      <PopoverContent className="w-80 p-2" align="start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <InputGroup>
            {/* biome-ignore lint/a11y/noAutofocus: intentional focus when opening the link editor */}
            <InputGroupInput
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={labels.linkPlaceholder}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="sm">
                {labels.linkApply}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-muted-foreground"
            onClick={remove}
          >
            {labels.linkRemove}
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
