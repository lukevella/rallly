import { redirect } from "next/navigation";
import { validateRedirectUrl } from "@/lib/utils/redirect";

/**
 * Login and registration are a single flow on /login: entering an unknown
 * email creates an account on OTP verification. This route only remains for
 * old links.
 */
export default async function Register(props: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const searchParams = await props.searchParams;
  const redirectTo = validateRedirectUrl(searchParams?.redirectTo);

  redirect(
    redirectTo
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/login",
  );
}
