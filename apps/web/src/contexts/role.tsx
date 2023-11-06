import { usePathname } from "next/navigation";

export const useRole = () => {
  const pathname = usePathname();
  return pathname?.includes("/poll") ? "admin" : "participant";
};
