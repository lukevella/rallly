import { Inter } from "next/font/google";

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  // The optical size axis lets large text render Inter's display cut
  // (tighter spacing, refined letterforms) via default optical sizing.
  axes: ["opsz"],
});
