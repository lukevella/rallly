declare module "iron-session" {
  export interface IronSessionData {
    user: {
      id: string;
      isGuest: boolean;
    };
  }
}

export type RegistrationTokenPayload = {
  name: string;
  email: string;
  code: string;
};

export type LoginTokenPayload = {
  userId: string;
  code: string;
};

export type DisableNotificationsPayload = {
  pollId: string;
  watcherId: number;
};
