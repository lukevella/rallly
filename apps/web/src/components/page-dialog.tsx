import { Container } from "@/components/container";
import type { IconComponent } from "@/types";

export const PageDialog = (
  props: React.PropsWithChildren<{ icon?: IconComponent }>,
) => {
  return (
    <Container className="flex h-[calc(75vh)] items-center justify-center">
      <div className="text-center">
        {props.icon ? (
          <props.icon className="inline-block size-14 text-primary" />
        ) : null}
        {props.children}
      </div>
    </Container>
  );
};

export const PageDialogContent = (props: React.PropsWithChildren) => {
  return <div className="mt-4 mb-6">{props.children}</div>;
};

export const PageDialogHeader = (props: React.PropsWithChildren) => {
  return <div className="mt-4 mb-6 space-y-2">{props.children}</div>;
};

export const PageDialogFooter = (props: React.PropsWithChildren) => {
  return (
    <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
      {props.children}
    </div>
  );
};
export const PageDialogTitle = (props: React.PropsWithChildren) => {
  return <h1 className="font-bold text-2xl">{props.children}</h1>;
};

export const PageDialogDescription = (props: React.PropsWithChildren) => {
  return (
    <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
      {props.children}
    </p>
  );
};
