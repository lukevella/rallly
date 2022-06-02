import noop from "lodash/noop";
import React from "react";

export const PollContext = React.createContext<{
  activeOptionId: string | null;
  setActiveOptionId: (optionId: string | null) => void;
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
  columnWidth: number;
  sidebarWidth: number;
  numberOfColumns: number;
  availableSpace: number | string;
  actionColumnWidth: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}>({
  activeOptionId: null,
  setActiveOptionId: noop,
  scrollPosition: 0,
  setScrollPosition: noop,
  columnWidth: 100,
  sidebarWidth: 200,
  numberOfColumns: 0,
  availableSpace: "auto",
  goToNextPage: noop,
  goToPreviousPage: noop,
  actionColumnWidth: 0,
});

export const usePollContext = () => React.useContext(PollContext);
