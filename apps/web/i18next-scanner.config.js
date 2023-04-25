const typescriptTransform = require("i18next-scanner-typescript");

module.exports = {
  input: ["src/**/*.{ts,tsx}"],
  options: {
    keySeparator: ".",
    nsSeparator: false,
    defaultNs: "app",
    defaultValue: function (lng) {
      if (lng === "en") {
        return "__STRING_NOT_TRANSLATED__";
      }
      return "";
    },
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
