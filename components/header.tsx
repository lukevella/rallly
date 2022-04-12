import { useTranslation } from "next-i18next";
import React from "react";

const Header: React.FunctionComponent<{ className?: string }> = (props) => {
  const { t } = useTranslation();
  return (
    <div
      className="h-10 shrink-0 border-gray-200 px-6 flex items-center"
      {...props}
    >
      <div className="text-base font-bold text-gray-400 uppercase">
        {t("appName")}
      </div>
      <div className="ml-2 text-xs text-gray-400">v2-alpha</div>
    </div>
  );
};

export default Header;
