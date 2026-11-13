import type { MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import { parse, TYPE } from "@formatjs/icu-messageformat-parser";

export const untranslatedPlaceholder = "__STRING_NOT_TRANSLATED__";

const numericTagPrefix = "num-";

const toParsable = (message: string) =>
  message.replace(/<(\/?)(\d+)(\s*\/?)>/g, `<$1${numericTagPrefix}$2$3>`);

const displayTag = (name: string) =>
  name.startsWith(numericTagPrefix)
    ? name.slice(numericTagPrefix.length)
    : name;

const tryParse = (message: string) => {
  try {
    return { ast: parse(toParsable(message)) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

type Branching = { kind: "plural" | "select"; hasOther: boolean };

const inspect = (elements: MessageFormatElement[]) => {
  const args = new Set<string>();
  const branching = new Map<string, Branching>();
  const tags = new Map<string, number>();
  const countTag = (name: string) => tags.set(name, (tags.get(name) ?? 0) + 1);

  const walk = (nodes: MessageFormatElement[]) => {
    for (const node of nodes) {
      switch (node.type) {
        case TYPE.literal:
          for (const match of node.value.matchAll(/<([\w-]+)\s*\/>/g)) {
            countTag(`${match[1]}/`);
          }
          break;
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          args.add(node.value);
          break;
        case TYPE.select:
        case TYPE.plural:
          args.add(node.value);
          branching.set(node.value, {
            kind: node.type === TYPE.plural ? "plural" : "select",
            hasOther: "other" in node.options,
          });
          for (const option of Object.values(node.options)) {
            walk(option.value);
          }
          break;
        case TYPE.tag:
          countTag(node.value);
          walk(node.children);
          break;
      }
    }
  };

  walk(elements);
  return { args, branching, tags };
};

const describeTag = (name: string) =>
  name.endsWith("/")
    ? `<${displayTag(name.slice(0, -1))}/>`
    : `<${displayTag(name)}>`;

export const validateTranslation = ({
  source,
  translation,
}: {
  source: string;
  translation: string;
}) => {
  const reasons: string[] = [];

  if (translation.trim() === "") {
    return ["the translation is empty"];
  }
  if (translation.includes(untranslatedPlaceholder)) {
    return [
      `the translation contains the placeholder ${untranslatedPlaceholder}; translate the string`,
    ];
  }

  const parsedSource = tryParse(source);
  if (!parsedSource.ast) return [];

  const parsedTranslation = tryParse(translation);
  if (!parsedTranslation.ast) {
    return [
      `the translation is not valid ICU MessageFormat (${parsedTranslation.error}); check for unbalanced braces, stray "},{" fragments, mismatched tags, and apostrophes before "{" which start quoted text`,
    ];
  }

  const expected = inspect(parsedSource.ast);
  const actual = inspect(parsedTranslation.ast);

  for (const name of expected.args) {
    if (!actual.args.has(name)) {
      const hint = translation.includes("'")
        ? " (an apostrophe directly before { starts quoted text and turns the argument into literal text; use '' for a literal apostrophe)"
        : "";
      reasons.push(`argument {${name}} is missing from the translation${hint}`);
    }
  }
  for (const name of actual.args) {
    if (!expected.args.has(name)) {
      reasons.push(
        `argument {${name}} does not exist in the source; argument names must not be translated or renamed`,
      );
    }
  }

  for (const [name, wanted] of expected.branching) {
    const found = actual.branching.get(name);
    if (!found) {
      if (actual.args.has(name)) {
        reasons.push(
          `{${name}} must be a ${wanted.kind} argument like in the source, not a simple argument`,
        );
      }
      continue;
    }
    if (found.kind !== wanted.kind) {
      reasons.push(
        `{${name}} must be a ${wanted.kind} argument like in the source, but it is a ${found.kind}`,
      );
    }
    if (!found.hasOther) {
      reasons.push(
        `the ${found.kind} for {${name}} must include an "other" case`,
      );
    }
  }

  for (const [name, count] of expected.tags) {
    const found = actual.tags.get(name) ?? 0;
    if (found < count) {
      reasons.push(
        `tag ${describeTag(name)} appears ${found} time(s) in the translation but ${count} in the source; keep every tag and do not rename it`,
      );
    }
  }
  for (const [name, count] of actual.tags) {
    const wanted = expected.tags.get(name) ?? 0;
    if (count > wanted) {
      reasons.push(
        `tag ${describeTag(name)} appears ${count} time(s) in the translation but ${wanted} in the source; do not add or rename tags`,
      );
    }
  }

  return reasons;
};
