"use client";

import { Badge } from "@rallly/ui/badge";
import { motion } from "framer-motion";

import { Trans } from "@/components/trans";

export function ProBadge() {
  return (
    <motion.div
      transition={{
        delay: 0.2,
        duration: 0.4,
        type: "spring",
        bounce: 0.5,
      }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
      aria-hidden="true"
    >
      <Badge variant="primary">
        <Trans i18nKey="planPro" />
      </Badge>
    </motion.div>
  );
}
