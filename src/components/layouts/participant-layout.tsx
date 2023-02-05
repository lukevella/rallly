import { MobileNavigation } from "./standard-layout/mobile-navigation";

export const ParticipantLayout = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <div className="bg-pattern min-h-full sm:space-y-8">
      <MobileNavigation />
      <div className="mx-auto max-w-3xl space-y-4 px-3 pb-8">
        <div>{children}</div>
      </div>
    </div>
  );
};
