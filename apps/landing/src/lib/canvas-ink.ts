// Computed colours arrive in whatever space Tailwind used (lab, oklch), so
// let the canvas resolve the text colour to sRGB rather than parsing it.
export function readInk(element: HTMLElement) {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) {
    return "63, 63, 70";
  }
  probe.fillStyle = getComputedStyle(element).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `${r}, ${g}, ${b}`;
}
