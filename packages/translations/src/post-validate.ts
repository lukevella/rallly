import { isDeepStrictEqual } from "node:util";
import matter from "gray-matter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

type Node = {
  type: string;
  depth?: number;
  url?: string;
  value?: string;
  name?: string | null;
  attributes?: {
    type: string;
    name?: string;
    value?: string | { value?: string } | null;
  }[];
  children?: Node[];
};

const parser = unified().use(remarkParse).use(remarkMdx);

const translatedFields = ["title", "excerpt"];
const translatedAttributes = ["question"];

function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function collect(body: string) {
  const tree = parser.parse(body) as Node;
  const headings = new Map<number, number>();
  const elements: { name: string; attributes: Map<string, string> }[] = [];
  const links: string[] = [];
  const images: string[] = [];
  const code: string[] = [];
  const inlineCode: string[] = [];
  const expressions: string[] = [];
  let listItems = 0;

  walk(tree, (node) => {
    switch (node.type) {
      case "heading":
        headings.set(node.depth ?? 0, (headings.get(node.depth ?? 0) ?? 0) + 1);
        break;
      case "listItem":
        listItems++;
        break;
      case "link":
        links.push(node.url ?? "");
        break;
      case "image":
        images.push(node.url ?? "");
        break;
      case "code":
        code.push(node.value ?? "");
        break;
      case "inlineCode":
        inlineCode.push(node.value ?? "");
        break;
      case "mdxFlowExpression":
      case "mdxTextExpression":
      case "mdxjsEsm":
        expressions.push(`${node.type}:${node.value ?? ""}`);
        break;
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement": {
        const attributes = new Map<string, string>();
        for (const attribute of node.attributes ?? []) {
          const raw = attribute.value;
          const value = typeof raw === "string" ? raw : (raw?.value ?? null);
          attributes.set(
            attribute.name ?? `{${String(value)}}`,
            JSON.stringify(value),
          );
        }
        elements.push({ name: node.name ?? "", attributes });
        break;
      }
    }
  });

  return {
    headings,
    listItems,
    links,
    images,
    code,
    inlineCode,
    expressions,
    elements,
  };
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sorted = (values: string[]) => [...values].sort();

function compareMultiset({
  label,
  source,
  translation,
}: {
  label: string;
  source: string[];
  translation: string[];
}) {
  if (isDeepStrictEqual(sorted(source), sorted(translation))) return [];
  return [
    `${label} differ: expected ${JSON.stringify(sorted(source))}, got ${JSON.stringify(sorted(translation))}`,
  ];
}

function frontmatterReasons({
  source,
  translation,
}: {
  source: Record<string, unknown>;
  translation: Record<string, unknown>;
}) {
  const reasons: string[] = [];
  const sourceKeys = Object.keys(source).sort();
  const translationKeys = Object.keys(translation).sort();
  if (!isDeepStrictEqual(sourceKeys, translationKeys)) {
    reasons.push(
      `frontmatter keys differ: expected [${sourceKeys.join(", ")}], got [${translationKeys.join(", ")}]`,
    );
  }
  for (const key of sourceKeys) {
    if (translatedFields.includes(key)) {
      const value = translation[key];
      if (typeof value !== "string" || value.trim() === "") {
        reasons.push(`frontmatter "${key}" must be a non-empty string`);
      }
    } else if (
      key in translation &&
      !isDeepStrictEqual(source[key], translation[key])
    ) {
      reasons.push(
        `frontmatter "${key}" must stay ${JSON.stringify(source[key])}, got ${JSON.stringify(translation[key])}`,
      );
    }
  }
  return reasons;
}

export function validatePost({
  source,
  translation,
}: {
  source: string;
  translation: string;
}) {
  let sourceFile: matter.GrayMatterFile<string>;
  let translationFile: matter.GrayMatterFile<string>;
  try {
    sourceFile = matter(source);
  } catch (error) {
    return [`source frontmatter is not valid YAML: ${messageOf(error)}`];
  }
  try {
    translationFile = matter(translation);
  } catch (error) {
    return [`frontmatter is not valid YAML: ${messageOf(error)}`];
  }
  const reasons = frontmatterReasons({
    source: sourceFile.data,
    translation: translationFile.data,
  });

  const translationBody = translationFile.content;
  if (translationBody.trimStart().startsWith("---")) {
    reasons.push("body must not start with frontmatter fences (---)");
    return reasons;
  }

  let expected: ReturnType<typeof collect>;
  let actual: ReturnType<typeof collect>;
  try {
    expected = collect(sourceFile.content);
  } catch (error) {
    reasons.push(
      `source body is not valid MDX: ${error instanceof Error ? error.message : String(error)}`,
    );
    return reasons;
  }
  try {
    actual = collect(translationBody);
  } catch (error) {
    reasons.push(
      `body is not valid MDX: ${error instanceof Error ? error.message : String(error)}`,
    );
    return reasons;
  }

  const depths = new Set([
    ...expected.headings.keys(),
    ...actual.headings.keys(),
  ]);
  for (const depth of [...depths].sort()) {
    const want = expected.headings.get(depth) ?? 0;
    const got = actual.headings.get(depth) ?? 0;
    if (want !== got) {
      reasons.push(
        `heading depth ${depth} count differs: expected ${want}, got ${got}`,
      );
    }
  }
  if (expected.listItems !== actual.listItems) {
    reasons.push(
      `list item count differs: expected ${expected.listItems}, got ${actual.listItems}`,
    );
  }

  reasons.push(
    ...compareMultiset({
      label: "link URLs",
      source: expected.links,
      translation: actual.links,
    }),
    ...compareMultiset({
      label: "image URLs",
      source: expected.images,
      translation: actual.images,
    }),
    ...compareMultiset({
      label: "code blocks",
      source: expected.code,
      translation: actual.code,
    }),
    ...compareMultiset({
      label: "inline code",
      source: expected.inlineCode,
      translation: actual.inlineCode,
    }),
    ...compareMultiset({
      label: "expressions",
      source: expected.expressions,
      translation: actual.expressions,
    }),
  );

  const names = (elements: typeof expected.elements) =>
    elements.map((e) => e.name);
  if (!isDeepStrictEqual(names(expected.elements), names(actual.elements))) {
    reasons.push(
      `component names differ: expected [${names(expected.elements).join(", ")}], got [${names(actual.elements).join(", ")}]`,
    );
  } else {
    expected.elements.forEach((element, index) => {
      const other = actual.elements[index];
      if (!other) return;
      const want = [...element.attributes.keys()].sort();
      const got = [...other.attributes.keys()].sort();
      if (!isDeepStrictEqual(want, got)) {
        reasons.push(
          `<${element.name}> attributes differ: expected [${want.join(", ")}], got [${got.join(", ")}]`,
        );
        return;
      }
      for (const [name, value] of element.attributes) {
        if (translatedAttributes.includes(name)) continue;
        if (value !== other.attributes.get(name)) {
          reasons.push(
            `<${element.name}> attribute "${name}" must stay ${value}, got ${other.attributes.get(name)}`,
          );
        }
      }
    });
  }

  return reasons;
}
