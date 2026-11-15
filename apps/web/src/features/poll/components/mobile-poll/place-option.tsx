import { ExternalLinkIcon } from "lucide-react";
import type * as React from "react";

import type { PollOptionProps } from "./poll-option";
import PollOption from "./poll-option";

export interface PlaceOptionProps extends PollOptionProps {
  name: string;
  address: string | null;
  url: string | null;
}

const PlaceOption: React.FunctionComponent<PlaceOptionProps> = ({
  name,
  address,
  url,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      <div className="min-w-0 text-sm">
        <div className="truncate font-medium">{name}</div>
        {address ? (
          <div className="truncate text-muted-foreground text-xs">
            {address}
          </div>
        ) : null}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
          >
            <ExternalLinkIcon className="size-3" />
            {new URL(url).hostname}
          </a>
        ) : null}
      </div>
    </PollOption>
  );
};

export default PlaceOption;
