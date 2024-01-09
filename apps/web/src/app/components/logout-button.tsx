import { Button } from "@rallly/ui/button";

export function LogoutButton({ children }: React.PropsWithChildren) {
  return (
    <form action="/auth/logout" method="POST">
      <Button variant="ghost" type="submit">
        {children}
      </Button>
    </form>
  );
}
