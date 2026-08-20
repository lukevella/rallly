import { cn } from "@rallly/ui";
import { DemoScreen } from "../hero-demo/demo-frame";

// A textless mock of the poll creation form: title field and a month
// calendar with a weekly cadence of selected days. Bars stand in for copy so
// it doesn't compete with the section text. Sized to fit the 4:3 artboard on
// the how it works section.
const WEEKS = 4;
const START_OFFSET = 2;
const SELECTED_COLUMN = 3;

export const CreateStepDemo = () => (
  <DemoScreen className="space-y-2 p-4">
    <div className="space-y-1.5">
      <div className="h-1.5 w-8 rounded-full bg-gray-300" />
      <div className="flex h-6 items-center rounded-md border border-gray-200 px-2">
        <div className="h-1.5 w-24 rounded-full bg-gray-300" />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-14 rounded-full bg-gray-300" />
        <div className="h-1.5 w-10 rounded-full bg-gray-200" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: weekday header cells are positional
            key={index}
            className="flex justify-center py-0.5"
          >
            <div className="h-1 w-2 rounded-full bg-gray-200" />
          </div>
        ))}
        {Array.from({ length: WEEKS * 7 }, (_, index) => {
          if (index < START_OFFSET) {
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are positional
                key={index}
              />
            );
          }
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: calendar cells are positional
              key={index}
              className={cn(
                "h-3.5 rounded",
                index % 7 === SELECTED_COLUMN ? "bg-gray-300" : "bg-gray-100",
              )}
            />
          );
        })}
      </div>
    </div>
    <div className="flex justify-end border-gray-200/60 border-t pt-2">
      <div className="h-7 w-14 rounded-md bg-indigo-600/90" />
    </div>
  </DemoScreen>
);
