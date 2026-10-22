import { Link } from "@/components/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RelativeTime } from "@/lib/datetime/relative-time";

/** Overview card's dense response rows; each opens the response. */
export function RecentResponsesList({
  pollId,
  responses,
}: {
  pollId: string;
  responses: {
    id: string;
    name: string;
    image: string | null;
    createdAt: Date;
  }[];
}) {
  return (
    // Pulled out by the rows' own padding so avatars align with the card title
    <ul className="-mx-1.5">
      {responses.map((response) => (
        <li
          key={response.id}
          className="relative flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-accent has-[a:focus-visible]:bg-accent"
        >
          <OptimizedAvatarImage
            size="sm"
            name={response.name}
            src={response.image ?? undefined}
          />
          <Link
            href={`/polls/${pollId}/participants?responseId=${response.id}`}
            scroll={false}
            className="min-w-0 flex-1 truncate outline-none after:absolute after:inset-0"
          >
            {response.name}
          </Link>
          <RelativeTime
            value={response.createdAt}
            className="shrink-0 text-muted-foreground"
          />
        </li>
      ))}
    </ul>
  );
}
