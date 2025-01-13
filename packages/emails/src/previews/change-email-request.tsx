import { previewEmailContext } from "../components/email-context";
import { ChangeEmailRequest } from "../templates/change-email-request";

export default function ChangeEmailRequestPreview() {
  return (
    <ChangeEmailRequest
      fromEmail="john@example.com"
      toEmail="jane@example.com"
      verificationUrl="https://rallly.co/verify-email-change?token=1234567890"
      ctx={previewEmailContext}
    />
  );
}
