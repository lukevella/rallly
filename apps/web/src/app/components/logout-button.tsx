import { Button, ButtonProps } from "@rallly/ui/button";

export function LogoutButton({
  children,
  ...rest
}: React.PropsWithChildren<ButtonProps>) {
  return (
    <form action="/auth/logout" method="POST">
      <Button {...rest} type="submit">
        {children}
      </Button>
    </form>
  );
}
