const preset = require("./preset");

/** @return {import("eslint").Linter.Config} */
module.exports = (workspaceDirPath) => {
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
