import "server-only";

export function isInitialAdmin(email: string) {
  return (
    process.env.INITIAL_ADMIN_EMAIL &&
    email.toLowerCase() === process.env.INITIAL_ADMIN_EMAIL.toLowerCase()
  );
}

function normalizeVersion(version: string) {
  return version.replace(/^v/, "").split(/[-+]/)[0];
}

export function getMajorVersion(version: string) {
  const major = Number.parseInt(normalizeVersion(version).split(".")[0], 10);
  return Number.isNaN(major) ? null : major;
}

// Compares release numbers only — prerelease/build suffixes are ignored, so
// "4.2.0-beta.1" is not outdated relative to "4.2.0". Callers that must not
// cross majors need to guard with getMajorVersion themselves.
export function isOutdated(current: string, latest: string) {
  const a = normalizeVersion(current)
    .split(".")
    .map((n) => Number(n) || 0);
  const b = normalizeVersion(latest)
    .split(".")
    .map((n) => Number(n) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai !== bi) return ai < bi;
  }
  return false;
}
