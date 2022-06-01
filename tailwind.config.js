const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/pages/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colors.indigo,
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        popIn: {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
      animation: {
        wiggle: "wiggle 0.2s ease-in-out",
        popIn: "popIn 0.1s ease-out",
      },
      screens: {
        xs: "375px",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        mono: ["Noto Sans Mono", ...defaultTheme.fontFamily.mono],
      },
      transitionTimingFunction: {
        "in-expo": "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
