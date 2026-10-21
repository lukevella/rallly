import { cn } from "@rallly/ui";
import LogoWordmark from "@/features/branding/assets/logo.svg";
import { DEFAULT_APP_NAME, LOGO_VIEWBOX } from "@/features/branding/constants";

/**
 * The default wordmark, inlined so the most viewed pages don't each fetch it.
 * Light and dark variants differ only in color, so it uses `currentColor`.
 */
export function DefaultWordmark({ className }: { className?: string }) {
  return (
    <LogoWordmark
      role="img"
      aria-label={DEFAULT_APP_NAME}
      className={cn("block text-[#4f46e5] dark:text-white", className)}
    />
  );
}

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
      <DefaultWordmark className="h-auto w-full" />
    </div>
  );
}
