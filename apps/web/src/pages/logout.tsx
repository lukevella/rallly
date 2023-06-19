import { withSessionSsr } from "@rallly/backend/next";
import { NextPage } from "next";

const Page: NextPage = () => {
  return null;
};

export const getServerSideProps = withSessionSsr(async (ctx) => {
  ctx.req.session.destroy();
  return {
    redirect: {
      destination: ctx.req.headers.referer ?? "/polls",
      permanent: false,
    },
  };
});

export default Page;
