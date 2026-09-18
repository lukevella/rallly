import { cn } from "@rallly/ui";
import { CreditCardIcon } from "lucide-react";

/**
 * Minimal brand marks drawn inline: the alternative is shipping licensed
 * logo assets, and these only need to be recognisable at 24px. Anything
 * unrecognised falls back to a generic card.
 */
function Mastercard() {
  return (
    <svg viewBox="0 0 32 20" aria-hidden="true" className="h-4 w-auto">
      <circle cx="12.5" cy="10" r="7" fill="#EB001B" />
      <circle cx="19.5" cy="10" r="7" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

function Visa() {
  return (
    <svg viewBox="0 0 32 20" aria-hidden="true" className="h-3 w-auto">
      <title>Visa</title>
      <text
        x="16"
        y="15"
        textAnchor="middle"
        fill="#1434CB"
        fontSize="13"
        fontWeight="700"
        fontStyle="italic"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

function Amex() {
  return (
    <svg viewBox="0 0 32 20" aria-hidden="true" className="h-4 w-auto">
      <title>American Express</title>
      <rect width="32" height="20" rx="3" fill="#1F72CD" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="7"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        AMEX
      </text>
    </svg>
  );
}

const marks: Record<string, () => React.ReactElement> = {
  amex: Amex,
  mastercard: Mastercard,
  visa: Visa,
};

export function CardBrandMark({
  brand,
  className,
}: {
  brand: string;
  className?: string;
}) {
  const Mark = marks[brand];

  return (
    <span
      className={cn(
        "flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-card-border bg-card",
        className,
      )}
    >
      {Mark ? (
        <Mark />
      ) : (
        <CreditCardIcon className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}
