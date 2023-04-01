import "iron-session";

declare module "iron-session" {
  export interface IronSessionData {
    user: {
      id: string;
      isGuest: boolean;
    };
  }
}
