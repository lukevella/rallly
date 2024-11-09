import { prisma } from "@rallly/database";
import type { TFunction } from "i18next";
import {
  CalendarCheck2Icon,
  LanguagesIcon,
  Users2Icon,
  ZapIcon,
} from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { BonusItem } from "@/components/home/bonus-item";

export async function Bonus({ t }: { t: TFunction }) {
  const userCount = await prisma.user.count();
  return (
    <div className="mx-auto flex flex-wrap justify-center gap-2 whitespace-nowrap text-center sm:grid-cols-4 sm:gap-4 sm:gap-x-8">
      <BonusItem
        className="bg-indigo-600"
        icon={<Users2Icon className="size-4" />}
      >
        <Trans
          t={t}
          i18nKey="statsUsersRegistered"
          ns="home"
          defaults="{count, number, ::compact-short} registered users"
          values={{ count: userCount }}
        />
      </BonusItem>
      <BonusItem
        delay={0.25}
        className="bg-pink-600"
        icon={<CalendarCheck2Icon className="size-4" />}
      >
        <Trans
          t={t}
          ns="home"
          i18nKey="statsPollsCreated"
          values={{ count: 300 * 1000 }}
          defaults="{count, number, ::compact-short}+ polls created"
        />
      </BonusItem>
      <BonusItem
        delay={0.5}
        className="bg-gray-800"
        icon={<LanguagesIcon className="size-4" />}
      >
        <Trans
          t={t}
          ns="home"
          i18nKey="statsLanguagesSupported"
          defaults="10+ languages supported"
        />
      </BonusItem>
      <BonusItem
        delay={0.75}
        className="bg-teal-500"
        icon={<ZapIcon className="size-4" />}
      >
        <Trans
          t={t}
          ns="home"
          i18nKey="noLoginRequired"
          defaults="No login required"
        />
      </BonusItem>
    </div>
  );
}

export default Bonus;
