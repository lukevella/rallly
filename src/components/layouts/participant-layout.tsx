import { Trans, useTranslation } from "next-i18next";

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
    <div className="bg-pattern h-full overflow-y-auto p-3 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>{children}</div>
        <div className="flex justify-center p-4 text-center">
          <a
            href="https://rallly.co"
            className="rounded-full border bg-white px-4 py-1 text-slate-400 shadow-sm transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-500 active:bg-primary-100"
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
