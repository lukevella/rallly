import { Dialog, DialogContent } from "@rallly/ui/dialog";
import React from "react";

import { LoginForm, RegisterForm } from "./login-form";

export const LoginModal: React.FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const [hasAccount, setHasAccount] = React.useState(false);
  const [defaultEmail, setDefaultEmail] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div
          data-testid="login-modal"
          className="border-t-primary max-w-full overflow-hidden border-t-4 shadow-sm"
        >
          <div className="p-4 sm:p-6">
            {hasAccount ? (
              <RegisterForm
                defaultValues={{ email: defaultEmail }}
                onRegistered={() => onOpenChange(false)}
                onClickLogin={(e) => {
                  e.preventDefault();
                  setHasAccount(false);
                }}
              />
            ) : (
              <LoginForm
                onAuthenticated={() => onOpenChange(false)}
                onClickRegister={(e, email) => {
                  e.preventDefault();
                  setDefaultEmail(email);
                  setHasAccount(true);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const LoginModalProvider = ({ children }: React.PropsWithChildren) => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "A" && target.getAttribute("href") === "/login") {
        // Handle the click event here
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);
  return (
    <>
      <LoginModal open={open} onOpenChange={setOpen} />
      {children}
    </>
  );
};
