import * as React from "react";

export interface CompactButtonProps {
  icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  children?: React.ReactNode;
  onClick?: () => void;
}

const CompactButton: React.VoidFunctionComponent<CompactButtonProps> = ({
  icon: Icon,
  children,
  onClick,
}) => {
  return (
    <button
      type="button"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 active:bg-gray-300 active:text-gray-500"
      onClick={onClick}
    >
      {Icon ? <Icon className="h-3 w-3" /> : children}
    </button>
  );
};

export default CompactButton;
