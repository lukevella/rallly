import NextLink from "next/link";
import type React from "react";

export type LinkProps = React.ComponentProps<typeof NextLink>;

// Next prefetches every Link that enters the viewport, which bills a server
// render per visible link. Default it off; opt in per link where an instant
// navigation is worth the compute (sidebar nav uses HoverPrefetchLink).
export function Link({ prefetch = false, ...props }: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
