"use client";
import { Avatar, AvatarFallback } from "@rallly/ui/avatar";
import Image from "next/image";

import { useUser } from "@/components/user-provider";

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
        <Image
          src={`/api/storage/${user.image}`}
          width={128}
          height={128}
          alt={user.name}
          style={{ objectFit: "cover" }}
          objectFit="cover"
        />
      ) : (
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      )}
    </Avatar>
  );
};
