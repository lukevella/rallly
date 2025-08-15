"use client";

import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { UsersIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/components/trans";
import type { MemberDTO } from "@/features/space/member/types";

interface MemberSelectorProps {
  members: MemberDTO[];
}

export function MemberSelector({ members }: MemberSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentMember = searchParams.get("member") || "all";
  const [optimisticMember, setOptimisticMember] = useOptimistic(currentMember);

  const handleMemberChange = (memberId: string) => {
    startTransition(() => {
      // Optimistically update the UI within the transition
      setOptimisticMember(memberId);

      const params = new URLSearchParams(searchParams);
      if (memberId === "all") {
        params.delete("member"); // Remove member param for "all"
      } else {
        params.set("member", memberId);
      }
      params.delete("page"); // Reset pagination when changing member
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <Select
      value={optimisticMember}
      onValueChange={handleMemberChange}
      disabled={isPending}
    >
      <SelectTrigger className="min-w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Icon>
              <UsersIcon />
            </Icon>
            <span>
              <Trans i18nKey="allMembers" defaults="All Members" />
            </span>
          </div>
        </SelectItem>
        {members.map((member) => (
          <SelectItem key={member.userId} value={member.userId}>
            <div className="flex items-center gap-2">
              <OptimizedAvatarImage
                size="sm"
                name={member.name}
                src={member.image}
              />
              <span>{member.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
