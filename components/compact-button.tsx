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
      className="h-5 w-5 rounded-full hover:bg-gray-200 transition-colors active:text-gray-500 active:bg-gray-300 text-gray-400 bg-gray-100 inline-flex items-center justify-center"
      onClick={onClick}
    >
      {Icon ? <Icon className="w-3 h-3" /> : children}
    </button>
  );
};

export default CompactButton;
