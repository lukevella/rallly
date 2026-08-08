import type React from "react";

/**
 * Icon shown alongside a setting row's title and description.
 *
 * Distinct from `PageIcon`, which identifies a route. This is decoration for a
 * row within a page, so it carries no color or size variants and is hidden
 * once the row stacks vertically and the icon would sit above the text.
 */
export function SettingIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="@md/field-group:block hidden">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400 [&_svg]:size-4">
        {children}
      </span>
    </div>
  );
}
