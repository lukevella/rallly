type User = {
  id: string;
  isGuest: boolean;
  locale?: string;
  image?: string;
};

export type TRPCContext = {
  user?: User;
  locale?: string;
  identifier?: string;
};
