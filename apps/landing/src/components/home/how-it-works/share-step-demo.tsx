import { cn } from "@rallly/ui";
import { MailIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { DemoScreen } from "../hero-demo/demo-frame";

// A textless mock of the invite step: a link field with a copy button, ways
// to send it, and the group it goes out to. Bars stand in for copy so it
// doesn't compete with the section text. Fills the 4:3 frame on the how it
// works section.
const CHANNELS = [
  { key: "email", icon: MailIcon, width: "w-20" },
  { key: "chat", icon: MessageCircleIcon, width: "w-14" },
  { key: "direct", icon: SendIcon, width: "w-24" },
];

export const ShareStepDemo = () => (
  <DemoScreen className="space-y-2 p-4">
    <div className="space-y-1.5">
      <div className="h-1.5 w-12 rounded-full bg-gray-300" />
      <div className="flex items-center gap-2">
        <div className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2">
          <div className="h-1.5 w-28 rounded-full bg-gray-300" />
        </div>
        <div className="h-7 w-14 shrink-0 rounded-md bg-indigo-600/90" />
      </div>
    </div>
    <div className="space-y-1.5">
      {CHANNELS.map((channel) => (
        <div
          key={channel.key}
          className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5"
        >
          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-gray-100">
            <channel.icon className="size-3 text-gray-400" />
          </div>
          <div
            className={cn("h-1.5 rounded-full bg-gray-300", channel.width)}
          />
        </div>
      ))}
    </div>
    <div className="flex items-center gap-3 border-gray-200/60 border-t pt-3">
      <div className="flex shrink-0 -space-x-1.5">
        {[0, 1, 2, 3].map((participant) => (
          <div
            key={participant}
            className="size-6 rounded-full bg-gray-300 ring-2 ring-white"
          />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-1.5 max-w-32 rounded-full bg-gray-200" />
        <div className="h-1.5 max-w-20 rounded-full bg-gray-200" />
      </div>
    </div>
  </DemoScreen>
);
