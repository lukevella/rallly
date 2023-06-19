import { Container } from "@/components/container";
import { IconComponent } from "@/types";

export const PageDialog = (
  props: React.PropsWithChildren<{ icon?: IconComponent }>,
) => {
  return (
    <Container className="flex h-[calc(75vh)] items-center justify-center">
      <div className="text-center">
        {props.icon ? (
          <p className="text-primary text-base font-semibold">
            <props.icon className="inline-block h-14 w-14" />
          </p>
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
    <div className="mt-6 flex flex-col items-center justify-center gap-y-4 gap-x-4 sm:flex-row">
      {props.children}
    </div>
  );
};
export const PageDialogTitle = (props: React.PropsWithChildren) => {
  return <h1 className="text-3xl">{props.children}</h1>;
};

export const PageDialogDescription = (props: React.PropsWithChildren) => {
  return (
    <p className="max-w-xl text-base leading-relaxed text-gray-600">
      {props.children}
    </p>
  );
};
