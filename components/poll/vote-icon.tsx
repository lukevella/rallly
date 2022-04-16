import * as React from "react";

import CheckCircle from "@/components/icons/check-circle.svg";

const VoteIcon: React.VoidFunctionComponent<{
  type: "yes" | "no";
}> = ({ type }) => {
  if (type === "yes") {
    return <CheckCircle className="h-5 w-5 text-green-400" />;
  }
  return <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />;
};

export default VoteIcon;
