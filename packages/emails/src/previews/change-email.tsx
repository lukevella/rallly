import { previewEmailContext } from "../components/email-context";
import { ChangeEmailEmail } from "../templates/change-email";

export default function ChangeEmailEmailPreview() {
  return <ChangeEmailEmail code="123456" ctx={previewEmailContext} />;
}
