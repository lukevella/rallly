import { useRouter } from "next/router";

export const useRole = () => {
  const router = useRouter();
  return router.asPath.includes("/poll") ? "admin" : "participant";
};
