import type { PasswordQuality } from "@/features/password/types";

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  if (charsetSize === 0) return 0;

  const entropy = password.length * Math.log2(charsetSize);

  return Math.min(100, Math.round((entropy / 60) * 100));
}

export function getPasswordQuality(password: string): PasswordQuality {
  const strength = calculatePasswordStrength(password);
  if (strength === 0) return "veryWeak";
  if (strength < 40) return "weak";
  if (strength < 65) return "fair";
  if (strength < 85) return "good";
  return "strong";
}

export const passwordQualityThresholds: Record<PasswordQuality, number> = {
  veryWeak: 0,
  weak: 40,
  fair: 65,
  good: 85,
  strong: 100,
};
