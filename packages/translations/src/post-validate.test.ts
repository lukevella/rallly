import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validatePost } from "./post-validate.ts";

const postsDir = join(import.meta.dirname, "../../../apps/landing/src/posts");

const source = `---
title: Plan better
date: 2026-01-02
category: guides
excerpt: How to plan.
---

## A heading

- one
- two

Visit [pricing](https://rallly.co/pricing) now.

![alt text](/images/a.png)

\`\`\`js
const a = 1;
\`\`\`

Use \`inline\` here.

<PostFaq>
  <FaqItem question="Q?">A</FaqItem>
</PostFaq>
`;

const german = `---
title: Besser planen
date: 2026-01-02
category: guides
excerpt: Wie man plant.
---

## Eine Überschrift

- eins
- zwei

Besuche [Preise](https://rallly.co/pricing) jetzt.

![Alt-Text](/images/a.png)

\`\`\`js
const a = 1;
\`\`\`

Nutze \`inline\` hier.

<PostFaq>
  <FaqItem question="F?">A</FaqItem>
</PostFaq>
`;

const v = (translation: string) => validatePost({ source, translation });
const swap = (from: string, to: string) => german.replace(from, to);

describe("validatePost", () => {
  it("accepts a faithful translation", () => expect(v(german)).toEqual([]));

  it("rejects a changed link URL", () =>
    expect(
      v(swap("https://rallly.co/pricing", "https://rallly.co/x")).join(),
    ).toContain("https://rallly.co/pricing"));

  it("rejects a missing heading", () =>
    expect(v(swap("## Eine Überschrift\n", "")).join()).toContain(
      "heading depth 2",
    ));

  it("rejects a missing list item", () =>
    expect(v(swap("- zwei\n", "")).length).toBeGreaterThan(0));

  it("rejects altered code block", () =>
    expect(v(swap("const a = 1;", "const a = 2;")).length).toBeGreaterThan(0));

  it("rejects altered inline code", () =>
    expect(v(swap("`inline`", "`inlin`")).length).toBeGreaterThan(0));

  it("rejects a renamed component", () =>
    expect(
      v(
        swap(
          '<FaqItem question="F?">A</FaqItem>',
          '<FaqEntry question="F?">A</FaqEntry>',
        ),
      ).join(),
    ).toContain("component names differ"));

  it("rejects a dropped component", () =>
    expect(
      v(swap('  <FaqItem question="F?">A</FaqItem>\n', "")).length,
    ).toBeGreaterThan(0));

  it("allows a translated question attribute", () =>
    expect(v(swap('question="F?"', 'question="Eine andere Frage?"'))).toEqual(
      [],
    ));

  it("rejects a changed date", () =>
    expect(v(swap("2026-01-02", "2026-01-03")).join()).toContain(
      'frontmatter "date"',
    ));

  it("rejects a translated category", () =>
    expect(
      v(swap("category: guides", "category: Anleitungen")).length,
    ).toBeGreaterThan(0));

  it("rejects a missing title", () =>
    expect(v(swap("title: Besser planen\n", "")).length).toBeGreaterThan(0));

  it("rejects a translation that is not valid MDX", () => {
    const reasons = v(
      swap('<FaqItem question="F?">A</FaqItem>', '<FaqItem question="x">A'),
    );
    expect(reasons[0]).toMatch(/^body is not valid MDX/);
  });

  it("rejects a body that carries its own frontmatter", () =>
    expect(
      v(
        german.replace("\n\n## Eine", "\n\n---\ntitle: x\n---\n\n## Eine"),
      ).join(),
    ).toContain("body must not start with frontmatter fences"));

  it("rejects a translation whose frontmatter is not valid YAML", () =>
    expect(v(swap("title: Besser planen", "title: [unclosed"))[0]).toMatch(
      /^frontmatter is not valid YAML/,
    ));

  it("rejects a translation that adds an expression in prose", () =>
    expect(v(swap("Besuche", "Besuche {1+1}")).join()).toContain(
      "expressions differ",
    ));

  it("rejects a translation that drops an expression", () => {
    const withExpression = source.replace("Visit", "Visit {1+1}");
    const translated = german.replace("Besuche", "Besuche {1+1}");
    expect(
      validatePost({ source: withExpression, translation: translated }),
    ).toEqual([]);
    expect(
      validatePost({ source: withExpression, translation: german }).join(),
    ).toContain("expressions differ");
  });

  it("accepts every committed English post against itself", () => {
    const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(join(postsDir, file), "utf8");
      expect({
        file,
        reasons: validatePost({ source: text, translation: text }),
      }).toEqual({
        file,
        reasons: [],
      });
    }
  });
});
