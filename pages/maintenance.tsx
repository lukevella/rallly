import { GetStaticProps, NextPage } from "next";

import Logo from "../public/logo.svg";
import { isInMaintenanceMode } from "../utils/constants";

const Maintenance: NextPage = () => {
  return (
    <div className="h-full bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white text-center p-8 rounded-lg border shadow-sm w-96">
        <Logo className="h-8 inline-block text-indigo-500 mb-4" />
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
