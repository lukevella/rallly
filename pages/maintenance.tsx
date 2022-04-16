import { GetStaticProps, NextPage } from "next";

import Logo from "../public/logo.svg";
import { isInMaintenanceMode } from "../utils/constants";

const Maintenance: NextPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
      <div className="w-96 rounded-lg border bg-white p-8 text-center shadow-sm">
        <Logo className="mb-4 inline-block h-8 text-indigo-500" />
        <div className="">
          The site is currently under maintenance and will be back shortly…
        </div>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = () => {
  if (isInMaintenanceMode) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
    };
  }
  return { props: {} };
};

export default Maintenance;
