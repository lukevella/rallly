import { GetServerSideProps } from "next";

export function composeGetServerSideProps(
  ...fns: GetServerSideProps[]
): GetServerSideProps {
  return async (ctx) => {
    const res = { props: {} };
    for (const getServerSideProps of fns) {
      const fnRes = await getServerSideProps(ctx);

      if ("notFound" in fnRes) {
        return fnRes;
      }

      if ("redirect" in fnRes) {
        return fnRes;
      }

      if ("props" in fnRes) {
        res.props = {
          ...res.props,
          ...fnRes.props,
        };
      }
    }

    return res;
  };
}
