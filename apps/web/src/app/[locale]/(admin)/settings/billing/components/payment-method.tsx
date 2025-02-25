"use cient";

import { Badge } from "@rallly/ui/badge";
import { z } from "zod";

import { Trans } from "@/components/trans";

const brandLabels = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  unionpay: "UnionPay",
  eftpos_au: "Eftpos (AU)",
  jcb: "JCB",
  link: "Link",
  diners: "Diners Club",
  unknown: "Unknown",
};

type CardBrands = keyof typeof brandLabels;

function CardDetails({ brand, last4 }: { brand: CardBrands; last4: string }) {
  const brandLabel = brandLabels[brand];
  return (
    <div className="flex items-center gap-1">
      <Badge>{brandLabel}</Badge>
      <span>**** {last4}</span>
    </div>
  );
}

const cardDataSchema = z.object({
  brand: z
    .enum([
      "visa",
      "mastercard",
      "amex",
      "discover",
      "unionpay",
      "eftpos_au",
      "jcb",
      "diners",
      "link",
      "unknown",
    ])
    .catch("unknown"),
  last4: z.string(),
});

export function PaymentMethod({ type, data }: { type: string; data: unknown }) {
  switch (type) {
    case "card": {
      const cardData = cardDataSchema.parse(data);
      return <CardDetails brand={cardData.brand} last4={cardData.last4} />;
    }
    case "link":
      return "Link";
    default:
      return (
        <Badge>
          <Trans i18nKey="paymentMethodUnknown" defaults="Unknown" />
        </Badge>
      );
  }
}
