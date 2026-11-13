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

type Scope = { tags: Map<string, number>; branches: Branch[] };

type Branch = {
  name: string;
  kind: "plural" | "select";
  offset: number;
  options: Map<string, Scope>;
};

const inspect = (elements: MessageFormatElement[]) => {
  const args = new Set<string>();
  const branching = new Map<string, Branch["kind"]>();

  const scopeOf = (elements: MessageFormatElement[]) => {
    const scope: Scope = { tags: new Map(), branches: [] };
    const countTag = (name: string) =>
      scope.tags.set(name, (scope.tags.get(name) ?? 0) + 1);

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
            if (!branching.has(node.value)) {
              branching.set(
                node.value,
                node.type === TYPE.plural ? "plural" : "select",
              );
            }
            scope.branches.push({
              name: node.value,
              kind: node.type === TYPE.plural ? "plural" : "select",
              offset: node.type === TYPE.plural ? node.offset : 0,
              options: new Map(
                Object.entries(node.options).map(([key, option]) => [
                  key,
                  scopeOf(option.value),
                ]),
              ),
            });
            break;
          case TYPE.tag:
            countTag(node.value);
            walk(node.children);
            break;
        }
      }
    };

    walk(elements);
    return scope;
  };

  return { args, branching, root: scopeOf(elements) };
};

const describeTag = (name: string) =>
  name.endsWith("/")
    ? `<${displayTag(name.slice(0, -1))}/>`
    : `<${displayTag(name)}>`;

const inline = ({
  scope,
  branch,
  option,
}: {
  scope: Scope;
  branch: Branch;
  option: Scope;
}) => {
  const tags = new Map(scope.tags);
  for (const [name, count] of option.tags) {
    tags.set(name, (tags.get(name) ?? 0) + count);
  }
  const index = scope.branches.indexOf(branch);
  return {
    tags,
    branches: [
      ...scope.branches.slice(0, index),
      ...option.branches,
      ...scope.branches.slice(index + 1),
    ],
  };
};

const branchNames = (scope: Scope): Set<string> =>
  new Set(
    scope.branches.flatMap((branch) => [
      branch.name,
      ...[...branch.options.values()].flatMap((option) => [
        ...branchNames(option),
      ]),
    ]),
  );

const compareScopes = ({
  expected,
  actual,
  reasons,
  hint,
}: {
  expected: Scope;
  actual: Scope;
  reasons: Set<string>;
  hint: string;
}) => {
  const paired = new Set<Branch>();
  const pairs: [Branch, Branch][] = [];
  const unmatched: Branch[] = [];
  for (const branch of expected.branches) {
    const match = actual.branches.find(
      (candidate) => candidate.name === branch.name && !paired.has(candidate),
    );
    if (match) {
      paired.add(match);
      pairs.push([branch, match]);
    } else {
      unmatched.push(branch);
    }
  }

  const actualUnmatched = actual.branches.filter(
    (branch) => !paired.has(branch),
  );
  const expectedNames = branchNames(expected);
  const actualNames = branchNames(actual);
  const actualAdded = actualUnmatched.find(
    (branch) => !expectedNames.has(branch.name),
  );
  const expectedAdded = unmatched.find(
    (branch) => !actualNames.has(branch.name),
  );
  const expectedOnly = actualAdded
    ? undefined
    : (expectedAdded ?? unmatched[0]);
  if (expectedOnly) {
    for (const option of expectedOnly.options.values()) {
      compareScopes({
        expected: inline({ scope: expected, branch: expectedOnly, option }),
        actual,
        reasons,
        hint,
      });
    }
    return;
  }
  const actualOnly = actualAdded ?? actualUnmatched[0];
  if (actualOnly) {
    for (const option of actualOnly.options.values()) {
      compareScopes({
        expected,
        actual: inline({ scope: actual, branch: actualOnly, option }),
        reasons,
        hint,
      });
    }
    return;
  }

  for (const [name, count] of expected.tags) {
    const found = actual.tags.get(name) ?? 0;
    if (found < count) {
      reasons.add(
        `tag ${describeTag(name)} appears ${found} time(s) in the translation but ${count} in the source; keep every tag and do not rename it${hint}`,
      );
    }
  }
  for (const [name, count] of actual.tags) {
    const wanted = expected.tags.get(name) ?? 0;
    if (count > wanted) {
      reasons.add(
        `tag ${describeTag(name)} appears ${count} time(s) in the translation but ${wanted} in the source; do not add or rename tags${hint}`,
      );
    }
  }

  for (const [wanted, found] of pairs) {
    compareBranches({ wanted, found, reasons, hint });
  }
};

