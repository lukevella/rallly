import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import { DemoScreen } from "../hero-demo/demo-frame";

// A textless mock of the results: one row per option with real vote icons,
// the winner highlighted. Bars stand in for copy so it doesn't compete with
// the section text. Sized to fit the 4:3 artboard on the how it works
// section.
const ROWS: { votes: ("yes" | "ifNeedBe" | "no")[]; winner: boolean }[] = [
  { votes: ["yes", "yes", "yes", "yes"], winner: true },
  { votes: ["yes", "no", "yes", "no"], winner: false },
  { votes: ["yes", "ifNeedBe", "yes", "no"], winner: false },
  { votes: ["no", "yes", "ifNeedBe", "no"], winner: false },
];

export const DecideStepDemo = () => (
  <DemoScreen className="space-y-1.5 p-4">
    {ROWS.map((row, rowIndex) => (
      <div
        // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe rows
        key={rowIndex}
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border px-2.5 py-2",
          row.winner ? "border-indigo-200 bg-indigo-50" : "border-gray-200",
        )}
      >
        <div className="min-w-0 space-y-1.5">
          <div
            className={cn(
              "h-1.5 w-16 rounded-full",
              row.winner ? "bg-indigo-400" : "bg-gray-300",
            )}
          />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-10 rounded-full bg-gray-200" />
            {row.winner ? (
              <div className="h-1.5 w-12 rounded-full bg-indigo-600" />
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {row.votes.map((vote, voteIndex) => (
            <VoteIcon
              // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe votes
              key={voteIndex}
              type={vote}
              className="size-3.5"
            />
          ))}
        </div>
      </div>
    ))}
  </DemoScreen>
);
