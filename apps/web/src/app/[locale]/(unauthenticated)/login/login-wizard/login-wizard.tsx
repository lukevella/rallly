import React from "react";

import { LoginMenu } from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-menu";
import { LoginOtp } from "@/app/[locale]/(unauthenticated)/login/login-wizard/login-otp";
import { SignUpName } from "@/app/[locale]/(unauthenticated)/login/signup/signup-name";
import { SignUpOtp } from "@/app/[locale]/(unauthenticated)/login/signup/signup-otp";

type LoginWizardStep = "menu" | "login-otp" | "signup-name" | "signup-otp";

type LoginWizardAction =
  | {
      type: "login";
      email: string;
    }
  | {
      type: "signup";
      email: string;
    }
  | {
      type: "setName";
      name: string;
    }
  | {
      type: "setStep";
      step: LoginWizardStep;
    };

type LoginWizardState = {
  email: string;
  name: string;
  step: LoginWizardStep;
};

const defaultState: LoginWizardState = {
  email: "",
  name: "",
  step: "menu",
};

function loginWizardReducer(
  state: LoginWizardState,
  action: LoginWizardAction,
): LoginWizardState {
  switch (action.type) {
    case "login": {
      return {
        ...state,
        email: action.email,
        step: "login-otp",
      };
    }
    case "signup":
      return {
        ...state,
        email: action.email,
        step: "signup-name",
      };
    case "setName":
      return {
        ...state,
        name: action.name,
        step: "signup-otp",
      };
    case "setStep":
      return {
        ...state,
        step: action.step,
      };
  }
}

type LoginWizardProps = {
  onContinueWithOAuth: (providerId: string) => void;
  providers: {
    id: string;
    name: string;
  }[];
  onLogin: (email: string, otp: string) => Promise<{ error?: string } | void>;
  onLoginRequest: (email: string) => Promise<{ error?: string } | void>;
};

const LoginWizardPropsContext = React.createContext<LoginWizardProps | null>(
  null,
);

export function useLoginWizardProps() {
  const context = React.useContext(LoginWizardPropsContext);
  if (!context) {
    throw new Error(
      "useLoginWizardProps must be used within a LoginWizardPropsProvider",
    );
  }

  return context;
}

const LoginWizardStateContext = React.createContext<{
  state: LoginWizardState;
  dispatch: React.Dispatch<LoginWizardAction>;
}>({
  state: defaultState,
  dispatch: () => {},
});

export function LoginWizard(props: LoginWizardProps) {
  const [state, dispatch] = React.useReducer(loginWizardReducer, defaultState);
  return (
    <LoginWizardPropsContext.Provider value={props}>
      <LoginWizardStateContext.Provider
        value={{
          state,
          dispatch: dispatch,
        }}
      >
        <LoginWizardStep step="menu">
          <LoginMenu />
        </LoginWizardStep>
        <LoginWizardStep step="login-otp">
          <LoginOtp />
        </LoginWizardStep>
        <LoginWizardStep step="signup-name">
          <SignUpName />
        </LoginWizardStep>
        <LoginWizardStep step="signup-otp">
          <SignUpOtp />
        </LoginWizardStep>
      </LoginWizardStateContext.Provider>
    </LoginWizardPropsContext.Provider>
  );
}

export function useLoginWizard() {
  return React.useContext(LoginWizardStateContext);
}

export function LoginWizardStep({
  step,
  children,
}: {
  step: LoginWizardStep;
  children: React.ReactNode;
}) {
  const { state } = useLoginWizard();
  if (step === state.step) {
    return <>{children}</>;
  }
  return null;
}
