const typescriptTransform = require("i18next-scanner-typescript");

module.exports = {
  input: ["src/previews/_templates/**/*.{ts,tsx}"],
  options: {
    nsSeparator: ":",
    defaultNs: "common",
    lngs: ["en"],
    ns: ["common", "new-comment"],
    plural: false,
    removeUnusedKeys: true,
    func: {
      list: ["t"],
      extensions: [".js", ".jsx"],
    },
    trans: {
      extensions: [".js", ".jsx"],
    },
    resource: {
      loadPath: "locales/{{lng}}/{{ns}}.json",
      savePath: "locales/{{lng}}/{{ns}}.json",
    },
  },
  format: "json",
  fallbackLng: "en",
  transform: typescriptTransform(),
};
