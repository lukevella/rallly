"use client";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hours = new Date().getHours();
  if (hours < 12) {
    return "morning";
  } else if (hours < 18) {
    return "afternoon";
  } else {
    return "evening";
  }
}

export default function WelcomeMessage() {
  const { user } = useUser();
  const timeOfDay = getTimeOfDay();

  switch (timeOfDay) {
    case "morning":
      return (
        <Trans
          i18nKey="goodMorning"
          defaults="Good morning, {name}!"
          values={{ name: user.name }}
        />
      );
    case "afternoon":
      return (
        <Trans
          i18nKey="goodAfternoon"
          defaults="Good afternoon, {name}!"
          values={{ name: user.name }}
        />
      );
    case "evening":
      return (
        <Trans
          i18nKey="goodEvening"
          defaults="Good evening, {name}!"
          values={{ name: user.name }}
        />
      );
  }
}
