import { NextPage } from "next";

import { withSessionSsr } from "../utils/auth";

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
