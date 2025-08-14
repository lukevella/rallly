import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next-themes to avoid SSR issues
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
