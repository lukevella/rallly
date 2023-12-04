import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-72">
      <Spinner className="text-muted-foreground" />
    </div>
  );
}
