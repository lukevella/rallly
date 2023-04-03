import Clock from "@rallly/icons/clock.svg";
import Head from "next/head";

import Logo from "../../public/logo.svg";

const Maintenance: React.FunctionComponent = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>Down for maintenance - Be right back</title>
      </Head>
      <div className="w-96 rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="mb-4">
          <Clock className="text-primary-600 inline-block h-20" />
        </div>
        <div className="">
          The site is currently down for some maintenance and will be back
          shortly…
        </div>
      </div>
      <Logo className="mt-8 inline-block h-8 text-slate-300" />
    </div>
  );
};

export default Maintenance;
