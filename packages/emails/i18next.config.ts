import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en"],
  extract: {
    input: ["src/templates/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    output: "locales/{{language}}/{{namespace}}.json",
    defaultNS: "emails",
    nsSeparator: false,
    keySeparator: false,
    defaultValue: "__STRING_NOT_TRANSLATED__",
    removeUnusedKeys: true,
    disablePlurals: true,
    functions: ["t", "ctx.t"],
    transComponents: ["Trans"],
  },
});
