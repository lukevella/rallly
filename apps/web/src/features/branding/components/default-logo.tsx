import { cn } from "@rallly/ui";
import { DEFAULT_APP_NAME, LOGO_VIEWBOX } from "@/features/branding/constants";

/**
 * Renders the default logo in the same viewbox as `Logo` with `size="fit"`.
 * Static assets only, so it stays safe to render from client error boundaries
 * where instance branding config is unavailable.
 */
export function DefaultLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ width: LOGO_VIEWBOX.width, height: LOGO_VIEWBOX.height }}
    >
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src="/static/logo.svg"
        alt={DEFAULT_APP_NAME}
        className="block max-h-full max-w-full object-contain dark:hidden"
      />
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src="/static/logo-dark.svg"
        alt={DEFAULT_APP_NAME}
        className="hidden max-h-full max-w-full object-contain dark:block"
      />
    </div>
  );
}
