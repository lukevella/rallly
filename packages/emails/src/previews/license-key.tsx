import { previewEmailContext } from "../components/email-context";
import { LicenseKeyEmail } from "../templates/license-key";

export default function LicenseKeyPreview() {
  return (
    <LicenseKeyEmail
      licenseKey="RLYV4-ABCD-1234-ABCD-1234-XXXX"
      tier="PLUS"
      seats={5}
      ctx={previewEmailContext}
    />
  );
}
