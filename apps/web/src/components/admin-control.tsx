import { ShareIcon } from "@rallly/icons";
import { AnimatePresence, m } from "framer-motion";
import { Trans, useTranslation } from "next-i18next";
import React from "react";

import Sharing from "./sharing";

export const AdminControls = (props: { children?: React.ReactNode }) => {
  return (
    <div className="space-y-4">
      <Sharing />
    </div>
  );
};
