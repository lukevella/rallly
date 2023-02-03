import { Trans, useTranslation } from "next-i18next";

import { MobileNavigation } from "./standard-layout/mobile-navigation";

const Logo = () => {
  return <span className="font-bold tracking-wider">RALLLY</span>;
};
export const ParticipantLayout = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation("app");
  return (
    <div className="bg-pattern h-full sm:space-y-8">
      <MobileNavigation />
      <div className="mx-auto max-w-3xl space-y-4 px-3 pb-8">
        <div>{children}</div>
        <div className="flex justify-center text-center">
          <a
            href="https://rallly.co"
            className="rounded-full bg-primary-500 px-4 py-2 text-sm text-white shadow-sm transition-colors hover:border-primary-500 hover:bg-primary-500/90 active:bg-primary-500"
          >
            <Trans
              t={t}
              i18nKey="poweredByRallly"
              components={{
                logo: <Logo />,
              }}
            />
          </a>
        </div>
      </div>
    </div>
  );
};
