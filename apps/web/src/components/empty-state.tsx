import * as React from "react";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
}

export const EmptyState: React.FunctionComponent<EmptyStateProps> = ({
  icon: Icon,
  text,
}) => {
  return (
    <div className="flex h-full items-center justify-center py-12">
      <div className="text-center font-medium text-slate-500/50">
        <Icon className="mb-2 inline-block h-12 w-12" />
        <div>{text}</div>
      </div>
    </div>
  );
};
