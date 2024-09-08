"use client";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
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
    <OptimizedAvatarImage
      className={className}
      src={user.image ?? undefined}
      name={user.name}
      size={size}
    />
  );
};
