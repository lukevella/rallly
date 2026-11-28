import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@rallly/ui/code-block";
import { highlightCode } from "@rallly/ui/lib/highlighter";
import React from "react";

const shellLanguages = new Set(["sh", "bash", "shell", "shellscript", "zsh"]);

function getCode(children: React.ReactNode) {
  if (
    !React.isValidElement<React.ComponentProps<"code">>(children) ||
    children.type !== "code"
  ) {
    return null;
  }
  const { className, children: text } = children.props;
  if (typeof text !== "string") {
    return null;
  }
  const language = className?.match(/language-(\S+)/)?.[1] ?? null;
  return { code: text.replace(/\n$/, ""), language };
}

export async function PostCodeBlock({
  children,
  ...props
}: React.ComponentProps<"pre">) {
  const parsed = getCode(children);
  if (!parsed) {
    return <pre {...props}>{children}</pre>;
  }

  const { code, language } = parsed;
  const lines = language ? await highlightCode(code, language) : null;
  const title =
    language && shellLanguages.has(language.toLowerCase()) ? "Terminal" : null;
  const copyButton = <CodeBlockCopyButton value={code} />;

  return (
    <CodeBlock className="my-6 bg-white">
      {title ? (
        <CodeBlockHeader>
          <CodeBlockTitle>{title}</CodeBlockTitle>
          <CodeBlockActions>{copyButton}</CodeBlockActions>
        </CodeBlockHeader>
      ) : (
        <CodeBlockActions>{copyButton}</CodeBlockActions>
      )}
      <CodeBlockContent>
        {lines
          ? lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are static and positional
              <CodeBlockLine key={index}>{line}</CodeBlockLine>
            ))
          : code}
      </CodeBlockContent>
    </CodeBlock>
  );
}
