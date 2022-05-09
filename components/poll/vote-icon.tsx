import { VoteType } from "@prisma/client";
import * as React from "react";

import CheckCircle from "@/components/icons/check-circle.svg";
import IfNeedBe from "@/components/icons/if-need-be.svg";

const VoteIcon: React.VoidFunctionComponent<{
  type?: VoteType;
}> = ({ type }) => {
  switch (type) {
    case "yes":
      return <CheckCircle className="h-5 w-5 text-green-400" />;

    case "ifNeedBe":
      return <IfNeedBe className="h-5 w-5 text-yellow-400" />;

    default:
      return (
        <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
      );
  }
};

export default VoteIcon;
