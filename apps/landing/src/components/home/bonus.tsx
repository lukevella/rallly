import { cn } from "@rallly/ui";
import { m } from "framer-motion";
import {
  CalendarCheck2Icon,
  LanguagesIcon,
  Users2Icon,
  ZapIcon,
} from "lucide-react";

import { Trans } from "@/components/trans";
import { IconComponent } from "@/types";

const Item = ({
  icon: Icon,
  className,
  children,
  delay = 0,
}: React.PropsWithChildren<{
  icon: IconComponent;
  className?: string;
  delay?: number;
}>) => {
  return (
    <m.div
      transition={{
        delay,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "all" }}
      className="flex justify-center"
    >
      <div className="flex items-center justify-center gap-x-2.5 rounded-full border bg-gray-50 p-1 pr-6 shadow-sm">
        <span
          className={cn("bg-primary rounded-full p-2 text-gray-50", className)}
        >
          <Icon className="size-4" />
        </span>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </m.div>
  );
};

const Bonus: React.FunctionComponent = () => {
  return (
    <div className="mx-auto flex flex-wrap justify-center  gap-2 whitespace-nowrap text-center sm:grid-cols-4 sm:gap-4 sm:gap-x-8">
      <Item className="bg-indigo-600" icon={Users2Icon}>
        <Trans
          i18nKey="home:statsUsersRegistered"
          defaults="45k+ registered users"
        />
      </Item>
      <Item delay={0.25} className="bg-pink-600" icon={CalendarCheck2Icon}>
        <Trans
          i18nKey="home:statsPollsCreated"
          defaults="100k+ polls created"
        />
      </Item>
      <Item delay={0.5} className="bg-gray-800" icon={LanguagesIcon}>
        <Trans
          i18nKey="home:statsLanguagesSupported"
          defaults="10+ languages supported"
        />
      </Item>
      <Item delay={0.75} className="bg-amber-500" icon={ZapIcon}>
        <Trans i18nKey="home:noLoginRequired" defaults="No login required" />
      </Item>
    </div>
  );
};

export default Bonus;
