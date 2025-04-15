import { signOut } from "@/next-auth";

export async function GET() {
  return await signOut({
    redirectTo: "/",
  });
}
