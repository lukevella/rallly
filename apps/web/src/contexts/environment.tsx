export const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true";

export const IfSelfHosted = ({ children }: React.PropsWithChildren) => {
  return isSelfHosted ? <>{children}</> : null;
};

export const IfCloudHosted = ({ children }: React.PropsWithChildren) => {
  return isSelfHosted ? null : <>{children}</>;
};
