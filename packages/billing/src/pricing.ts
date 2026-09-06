export const pricingData = {
  monthly: {
    amount: 700,
    currency: "usd",
  },
  yearly: {
    amount: 5600,
    currency: "usd",
  },
};

export function yearlySavingsPercent({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
}) {
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}
