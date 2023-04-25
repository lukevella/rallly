const fs = require("fs");
const languages = require("@rallly/languages/languages.json");

const pluralSuffix = ["one", "few", "other", "zero", "two", "many"];

const flattenPlurals = (translations) => {
  const flattenedTranslations = {};
  const context = {};
  for (const key in translations) {
    const value = translations[key];
    if (typeof value === "object") {
      // recursively flatten plurals
      flattenedTranslations[key] = flattenPlurals(value);
    } else {
      // hold plural values in context eg: { baseKey: { zero: "", one: "", other: "" }}}
      const suffix = key.split("_").pop();
      if (pluralSuffix.includes(suffix)) {
        const baseKey = key.replace(`_${suffix}`, "");
        if (!context[baseKey]) {
          context[baseKey] = { [suffix]: translations[key] };
        } else {
          context[baseKey][suffix] = translations[key];
        }
      } else {
        flattenedTranslations[key] = translations[key];
      }
    }
    // convert plural context to ICU format
    for (const baseKey in context) {
      const translationBySuffix = context[baseKey];
      pluralSuffix.forEach((suffix) => {
        // remove keys that are basically the same as the "other" key
        if (
          suffix !== "other" &&
          translationBySuffix[suffix] === translationBySuffix.other
        ) {
          delete translationBySuffix[suffix];
        }
      });
      let icuMessage = "{count, plural,";
      Object.entries(translationBySuffix).forEach(([suffix, translation]) => {
        icuMessage += ` ${suffix} {${translation
          .replace("{{", "{")
          .replace("}}", "}")}}`;
      });
      flattenedTranslations[baseKey] = icuMessage + "}";
    }
  }
  return flattenedTranslations;
};

function convertPluralsToICU(filePath) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const translations = JSON.parse(fileContents);
  const newTranslations = flattenPlurals(translations);

  fs.writeFileSync(filePath, JSON.stringify(newTranslations, null, 2));
}

Object.keys(languages).forEach((language) => {
  const filePath = `./public/locales/${language}/app.json`;
  convertPluralsToICU(filePath);
});
