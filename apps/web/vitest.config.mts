import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/*.spec.ts"],
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Non-UTC, non-integer offset so code that omits an explicit timeZone fails
    // loudly instead of passing by luck on a UTC runner.
    env: { TZ: "Asia/Kathmandu" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/empty-module.ts"),
      "client-only": path.resolve(__dirname, "./src/test/empty-module.ts"),
    },
  },
});
