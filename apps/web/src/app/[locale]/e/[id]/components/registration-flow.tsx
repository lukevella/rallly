"use client";

import { Button } from "@rallly/ui/button";
import * as React from "react";

type RegistrationView = "details" | "register" | "success";

const RegistrationFlowContext = React.createContext<{
  view: RegistrationView;
  setView: (view: RegistrationView) => void;
} | null>(null);

export function useRegistrationFlow() {
  const context = React.useContext(RegistrationFlowContext);
  if (!context) {
    throw new Error(
      "useRegistrationFlow must be used within a <RegistrationFlow />",
    );
  }
  return context;
}

export function RegistrationFlow({ children }: { children: React.ReactNode }) {
  const [view, setView] = React.useState<RegistrationView>("details");

  const value = React.useMemo(() => ({ view, setView }), [view]);

  return (
    <RegistrationFlowContext.Provider value={value}>
      {children}
    </RegistrationFlowContext.Provider>
  );
}

export function RegistrationFlowView({
  view,
  children,
}: {
  view: RegistrationView;
  children: React.ReactNode;
}) {
  const flow = useRegistrationFlow();
  if (flow.view !== view) {
    return null;
  }
  return <>{children}</>;
}

export function RegistrationFlowTrigger({
  view,
  ...props
}: React.ComponentProps<typeof Button> & { view: RegistrationView }) {
  const flow = useRegistrationFlow();
  return <Button onClick={() => flow.setView(view)} {...props} />;
}

export function RegistrationFlowRedirect({
  view,
  delay = 3000,
}: {
  view: RegistrationView;
  delay?: number;
}) {
  const { setView } = useRegistrationFlow();

  React.useEffect(() => {
    const timeout = setTimeout(() => setView(view), delay);
    return () => clearTimeout(timeout);
  }, [view, delay, setView]);

  return null;
}
