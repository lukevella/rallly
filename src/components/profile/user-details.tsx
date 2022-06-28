import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { requiredString, validEmail } from "../../utils/form-validation";
import { trpc } from "../../utils/trpc";
import { Button } from "../button";
import { useSession } from "../session";
import { TextInput } from "../text-input";

export interface UserDetailsProps {
  userId: string;
  name?: string;
  email?: string;
}

const MotionButton = motion(Button);

export const UserDetails: React.VoidFunctionComponent<UserDetailsProps> = ({
  userId,
  name,
  email,
}) => {
  const { t } = useTranslation("app");
  const { register, formState, handleSubmit, reset } = useForm<{
    name: string;
    email: string;
  }>({
    defaultValues: { name, email },
  });

  const { refresh } = useSession();

  const changeName = trpc.useMutation("user.changeName", {
    onSuccess: () => {
      refresh();
    },
  });

  const { dirtyFields } = formState;
  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        if (dirtyFields.name) {
          await changeName.mutateAsync({ userId, name: data.name });
        }
        reset(data);
      })}
      className="card mb-4 p-0"
    >
      <div className="flex items-center justify-between border-b p-4 shadow-sm">
        <div className="text-lg text-slate-700 ">{t("yourDetails")}</div>
        <MotionButton
          variants={{
            hidden: { opacity: 0, x: 10 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.1 }}
          initial="hidden"
          animate={formState.isDirty ? "visible" : "hidden"}
          htmlType="submit"
          loading={formState.isSubmitting}
          type="primary"
        >
          {t("save")}
        </MotionButton>
      </div>
      <div className="divide-y">
        <div className="flex p-4 pr-8">
          <label htmlFor="name" className="w-1/3 text-slate-500">
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
          <label htmlFor="random-8904" className="w-1/3 text-slate-500">
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
    </form>
  );
};
