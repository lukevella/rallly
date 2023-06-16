import { Dialog, DialogContent } from "@rallly/ui/dialog";
import Image from "next/image";
import React from "react";

import { LoginForm, RegisterForm } from "./login-form";

export const LoginModal: React.FunctionComponent<{
  open: boolean;
  defaultView?: "login" | "register";
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange, defaultView = "login" }) => {
  const [newAccount, setNewAccount] = React.useState(
    defaultView === "register",
  );
  const [defaultEmail, setDefaultEmail] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div
          data-testid="login-modal"
          className="border-t-primary max-w-full overflow-hidden border-t-4 shadow-sm"
        >
          <div className="bg-pattern flex justify-center py-8">
            <Image
              src="/static/logo.svg"
              width={140}
              height={30}
              alt="Rallly"
            />
          </div>
          <div className="p-4 sm:p-6">
            {newAccount ? (
              <RegisterForm
                defaultValues={{ email: defaultEmail }}
                onRegistered={() => onOpenChange(false)}
                onClickLogin={(e) => {
                  e.preventDefault();
                  setNewAccount(false);
                }}
              />
            ) : (
              <LoginForm
                onAuthenticated={() => onOpenChange(false)}
                onClickRegister={(e, email) => {
                  e.preventDefault();
                  setDefaultEmail(email);
                  setNewAccount(true);
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
  const [view, setView] = React.useState<"login" | "register">("login");

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const href = target.getAttribute("href");
      if (
        target.tagName === "A" &&
        (href === "/login" || href === "/register")
      ) {
        // Handle the click event here
        event.preventDefault();
        setView(href === "/login" ? "login" : "register");
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
      {open ? (
        <LoginModal open={open} defaultView={view} onOpenChange={setOpen} />
      ) : null}
      {children}
    </>
  );
};
