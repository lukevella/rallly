import Head from "next/head";

const Maintenance: React.FunctionComponent = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>Down for maintenance - Be right back</title>
      </Head>
      <div className="w-96 rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="">
          The site is currently down for some maintenance and will be back
          shortly…
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
