import { defaultEmailContext } from "../components/email-context";
import { LoginEmail } from "../templates/login";

export default function LoginPreview() {
  return (
    <LoginEmail
      code="123456"
      magicLink="https://rallly.co"
      ctx={defaultEmailContext}
    />
  );
}
