export type User = {
  id: string;
  isGuest: boolean;
  locale?: string;
  image?: string;
  isLegacyGuest: boolean;
};

export type TRPCContext = {
  user?: User;
  locale?: string;
  identifier?: string;
};
