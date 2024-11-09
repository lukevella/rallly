/** @return {import("eslint").Linter.Config} */
module.exports = function (workspaceDirPath) {
  return {
    root: true,
    extends: ["turbo"],
    plugins: [
      "eslint-plugin-import",
      "simple-import-sort",
      "@typescript-eslint",
    ],
    env: {
      es6: true,
    },
    ignorePatterns: ["dist/", "playwright-report/"],
    globals: {
      React: true,
      JSX: true,
    },
    parserOptions: {
      tsconfigRootDir: workspaceDirPath,
      project: workspaceDirPath + "/tsconfig.json",
    },
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
        extends: ["plugin:@typescript-eslint/recommended"],
        rules: {
          "@typescript-eslint/no-unused-vars": "error",
          "@typescript-eslint/consistent-type-imports": [
            "error",
            {
              prefer: "type-imports",
              fixStyle: "separate-type-imports",
              disallowTypeAnnotations: true,
            },
          ],
        },
      },
    ],
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "no-unused-vars": "error",
    },
  };
};
