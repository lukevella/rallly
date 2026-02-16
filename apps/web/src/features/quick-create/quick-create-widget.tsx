"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CheckIcon, PlusIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { PollPageIcon } from "@/app/components/page-icons";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { RelativeDate } from "./components/relative-date";

export function QuickCreateWidget() {
  const { data: polls = [] } = trpc.polls.getGuestPolls.useQuery(undefined, {
    staleTime: 1000 * 60,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center gap-2 rounded-md font-medium text-primary">
          <ZapIcon className="size-5" />
          <h2>
            <Trans i18nKey="quickCreate" defaults="Quick Create" />
          </h2>
        </div>
        <p className="text-pretty text-muted-foreground">
          <Trans
            i18nKey="quickActionsDescription"
            defaults="Create a group poll without signing in. Login later to link it to your account."
          />
        </p>
        {polls.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">
              <Trans
                i18nKey="quickCreateRecentlyCreated"
                defaults="Recently Created"
              />
            </h3>
            <ul className="space-y-2">
              {polls.map((poll) => (
                <li key={poll.id}>
                  <Link
                    href={`/poll/${poll.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-3 hover:bg-card-accent"
                  >
                    <div>
                      <PollPageIcon size="xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{poll.title}</div>
                      <div className="whitespace-nowrap text-muted-foreground text-sm">
                        <RelativeDate date={poll.createdAt} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <Button asChild size="lg" className="w-full">
            <Link href="/new">
              <Icon size="lg">
                <PlusIcon />
              </Icon>
              <Trans
                i18nKey="quickCreateGroupPoll"
                defaults="Create Group Poll"
              />
            </Link>
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            <Trans
              i18nKey="quickCreateWhyCreateAnAccount"
              defaults="Why create an account?"
            />
          </h3>
        </div>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckIcon className="size-5 text-green-600 dark:text-green-500" />
            <Trans
              i18nKey="quickCreateSecurePolls"
              defaults="Store polls securely in your account"
            />
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="size-5 text-green-600 dark:text-green-500" />
            <Trans
              i18nKey="quickCreateGetNotifications"
              defaults="Get email notifications"
            />
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="size-5 text-green-600 dark:text-green-500" />
            <Trans
              i18nKey="quickCreateManagePollsFromAnyDevice"
              defaults="Manage your polls from any device"
            />
          </li>
        </ul>
      </div>
    </div>
  );
}
