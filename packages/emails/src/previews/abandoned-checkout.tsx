import { previewEmailContext } from "../components/email-context";
import { AbandonedCheckoutEmail } from "../templates/abandoned-checkout";

export default function AbandonedCheckoutEmailPreview() {
  return (
    <AbandonedCheckoutEmail
      ctx={previewEmailContext}
      discount={20}
      couponCode="GETPRO1Y20"
      recoveryUrl="https://example.com"
      name="John Doe"
    />
  );
}
