"use client";

import { PayWall } from "@/components/pay-wall";
import { NextPageWithLayout } from "@/types";

import { FinalizationForm } from "./finalize-form";

const Page: NextPageWithLayout = () => {
  return (
    <PayWall>
      <FinalizationForm />
    </PayWall>
  );
};

export default Page;
