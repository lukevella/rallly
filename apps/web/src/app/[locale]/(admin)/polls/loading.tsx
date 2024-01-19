import { Skeleton } from "@/components/skeleton";

function Row() {
  return (
    <div className="flex items-center gap-x-4 py-4 first:pt-0">
      <div className="grow">
        <Skeleton className="mb-2 h-5 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="pr-8">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="pr-8">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="pr-8">
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
export default function Loader() {
  return (
    <div className="divide-y divide-gray-100">
      <Row />
      <Row />
      <Row />
      <Row />
    </div>
  );
}
