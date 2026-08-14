"use client";

import { Badge } from "@rallly/ui/badge";
import { Card, CardContent } from "@rallly/ui/card";
import {
  CalendarCheckIcon,
  CheckIcon,
  CopyIcon,
  MailIcon,
  UserPlusIcon,
} from "lucide-react";
import type React from "react";
import { Trans } from "@/i18n/client";

/**
 * Decorative DOM mockups shown in the paywall dialog's feature panel. Sample
 * data only — every frame is aria-hidden and mirrors the visual style of
 * BrandingPreview (which renders the real thing and brings its own frame).
 */
function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[252px] items-center justify-center overflow-hidden rounded-lg border bg-gray-100 px-4 dark:bg-gray-900">
      <Badge className="absolute top-2.5 right-3 z-10" size="sm">
        <Trans i18nKey="preview" defaults="Preview" />
      </Badge>
      <div className="w-full max-w-xs" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export function RequireEmailPreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">
              <Trans i18nKey="name" defaults="Name" />
            </div>
            <div className="rounded-md border bg-background px-2.5 py-1.5 text-sm">
              Jessie Smith
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">
              <Trans i18nKey="email" defaults="Email" />{" "}
              <span className="text-primary">*</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-primary bg-background px-2.5 py-1.5 text-sm ring-2 ring-primary/20">
              <MailIcon className="size-4 text-muted-foreground" />
              <span>jessie@example.com</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PreviewFrame>
  );
}

const sampleParticipants = [
  { name: "Sofia Rossi", color: "bg-indigo-500" },
  { name: "Ben Carter", color: "bg-rose-500" },
  { name: "Amara Okafor", color: "bg-emerald-500" },
];

export function HideParticipantsPreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-2.5 font-medium text-muted-foreground text-xs">
            <Trans i18nKey="participants" defaults="Participants" />
          </div>
          <div className="divide-y border-t">
            {sampleParticipants.map((participant) => (
              <div
                key={participant.name}
                className="flex items-center gap-2.5 px-4 py-2.5"
              >
                <span
                  className={`inline-flex size-6 select-none items-center justify-center rounded-full font-medium text-white text-xs blur-[3px] ${participant.color}`}
                >
                  {participant.name[0]}
                </span>
                <span className="select-none text-sm blur-[3px]">
                  {participant.name}
                </span>
                <CheckIcon className="ml-auto size-4 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PreviewFrame>
  );
}

const sampleScores = [
  { label: "Mon, 10:00", width: "w-4/5", votes: 4 },
  { label: "Tue, 14:00", width: "w-3/5", votes: 3 },
  { label: "Wed, 9:00", width: "w-2/5", votes: 2 },
];

export function HideScoresPreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="space-y-3 p-4">
          {sampleScores.map((option) => (
            <div key={option.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{option.label}</span>
                <span className="select-none font-medium text-muted-foreground text-xs blur-[3px]">
                  {option.votes}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className={`h-full select-none rounded-full bg-primary/60 blur-[3px] ${option.width}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PreviewFrame>
  );
}

export function FinalizePreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="rounded-lg border px-3 py-2 text-muted-foreground text-sm opacity-60">
            Thu, Sep 3
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-sm">
            <CalendarCheckIcon className="size-4 text-primary" />
            <span className="font-medium">Fri, Sep 4</span>
            <Badge size="sm" className="ml-auto">
              <Trans i18nKey="finalized" defaults="Finalized" />
            </Badge>
          </div>
          <div className="rounded-lg border px-3 py-2 text-muted-foreground text-sm opacity-60">
            Mon, Sep 7
          </div>
        </CardContent>
      </Card>
    </PreviewFrame>
  );
}

export function DuplicatePreview() {
  return (
    <PreviewFrame>
      <div className="relative pt-3">
        <Card className="absolute inset-x-3 top-0 h-12 opacity-50" />
        <Card className="relative">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="inline-flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <CopyIcon className="size-4" />
            </div>
            <div>
              <div className="font-medium text-sm">Team Standup</div>
              <div className="text-muted-foreground text-xs">
                <Trans i18nKey="copy" defaults="Copy" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PreviewFrame>
  );
}

export function AttributionPreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="h-2.5 w-2/3 rounded-full bg-muted" />
          <div className="h-2 w-1/2 rounded-full bg-muted" />
          <div className="h-2 w-3/5 rounded-full bg-muted" />
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-muted-foreground text-sm">
        <span className="line-through opacity-60">
          <Trans
            i18nKey="poweredByRallly"
            defaults="Powered by <a>{name}</a>"
            values={{ name: "rallly.co" }}
            components={{ a: <span className="font-semibold" /> }}
          />
        </span>
      </div>
    </PreviewFrame>
  );
}

export function MembersPreview() {
  return (
    <PreviewFrame>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex -space-x-2">
            {sampleParticipants.map((participant) => (
              <span
                key={participant.name}
                className={`inline-flex size-8 items-center justify-center rounded-full font-medium text-white text-xs ring-2 ring-card ${participant.color}`}
              >
                {participant.name[0]}
              </span>
            ))}
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-dashed bg-background text-muted-foreground text-xs ring-2 ring-card">
              +2
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-background py-1.5 pr-1.5 pl-2.5">
            <span className="flex-1 truncate text-muted-foreground text-sm">
              colleague@example.com
            </span>
            <span className="inline-flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <UserPlusIcon className="size-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </PreviewFrame>
  );
}
