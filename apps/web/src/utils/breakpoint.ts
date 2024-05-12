import { createBreakpoint } from "react-use";

export const useBreakpoint = createBreakpoint({
  mobile: 320,
  desktop: 640,
}) as () => "mobile" | "desktop";
