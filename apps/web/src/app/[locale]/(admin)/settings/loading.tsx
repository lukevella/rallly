import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Spinner } from "@/components/spinner";

export default async function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <Spinner />
    </>
  );
}
