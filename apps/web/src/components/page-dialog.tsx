import { Container } from "@/components/container";
import { IconComponent } from "@/types";

export const PageDialog = (
  props: React.PropsWithChildren<{ icon?: IconComponent }>,
) => {
  return (
    <Container className="flex h-[calc(75vh)] items-center justify-center">
      <div className="text-center">
        {props.icon ? (
          <props.icon className="text-primary inline-block h-14 w-14" />
        ) : null}
        {props.children}
      </div>
    </Container>
  );
};

export const PageDialogContent = (props: React.PropsWithChildren) => {
  return <div className="mb-6 mt-4">{props.children}</div>;
};

export const PageDialogHeader = (props: React.PropsWithChildren) => {
  return <div className="mb-6 mt-4 space-y-2">{props.children}</div>;
};

export const PageDialogFooter = (props: React.PropsWithChildren) => {
  return (
    <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
      {props.children}
    </div>
  );
};
export const PageDialogTitle = (props: React.PropsWithChildren) => {
  return <h1 className="text-2xl font-bold">{props.children}</h1>;
};

export const PageDialogDescription = (props: React.PropsWithChildren) => {
  return (
    <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
      {props.children}
    </p>
  );
};
