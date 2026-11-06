import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Spinner } from "@/components/spinner";
import {
  CommentComposer,
  CommentList,
} from "@/features/poll/components/comments-sheet";
import { loadInvitePoll, loadPollDetails } from "@/features/poll/loaders";
import { getTranslation } from "@/i18n/server";
import {
  getInviteToken,
  InvitePollProviders,
} from "../components/invite-poll-providers";

type PageProps = {
  params: Promise<{ urlId: string }>;
  searchParams: Promise<{
    token?: string | string[];
    invite?: string | string[];
  }>;
};

async function CommentsPageContent({ params, searchParams }: PageProps) {
  const [{ urlId }, query] = await Promise.all([params, searchParams]);
  const poll = await loadPollDetails(urlId);

  // The vote tab explains a missing or unavailable poll, and is where a poll
  // with comments turned off sends its discussion.
  if (!poll || poll.disableComments) {
    redirect(`/invite/${urlId}`);
  }

  const token = getInviteToken(query);
  const [invitePoll, { t, i18n }] = await Promise.all([
    loadInvitePoll({ pollId: urlId, token }),
    getTranslation(),
  ]);

  return (
    <InvitePollProviders invitePoll={invitePoll}>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-3 pt-8 lg:px-6 lg:pt-12"
      >
        <h1 className="font-semibold text-2xl tracking-tight">
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="comments"
            defaults="Comments"
          />
        </h1>
        {/* Grows to fill the page so the composer sits on the bottom edge even
            when there are only a few comments. */}
        <CommentList order="oldest" className="mt-6 flex-1" />
        {/* Pinned to the bottom of the viewport like a chat composer, with
            the page colour behind it so comments scroll out underneath. */}
        <div className="sticky bottom-0 mt-6 bg-gray-100 pt-2 pb-4 dark:bg-gray-900">
          <CommentComposer />
        </div>
      </main>
    </InvitePollProviders>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <CommentsPageContent {...props} />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("comments", { defaultValue: "Comments" }),
    robots: { index: false, follow: false },
  };
}
