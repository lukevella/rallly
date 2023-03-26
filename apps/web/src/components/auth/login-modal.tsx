import Link from "next/link";
import React from "react";

import { Logo } from "../logo";
import { useModalContext } from "../modal/modal-provider";
import { useUser } from "../user-provider";
import { LoginForm, RegisterForm } from "./login-form";

export const LoginModal: React.FunctionComponent<{
  onDone: () => void;
}> = ({ onDone }) => {
  const [hasAccount, setHasAccount] = React.useState(false);
  const [defaultEmail, setDefaultEmail] = React.useState("");

  return (
    <div
      data-testid="login-modal"
      className="w-[420px] max-w-full overflow-hidden bg-white shadow-sm"
    >
      <div className="bg-pattern border-t-primary-600 border-b border-t-4 bg-slate-500/5 p-4 text-center sm:p-8">
        <Logo className="text-2xl" />
      </div>
      <div className="p-4 sm:p-6">
        {hasAccount ? (
          <RegisterForm
            defaultValues={{ email: defaultEmail }}
            onRegistered={onDone}
            onClickLogin={(e) => {
              e.preventDefault();
              setHasAccount(false);
            }}
          />
        ) : (
          <LoginForm
            onAuthenticated={onDone}
            onClickRegister={(e, email) => {
              e.preventDefault();
              setDefaultEmail(email);
              setHasAccount(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export const useLoginModal = () => {
  const modalContext = useModalContext();
  const { refresh } = useUser();

  const openLoginModal = () => {
    modalContext.render({
      overlayClosable: false,
      showClose: true,
      content: function Content({ close }) {
        return (
          <LoginModal
            onDone={() => {
              refresh();
              close();
            }}
          />
        );
      },
      footer: null,
    });
  };
  return { openLoginModal };
};

export const LoginLink = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  const { openLoginModal } = useLoginModal();
  return (
    <Link
      href="/login"
      onClick={(e) => {
        e.preventDefault();
        openLoginModal();
      }}
      className={className}
    >
      {children}
    </Link>
  );
};
