import { NextPage } from "next";

import { Profile } from "../components/profile";
import StandardLayout from "../components/standard-layout";

const Page: NextPage = () => {
  return (
    <StandardLayout>
      <Profile />
    </StandardLayout>
  );
};

export default Page;
