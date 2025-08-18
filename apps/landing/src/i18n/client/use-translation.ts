"use client";

import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { i18next } from "../i18next";

export const useT: typeof useTranslation = (ns, options) => {
  const lng = useParams()?.locale;
  if (typeof lng !== "string")
    throw new Error("useT is only available inside /app/[locale]");

  React.useEffect(() => {
    if (!lng || i18next.resolvedLanguage === lng) return;
    i18next.changeLanguage(lng);
  }, [lng]);

  return useTranslation(ns, options);
};

// Export useTranslation for compatibility
export { useTranslation };
