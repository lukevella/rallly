const preset = require("./preset");

/** @return {import("eslint").Linter.Config} */
module.exports = (workspaceDirPath) => {
  const baseConfig = preset(workspaceDirPath);

  return {
    ...baseConfig,
    extends: [...baseConfig.extends, "next"],
  };
};
