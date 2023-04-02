import { withSessionSsr } from "@rallly/backend/server/session";
import { NextPage } from "next";

const Page: NextPage = () => {
  return null;
};

export const getServerSideProps = withSessionSsr(async (ctx) => {
  ctx.req.session.destroy();
  return {
    redirect: {
      destination: ctx.req.headers.referer ?? "/login",
      permanent: false,
    },
  };
});

export default Page;
