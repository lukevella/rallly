import dynamic from "next/dynamic";
import React from "react";

const NoSsr = (props: { children?: React.ReactNode }) => (
  <React.Fragment>{props.children}</React.Fragment>
);

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false,
});
