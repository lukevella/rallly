import ErrorPage from "@/components/error-page";
import DocumentSearch from "@/components/icons/document-search.svg";
import React from "react";

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
