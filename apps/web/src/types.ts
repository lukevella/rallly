import type React from "react";

export type ReactTag = keyof JSX.IntrinsicElements;

export type PropsOf<TTag extends ReactTag> = TTag extends React.ElementType
  ? React.ComponentProps<TTag>
  : never;

export type PropsWithClassName<TProps extends Record<string, unknown>> =
  React.PropsWithChildren<TProps> & {
    className?: string;
  };

// biome-ignore lint/complexity/noBannedTypes: Fix this later
export type IconComponent<TProps extends Record<string, unknown> = {}> =
  React.ComponentType<
    React.PropsWithChildren<TProps> & {
      className?: string;
    }
  >;
