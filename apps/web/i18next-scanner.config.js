const typescriptTransform = require("i18next-scanner-typescript");

module.exports = {
  input: ["src/**/*.{ts,tsx}"],
  options: {
    keySeparator: ".",
    nsSeparator: false,
    defaultNs: "app",
    defaultValue: "__STRING_NOT_TRANSLATED__",
    lngs: ["en"],
    ns: ["app"],
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
      loadPath: "public/locales/{{lng}}/{{ns}}.json",
      savePath: "public/locales/{{lng}}/{{ns}}.json",
    },
  },
  format: "json",
  fallbackLng: "en",
  transform: typescriptTransform(),
};
