const typescriptTransform = require("i18next-scanner-typescript");

module.exports = {
  input: ["src/templates/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
  options: {
    nsSeparator: false,
    defaultNs: "emails",
    defaultValue: "__STRING_NOT_TRANSLATED__",
    lngs: ["en"],
    ns: ["emails"],
    plural: false,
    removeUnusedKeys: true,
    func: {
      list: ["t", "ctx.t"],
    },
    trans: {
      component: "Trans",
      i18nKey: "i18nKey",
      defaultsKey: "defaults",
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
