import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NonprofitApplicationPage } from "@/features/billing/nonprofit/components/nonprofit-application-page";
import { loadNonprofitStatus } from "@/features/billing/nonprofit/loaders";
import { Logo } from "@/features/branding/components/logo";
import { loadActiveSpace } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { SignedInFooter } from "@/features/user/components/signed-in-footer";
import { loadUser } from "@/features/user/loaders";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

// The apply action runs under the segment that invokes it: the verifier's
// model cap plus the site fetch and document reads outruns the default.
export const maxDuration = 60;

export default async function NonprofitPage() {
  if (!isFeatureEnabled("nonprofitDiscount")) {
    notFound();
  }

  // loadUser sends a cold visitor to /login and back here; loadActiveSpace
  // sends an account that has not finished onboarding through /setup first.
  const user = await loadUser();
  const space = await loadActiveSpace();
  const status = await loadNonprofitStatus();

  const ability = defineAbilityForMember({
    user: { id: user.id },
    space: { id: space.id, ownerId: space.ownerId, role: space.role },
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3">
        <Logo size="sm" />
        <ThemeSwitcher />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 overflow-y-auto p-4"
      >
        <article className="m-auto w-full max-w-md">
          <NonprofitApplicationPage
            email={user.email}
            isOwner={ability.can("manage", "Billing")}
            isPro={space.tier === "pro"}
            isGranted={status.grantedAt !== null}
            rejectionReason={
              status.latestApplication?.status === "rejected"
                ? status.latestApplication.reason
                : null
            }
          />
        </article>
      </main>
      <footer className="flex justify-center p-16">
        <SignedInFooter email={user.email} />
      </footer>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("nonprofitApplyTitle", {
      defaultValue: "Apply for the nonprofit discount",
    }),
  };
}
