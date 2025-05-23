"use client";

import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { changeRole } from "./actions";

export function UserRoleSelect({
  role,
  userId,
}: {
  role: "admin" | "user";
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticRole, setOptimisticRole] = useOptimistic(role);
  return (
    <Select
      disabled={isPending}
      value={optimisticRole}
      onValueChange={async (value) => {
        startTransition(() => {
          setOptimisticRole(value as "admin" | "user");
          changeRole({ userId, role: value as "admin" | "user" });
          router.refresh();
        });
      }}
    >
      <SelectTrigger asChild>
        <Button variant="ghost" size="sm">
          <SelectValue placeholder="Select a role" />
        </Button>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <Trans i18nKey="admin" defaults="Admin" />
        </SelectItem>
        <SelectItem value="user">
          <Trans i18nKey="user" defaults="User" />
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
