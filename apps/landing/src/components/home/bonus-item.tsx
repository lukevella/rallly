"use client";
import { cn } from "@rallly/ui";
import { motion } from "framer-motion";

export const BonusItem = ({
  className,
  children,
  delay = 0,
  icon,
}: React.PropsWithChildren<{
  className?: string;
  delay?: number;
  icon: React.ReactNode;
}>) => {
  return (
    <motion.div
      transition={{
        delay,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "all" }}
      className="flex justify-center"
    >
      <div className="flex items-center justify-center gap-x-2.5 rounded-full border bg-gray-50 p-1 pr-6 shadow-sm">
        <span
          className={cn("bg-primary rounded-full p-2 text-gray-50", className)}
        >
          {icon}
        </span>
        <div className="text-sm font-semibold">{children}</div>
      </div>
    </motion.div>
  );
};
