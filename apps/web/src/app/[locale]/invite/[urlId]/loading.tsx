import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}
