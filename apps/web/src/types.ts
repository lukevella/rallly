import { NextPage } from "next";
import React from "react";

export type ReactTag = keyof JSX.IntrinsicElements;

export type PropsOf<TTag extends ReactTag> = TTag extends React.ElementType
  ? React.ComponentProps<TTag>
  : never;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
  isAuthRequired?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type PropsWithClassName<TProps extends Record<string, unknown> = {}> =
  React.PropsWithChildren<TProps> & {
    className?: string;
  };

export type IconComponent = React.ComponentType<PropsWithClassName>;
