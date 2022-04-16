import React from "react";

import ErrorPage from "@/components/error-page";
import DocumentSearch from "@/components/icons/document-search.svg";

const Custom404: React.VoidFunctionComponent = () => {
  return (
    <ErrorPage
      icon={DocumentSearch}
      title="404 not found"
      description="We couldn't find the page you're looking for."
    />
  );
};

export default Custom404;
