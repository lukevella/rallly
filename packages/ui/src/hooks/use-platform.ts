export function usePlatform() {
  return { isMac: navigator.userAgent.includes("Mac") };
}
