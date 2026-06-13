"use client";

import { Button } from "@rallly/ui/button";
import * as React from "react";

type RegistrationView = "details" | "register" | "success";

type Registration = {
  name: string;
  email: string;
  // Proof of ownership for cancellation. Optional because registrations
  // stored before this field existed don't have it.
  inviteUid?: string;
};

const registrationStorageKey = (eventId: string) =>
  `rallly.event-registration.${eventId}`;

const RegistrationFlowContext = React.createContext<{
  view: RegistrationView;
  setView: (view: RegistrationView) => void;
  registration: Registration | null;
  setRegistration: (registration: Registration) => void;
  clearRegistration: () => void;
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

export function RegistrationFlow({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const [view, setView] = React.useState<RegistrationView>("details");
  const [registration, setRegistrationState] =
    React.useState<Registration | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | "auto">("auto");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(registrationStorageKey(eventId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          typeof parsed?.name === "string" &&
          typeof parsed?.email === "string"
        ) {
          setRegistrationState({
            name: parsed.name,
            email: parsed.email,
            inviteUid:
              typeof parsed?.inviteUid === "string"
                ? parsed.inviteUid
                : undefined,
          });
        }
      }
    } catch {
      // ignore invalid stored values
    }
  }, [eventId]);

  const setRegistration = React.useCallback(
    (registration: Registration) => {
      setRegistrationState(registration);
      try {
        localStorage.setItem(
          registrationStorageKey(eventId),
          JSON.stringify(registration),
        );
      } catch {
        // storage may be unavailable
      }
    },
    [eventId],
  );

  const clearRegistration = React.useCallback(() => {
    setRegistrationState(null);
    try {
      localStorage.removeItem(registrationStorageKey(eventId));
    } catch {
      // storage may be unavailable
    }
  }, [eventId]);

  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setHeight(content.offsetHeight);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const value = React.useMemo(
    () => ({ view, setView, registration, setRegistration, clearRegistration }),
    [view, registration, setRegistration, clearRegistration],
  );

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
