"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";
import Image from "next/image";

import { useUser } from "@/components/user-provider";

function getAvatarUrl(imageKey: string) {
  // Some users have avatars that come from external providers (e.g. Google).
  if (imageKey.startsWith("https://")) {
    return imageKey;
  }

  return `/api/storage/${imageKey}`;
}

export const CurrentUserAvatar = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => {
  const { user } = useUser();
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {user.image ? (
        user.image.startsWith("http") ? (
          <AvatarImage src={user.image} />
        ) : (
          <Image
            src={getAvatarUrl(user.image)}
            width={128}
            height={128}
            alt={user.name}
            style={{ objectFit: "cover" }}
            objectFit="cover"
          />
        )
      ) : (
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      )}
    </Avatar>
  );
};
