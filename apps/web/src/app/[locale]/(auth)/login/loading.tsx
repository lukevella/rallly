import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex h-72 items-center justify-center">
      <Spinner className="text-muted-foreground" />
    </div>
  );
}
