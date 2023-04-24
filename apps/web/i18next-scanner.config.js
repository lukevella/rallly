module.exports = {
  input: ["src/**/*.{ts,tsx}"],
  removeUnusedKeys: true,
  options: {
    keySeparator: ".",
    nsSeparator: false,
    defaultNs: "app",
    defaultValue: "__STRING_NOT_TRANSLATED__",
    lngs: ["en"],
    ns: ["app", "common", "homepage", "errors"],
    func: {
      list: ["t"],
      extensions: [".ts", ".tsx"],
    },
    resource: {
      loadPath: "public/locales/{{lng}}/{{ns}}.json",
      savePath: "public/locales/{{lng}}/{{ns}}.json",
    },
  },
  format: "json",
  fallbackLng: "en",
};
