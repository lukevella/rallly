import { trpc } from "@rallly/backend";
import { withAuth, withSessionSsr } from "@rallly/backend/next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/button";
import { getProfileLayout } from "@/components/layouts/profile-layout";
import { TextInput } from "@/components/text-input";
import { Trans } from "@/components/trans";
import { CurrentUserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { NextPageWithLayout } from "@/types";
import { requiredString, validEmail } from "@/utils/form-validation";
import { usePostHog } from "@/utils/posthog";
import { withPageTranslations } from "@/utils/with-page-translations";

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
        <div>
          <Link className="btn-default" href="/logout">
            <Trans i18nKey="logout" defaults="Logout" />
          </Link>
        </div>
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

const Page: NextPageWithLayout = () => {
  const { user } = useUser();

  const { t } = useTranslation();

  const router = useRouter();

  React.useEffect(() => {
    if (user.isGuest) {
      router.push("/profile");
    }
  }, [router, user.isGuest]);

  if (user.isGuest) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          {t("profileUser", {
            username: user.name,
          })}
        </title>
      </Head>
      <UserDetails userId={user.id} name={user.name} email={user.email} />
    </>
  );
};

Page.getLayout = getProfileLayout;

export const getServerSideProps = withSessionSsr([
  withAuth,
  withPageTranslations(),
]);

export default Page;
