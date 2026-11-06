import { cn } from "@rallly/ui";

/** The product surface a demo is drawn on. Follows the theme. */
export function DemoScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-6px_rgb(0_0_0/0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A stand in for a line of copy, so the demo never competes with the text. */
export function DemoBar({
  className,
  tone = "strong",
}: {
  className?: string;
  tone?: "strong" | "soft";
}) {
  return (
    <div
      className={cn(
        "h-1.5 rounded-full",
        tone === "strong"
          ? "bg-gray-300 dark:bg-gray-600"
          : "bg-gray-200 dark:bg-gray-700",
        className,
      )}
    />
  );
}
