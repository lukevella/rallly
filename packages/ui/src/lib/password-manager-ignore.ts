/**
 * Spread onto an input that should never attract a password manager, e.g. a
 * field that collects someone else's email or a confirmation phrase. There is
 * no standard: autocomplete="off" is ignored by every manager, so each vendor
 * gets its own attribute. Must be present on first render; 1Password caches
 * the classification when the field is first focused.
 */
export const passwordManagerIgnoreProps = {
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
  "data-protonpass-ignore": "true",
  "data-bwignore": "true",
} as const;
