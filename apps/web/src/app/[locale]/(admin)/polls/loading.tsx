import { Skeleton } from "@/components/skeleton";

function Row() {
  return (
    <div className="flex first:pt-0 py-4 items-center gap-x-4">
      <div className="grow">
        <Skeleton className="w-48 h-5 mb-2" />
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="pr-8">
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="pr-8">
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="pr-8">
        <Skeleton className="w-12 h-4" />
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
