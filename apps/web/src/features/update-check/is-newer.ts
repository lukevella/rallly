export function isNewer(latest: string, current: string) {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((part) =>
        /^\d+$/.test(part) ? Number.parseInt(part, 10) : Number.NaN,
      );
  const a = parse(latest);
  const b = parse(current);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return false;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}
