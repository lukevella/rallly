import { VoteType } from "@rallly/database";
import { ArrowRightIcon, GithubIcon, User2Icon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { cn } from "@rallly/ui/lib/utils";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { getRandomAvatarColor } from "@/components/home/color-hash";
import { Trans } from "@/components/trans";
import { linkToApp } from "@/lib/linkToApp";

const VoteIcon = ({ variant }: { variant: VoteType }) => {
  return (
    <Image
      src={`/${variant === "ifNeedBe" ? "if-need-be" : variant}.svg`}
      width={20}
      height={20}
      alt={variant}
    />
  );
};

const Participant = ({ name }: { name: string }) => {
  const { color, requiresDarkText } = getRandomAvatarColor(name);
  return (
    <div className="flex items-center gap-x-4">
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
          requiresDarkText ? "text-gray-800" : "text-white",
        )}
        style={{
          background: color,
        }}
      >
        {name[0]}
      </span>
      <span className="whitespace-nowrap font-semibold">{name}</span>
    </div>
  );
};

export const DateIcon = ({
  date,
  className,
}: {
  date?: Date;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-block w-14 overflow-hidden rounded-md border bg-white text-center text-slate-800",
        className,
      )}
    >
      <div className="h-4 border-b border-slate-200 bg-slate-50 text-xs leading-4">
        {dayjs(date).format("ddd")}
      </div>
      <div className="flex items-center justify-center py-1">
        <div>
          <div className="my-px text-lg font-bold leading-none">
            {dayjs(date).format("DD")}
          </div>
          <div className="text-xs font-bold uppercase">
            {dayjs(date).format("MMM")}
          </div>
        </div>
      </div>
    </div>
  );
};

const options = [
  {
    date: new Date("2023-05-12"),
    score: 4,
  },
  {
    date: new Date("2023-05-13"),
    score: 3,
  },
  {
    date: new Date("2023-05-14"),
    score: 4,
  },
  {
    date: new Date("2023-05-15"),
    score: 5,
    highScore: true,
  },
  {
    date: new Date("2023-05-16"),
    score: 1,
  },
];

const participants: Array<{ name: string; votes: VoteType[] }> = [
  { name: "Sarah Johnson", votes: ["yes", "no", "yes", "yes", "no"] },
  { name: "Michael Lee", votes: ["yes", "yes", "yes", "yes", "no"] },
  {
    name: "Leslie Bradtke",
    votes: ["no", "yes", "yes", "yes", "yes"],
  },
  { name: "Edward Marvin", votes: ["yes", "no", "ifNeedBe", "yes", "no"] },
  { name: "Samantha Patel", votes: ["yes", "yes", "no", "yes", "no"] },
];
const Demo = () => {
  return (
    <div className="sm:shadow-huge w-[700px] min-w-0 shrink-0 select-none overflow-hidden rounded-md border border-gray-300/75 bg-white pb-1">
      <div className="flex h-14 items-center justify-between border-b bg-gray-50 px-4 py-3 font-semibold">
        <div>
          <Trans i18nKey="participantCount" values={{ count: 5 }} />
        </div>
        <div>
          <Trans i18nKey="optionCount" values={{ count: 5 }} />
        </div>
      </div>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th></th>
            {options.map((option, i) => {
              return (
                <th key={i} className="p-3 font-normal">
                  <div className="grid gap-1">
                    <div>
                      <DateIcon date={option.date} />
                    </div>
                    <div>
                      <span
                        className={cn(
                          "relative inline-flex select-none items-center gap-1 rounded-full border py-0.5 px-2 text-xs tabular-nums",
                          option.highScore
                            ? "border-green-500 text-green-500"
                            : "border-transparent text-gray-500",
                        )}
                      >
                        <User2Icon className="h-3 w-3 shrink-0" />
                        <span>{option.score}</span>
                      </span>
                    </div>
                  </div>
                </th>
              );
            })}
            <th className="h-20 w-20 p-3 align-bottom"></th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, i) => {
            return (
              <tr key={i}>
                <td className="py-3 pr-3 pl-4">
                  <Participant name={participant.name} />
                </td>
                {participant.votes.map((vote, j) => {
                  return (
                    <td key={j} className="w-16 p-1 text-center">
                      <div className="flex h-10 items-center justify-center rounded-md border bg-gray-50">
                        <VoteIcon variant={vote} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Hero: React.FunctionComponent = () => {
  return (
    <div className="mt-8 max-w-full text-center sm:mt-16">
      <div className="mb-6 sm:mb-8">
        <Link
          target="_blank"
          href="https://github.com/lukevella/rallly"
          className="hover:text-primary hover:border-primary active:bg-primary-50 group inline-flex items-center rounded-full border border-gray-300/50 bg-gray-50/50 px-2.5 py-2 text-xs font-medium text-gray-600 transition-colors sm:text-sm"
        >
          <span className="px-2.5">
            <Trans i18nKey="opensource" defaults="We're Open Source!" />
          </span>
          <span className="inline-flex items-center gap-2 border-l px-2.5">
            <GithubIcon className="h-4 w-4" />
            <Trans i18nKey="startUsOnGithub" defaults="Star us on Github" />
            <ArrowRightIcon className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 group-active:translate-x-2" />
          </span>
        </Link>
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
        <Trans i18nKey="headline" defaults="Ditch the back-and-forth emails" />
      </h1>
      <p className="text-xl text-gray-500">
        <Trans
          i18nKey="subheadling"
          defaults="Streamline your scheduling process and save time"
        />
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <div className="relative">
          <Button size="lg" className="shadow-sm" variant="primary" asChild>
            <Link href={linkToApp("/new")}>
              <Trans i18nKey="homepage_getStarted" />
            </Link>
          </Button>
        </div>
        <Button size="lg" className="shadow-sm" asChild>
          <Link href="https://support.rallly.co">
            <Trans i18nKey="homepage_readDocs" defaults="Read the docs" />
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground mt-8 mb-8 whitespace-nowrap text-center text-sm">
        <Trans
          i18nKey="getStartedHint"
          defaults="Create a poll. It's free. No login required."
        />
      </p>
      <div className="-mx-4 flex overflow-x-auto p-4 sm:justify-center sm:overflow-visible">
        <Demo />
      </div>
    </div>
  );
};

export default Hero;
