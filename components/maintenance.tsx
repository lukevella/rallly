import { NextPage } from "next";
import Head from "next/head";

import Clock from "@/components/icons/clock.svg";

import Logo from "../public/logo.svg";

const Maintenance: NextPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>Down for maintenance - Be right back</title>
      </Head>
      <div className="w-96 rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="mb-4">
          <Clock className="inline-block h-20 text-indigo-500" />
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
