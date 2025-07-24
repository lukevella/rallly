import { prisma } from "@rallly/database";
import { notFound } from "next/navigation";
import { FullLogoLink } from "@/app/components/full-logo-link";
import { requireUser } from "@/auth/data";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { getTranslation } from "@/i18n/server";
import { AcceptInviteButton } from "./components/accept-invite-button";
import { SignOutButton } from "./components/sign-out-button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const user = await requireUser();
  const invite = await prisma.spaceMemberInvite.findUnique({
    where: {
      id: inviteId,
    },
    select: {
      spaceId: true,
      email: true,
      role: true,
      invitedBy: {
        select: {
          name: true,
        },
      },
      space: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    notFound();
  }

  const isWrongAccount = user.email !== invite.email;

  return (
    <div className="flex h-dvh flex-col items-center gap-12 py-12">
      <FullLogoLink />
      <div className="flex w-full max-w-sm flex-col rounded-xl border bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4">
          <SpaceIcon name={invite.space.name} size="lg" />
        </div>
        <h1 className="font-bold text-base">
          <Trans
            i18nKey="joinSpace"
            defaults="Join {spaceName}"
            values={{
              spaceName: invite.invitedBy.name,
            }}
          />
        </h1>
        <p className="mt-1 text-sm">
          <Trans
            i18nKey="acceptInviteTitle"
            defaults="{inviterName} invited you to join {spaceName}"
            values={{
              spaceName: invite.space.name,
              inviterName: invite.invitedBy.name,
            }}
          />
        </p>
        <div className="mt-6">
          <div className="flex flex-col items-center gap-y-2">
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="youAreSignedInAs"
                defaults="You're signed in as"
              />
            </p>
            <div className="flex items-center gap-x-2 rounded-full border p-1 pr-2">
              <OptimizedAvatarImage
                src={user.image}
                name={user.name}
                size="sm"
              />
              <p className="text-sm">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          {isWrongAccount ? (
            <SignOutButton />
          ) : (
            <AcceptInviteButton spaceId={invite.spaceId} />
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const { t } = await getTranslation();
  const invite = await prisma.spaceMemberInvite.findUnique({
    where: {
      id: inviteId,
    },
    select: {
      spaceId: true,
      space: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    notFound();
  }

  return {
    title: t("acceptInviteMetadataTitle", {
      defaultValue: "Join {spaceName}",
      spaceName: invite.space.name,
    }),
  };
}
