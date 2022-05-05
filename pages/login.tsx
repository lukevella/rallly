import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import toast from "react-hot-toast";
import { useTimeoutFn } from "react-use";
import { decryptToken, withSessionSsr } from "utils/auth";
import { nanoid } from "utils/nanoid";

import FullPageLoader from "@/components/full-page-loader";

import { prisma } from "../db";

const Page: NextPage<{ success: boolean; redirectTo: string }> = ({
  success,
  redirectTo,
}) => {
  const router = useRouter();

  useTimeoutFn(() => {
    router.replace(redirectTo);
  }, 1000);

  return (
    <FullPageLoader>
      <Head>
        <title>Logging in</title>
      </Head>
      {success
        ? "Log in successful. Redirecting…"
        : "Your link is invalid or expired. Redirecting…"}
    </FullPageLoader>
  );
};

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async ({ req, query }) => {
    const { code } = query;
    if (typeof code !== "string") {
      return {
        props: {},
        redirect: {
          destination: "/new",
        },
      };
    }
    const { email, path } = await decryptToken<{
      email?: string;
      path?: string;
    }>(code);

    if (!email) {
      return {
        props: {
          success: false,
          redirectTo: path,
        },
      };
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: await nanoid(),
        name: email.substring(0, email.indexOf("@")),
        email,
      },
    });

    // If logged in as guest, we update all participants
    // and comments by this guest to the user that we just authenticated
    if (req.session.user?.isGuest) {
      await prisma.participant.updateMany({
        where: {
          guestId: req.session.user.id,
        },
        data: {
          guestId: null,
          userId: user.id,
        },
      });

      await prisma.comment.updateMany({
        where: {
          guestId: req.session.user.id,
        },
        data: {
          guestId: null,
          userId: user.id,
        },
      });
    }

    req.session.user = {
      isGuest: false,
      name: user.name,
      email: user.email,
      id: user.id,
    };

    await req.session.save();

    return {
      props: {
        success: true,
        redirectTo: path,
      },
    };
  },
);

export default Page;