const compareBranches = ({
  wanted,
  found,
  reasons,
  hint,
}: {
  wanted: Branch;
  found: Branch;
  reasons: Set<string>;
  hint: string;
}) => {
  const { name } = wanted;
  if (found.kind !== wanted.kind) {
    reasons.add(
      `{${name}} must be a ${wanted.kind} argument like in the source, but it is a ${found.kind}`,
    );
    return;
  }
  if (found.offset !== wanted.offset) {
    reasons.add(
      `the plural for {${name}} has offset:${found.offset} but the source has offset:${wanted.offset}; keep the offset exactly as in the source`,
    );
  }
  if (wanted.kind === "select") {
    for (const key of wanted.options.keys()) {
      if (!found.options.has(key)) {
        reasons.add(
          `the select for {${name}} is missing the case "${key}"; select case names are identifiers and must stay exactly as in the source (do not translate them)`,
        );
      }
    }
    for (const [key, scope] of found.options) {
      const source = wanted.options.get(key);
      if (!source) {
        reasons.add(
          `the select for {${name}} has the case "${key}" which does not exist in the source; select case names must not be translated or added`,
        );
        continue;
      }
      compareScopes({ expected: source, actual: scope, reasons, hint });
    }
    return;
  }
  for (const key of wanted.options.keys()) {
    if (key.startsWith("=") && !found.options.has(key)) {
      reasons.add(
        `the plural for {${name}} is missing the case "${key}"; exact number cases like "${key}" must be kept from the source`,
      );
    }
  }
  for (const [key, scope] of found.options) {
    const source = wanted.options.get(key) ?? wanted.options.get("other");
    if (source) {
      compareScopes({ expected: source, actual: scope, reasons, hint });
    }
  }
};

const reservedTag = /<\/?num-\d+/;

export const validateTranslation = ({
  source,
  translation,
}: {
  source: string;
  translation: string;
}) => {
  if (translation.trim() === "") {
    return ["the translation is empty"];
  }
  if (translation.includes(untranslatedPlaceholder)) {
    return [
      `the translation contains the placeholder ${untranslatedPlaceholder}; translate the string`,
    ];
  }

  if (reservedTag.test(source)) {
    return [
      "the source uses a tag named num-<digits>, which is reserved by the validator; it cannot be validated",
    ];
  }
  if (reservedTag.test(translation)) {
    return [
      "the translation uses a tag named num-<digits>, which does not exist in the source; keep the tag names exactly as in the source",
    ];
  }

  const parsedSource = tryParse(source);
  if (!parsedSource.ast) return [];

  const parsedTranslation = tryParse(translation);
  if (!parsedTranslation.ast) {
    if (parsedTranslation.error === "MISSING_OTHER_CLAUSE") {
      const names = [...inspect(parsedSource.ast).branching.keys()];
      return [
        `a plural or select in the translation has no "other" case; every plural and select must end with an other {...} case${names.length ? ` (source arguments: ${names.map((n) => `{${n}}`).join(", ")})` : ""}`,
      ];
    }
    return [
      `the translation is not valid ICU MessageFormat (${parsedTranslation.error}); check for unbalanced braces, stray "},{" fragments, mismatched tags, and apostrophes before "{" which start quoted text`,
    ];
  }

  const reasons = new Set<string>();
  const hint = translation.includes("'")
    ? " (an apostrophe directly before { or < starts quoted text and turns the argument or tag into literal text; write '' for a literal apostrophe)"
    : "";
  const expected = inspect(parsedSource.ast);
  const actual = inspect(parsedTranslation.ast);

  for (const name of expected.args) {
    if (!actual.args.has(name)) {
      const argumentHint = translation.includes("'")
        ? " (an apostrophe directly before { starts quoted text and turns the argument into literal text; use '' for a literal apostrophe)"
        : "";
      reasons.add(
        `argument {${name}} is missing from the translation${argumentHint}`,
      );
    }
  }
  for (const name of actual.args) {
    if (!expected.args.has(name)) {
      reasons.add(
        `argument {${name}} does not exist in the source; argument names must not be translated or renamed`,
      );
    }
  }

  for (const [name, kind] of expected.branching) {
    if (!actual.branching.has(name) && actual.args.has(name)) {
      reasons.add(
        `{${name}} must be a ${kind} argument like in the source, not a simple argument`,
      );
    }
  }

  compareScopes({
    expected: expected.root,
    actual: actual.root,
    reasons,
    hint,
  });

  return [...reasons];
};
