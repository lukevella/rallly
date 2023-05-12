import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { UserDetails } from "./profile/user-details";
import { useUser } from "./user-provider";

export const Profile: React.FunctionComponent = () => {
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
