import "iron-session";

declare module "iron-session" {
  export interface IronSessionData {
    user:
      | {
          id: string;
          name: string;
          email: string;
          isGuest: false;
        }
      | {
          id: string;
          isGuest: true;
        };
  }
}
