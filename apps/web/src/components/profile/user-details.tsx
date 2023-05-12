import { trpc } from "@rallly/backend";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { usePostHog } from "@/utils/posthog";

import { requiredString, validEmail } from "../../utils/form-validation";
import { Button } from "../button";
import { TextInput } from "../text-input";

export interface UserDetailsProps {
  userId: string;
  name?: string;
  email?: string;
}

export const UserDetails: React.FunctionComponent<UserDetailsProps> = ({
  userId,
  name,
  email,
}) => {
  const { t } = useTranslation();
  const { register, formState, handleSubmit, reset } = useForm<{
    name: string;
    email: string;
  }>({
    defaultValues: { name, email },
  });

  const posthog = usePostHog();
  const { user } = useUser();
  const queryClient = trpc.useContext();
  const changeName = trpc.user.changeName.useMutation({
    onSuccess: (_, { name }) => {
      queryClient.whoami.invalidate();
      reset({ name, email });
      posthog?.people.set({ name });
    },
  });

  const { dirtyFields } = formState;
  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        if (dirtyFields.name) {
          await changeName.mutateAsync({ userId, name: data.name });
        }
      })}
    >
      <div className="flex items-center gap-4 border-b p-4">
        <CurrentUserAvatar />
        <div className="font-semibold text-gray-700 ">{user.name}</div>
      </div>
      <div className="divide-y">
        <div className="flex p-4 pr-8">
          <label htmlFor="name" className="mb-1 w-1/3 text-gray-500">
            {t("name")}
          </label>
          <div className="w-2/3">
            <TextInput
              id="name"
              className="input w-full"
              placeholder="Jessie"
              readOnly={formState.isSubmitting}
              error={!!formState.errors.name}
              {...register("name", {
                validate: requiredString,
              })}
            />
            {formState.errors.name ? (
              <div className="mt-1 text-sm text-rose-500">
                {t("requiredNameError")}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex p-4 pr-8">
          <label htmlFor="random-8904" className="mb-1 w-1/3 text-gray-500">
            {t("email")}
          </label>
          <div className="w-2/3">
            <TextInput
              id="random-8904"
              className="input w-full"
              placeholder="jessie.jackson@example.com"
              disabled={true}
              {...register("email", { validate: validEmail })}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t p-3">
        <Button
          disabled={!formState.isDirty}
          htmlType="submit"
          loading={formState.isSubmitting}
          type="primary"
        >
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
