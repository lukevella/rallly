"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";

import { useUser } from "@/components/user-provider";

export const CurrentUserAvatar = ({ className }: { className?: string }) => {
  const { user } = useUser();
  return (
    <Avatar className={className}>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback>{user.name[0]}</AvatarFallback>
    </Avatar>
  );
};
