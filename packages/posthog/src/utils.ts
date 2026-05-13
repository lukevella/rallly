type NavigatorWithGlobalPrivacyControl = Navigator & {
  globalPrivacyControl?: boolean;
};

export function isGlobalPrivacyControlEnabled() {
  return (
    typeof navigator !== "undefined" &&
    (navigator as NavigatorWithGlobalPrivacyControl).globalPrivacyControl ===
      true
  );
}
