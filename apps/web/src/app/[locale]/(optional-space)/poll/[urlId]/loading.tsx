import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Spinner />
    </div>
  );
}
