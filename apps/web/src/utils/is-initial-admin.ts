import "server-only";

export function isInitialAdmin(email: string) {
  return (
    process.env.INITIAL_ADMIN_EMAIL && email === process.env.INITIAL_ADMIN_EMAIL
  );
}
