const defaultTheme = require("tailwindcss/defaultTheme");
const sharedConfig = require("@rallly/tailwind-config/tailwind.config");

module.exports = {
  ...sharedConfig,
  content: ["./src/pages/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    ...sharedConfig.theme,
    fontFamily: {
      sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      mono: [...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
