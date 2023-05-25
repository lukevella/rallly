import * as React from "react";

export interface CompactButtonProps {
  icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  children?: React.ReactNode;
  onClick?: () => void;
}

const CompactButton = React.forwardRef<HTMLButtonElement, CompactButtonProps>(
  ({ icon: Icon, children, onClick }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 active:bg-gray-300 active:text-gray-500"
        onClick={onClick}
      >
        {Icon ? <Icon className="h-3 w-3" /> : children}
      </button>
    );
  },
);

CompactButton.displayName = "CompactButton";

export default CompactButton;
