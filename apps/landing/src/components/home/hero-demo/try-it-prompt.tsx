import { cn } from "@rallly/ui";
import { handwritten } from "@/fonts/handwritten";
import { Trans } from "@/i18n/client/trans";

const ScribbleArrow = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 30 30"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M1.11 2.994h.001l.014-.002a17.546 17.546 0 011.383-.055c.902 0 2.175.06 3.643.3 2.944.48 6.612 1.674 9.67 4.498 1.464 1.35 2.55 3.281 3.339 5.492.787 2.204 1.259 4.626 1.535 6.894.27 2.224.35 4.275.36 5.788l-4.245-4.83a1 1 0 10-1.502 1.32l5.94 6.761a1 1 0 001.412.091l6.76-5.94a1 1 0 10-1.32-1.503l-5.045 4.433v-.262a53.57 53.57 0 00-.375-6.1c-.287-2.357-.783-4.935-1.637-7.325-.85-2.383-2.078-4.64-3.865-6.289-3.44-3.176-7.523-4.483-10.704-5.002A24.842 24.842 0 002.508.938a19.54 19.54 0 00-1.492.056 7.207 7.207 0 00-.089.008l-.025.003H.89v.001L1 2l-.11-.994a1 1 0 00.22 1.988"
      clipRule="evenodd"
    />
  </svg>
);

export const TryItPrompt = () => (
  <div
    className={cn(
      "pointer-events-none absolute -top-12 right-2 flex items-start gap-2 text-gray-600",
      handwritten.className,
    )}
  >
    <span className="-rotate-2 whitespace-nowrap text-sm">
      <Trans
        ns="home"
        i18nKey="heroDemoTryIt"
        defaults="Go ahead, try voting!"
      />
    </span>
    <ScribbleArrow className="mt-3 size-6 text-gray-500" />
  </div>
);
