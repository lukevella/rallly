import "@testing-library/jest-dom/vitest";
import "@/lib/dayjs";
import { vi } from "vitest";

// jsdom has no PointerEvent; Base UI references it in pointer handlers
if (!window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "";
    }
  }
  window.PointerEvent =
    PointerEventPolyfill as unknown as typeof window.PointerEvent;
  globalThis.PointerEvent = window.PointerEvent;
}

// Mock next-themes to avoid SSR issues
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
