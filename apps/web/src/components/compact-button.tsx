import * as React from "react";

export interface CompactButtonProps {
  icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  children?: React.ReactNode;
  onClick?: () => void;
}

const CompactButton: React.FunctionComponent<CompactButtonProps> = ({
  icon: Icon,
  children,
  onClick,
}) => {
  return (
    <button
      type="button"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:bg-slate-300 active:text-slate-500"
      onClick={onClick}
    >
      {Icon ? <Icon className="h-3 w-3" /> : children}
    </button>
  );
};

export default CompactButton;
