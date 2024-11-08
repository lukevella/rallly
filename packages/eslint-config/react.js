const preset = require("./preset");

/** @return {import("eslint").Linter.Config} */
module.exports = function (workspaceDirPath) {
  const baseConfig = preset(workspaceDirPath);

  return {
    ...baseConfig,
    extends: [
      ...baseConfig.extends,
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
  };
};
