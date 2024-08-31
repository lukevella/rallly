import { previewEmailContext } from "../components/email-context";
import { RegisterEmail } from "../templates/register";

export default function RegisterEmailPreview() {
  return <RegisterEmail code="123456" ctx={previewEmailContext} />;
}
