"use client";

import React from "react";

import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";

const checkIfWideScreen = () => window.innerWidth > 640;

export function PollViz() {
  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);
  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  return <PollComponent />;
}
