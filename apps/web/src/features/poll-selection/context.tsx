"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useMemo, useState } from "react";

import { useRequiredContext } from "@/components/use-required-context";

import { PollSelectionActionBar } from "./poll-selection-action-bar";

type RowSelectionState = Record<string, boolean>;

type PollSelectionContextType = {
  selectedPolls: RowSelectionState;
  setSelectedPolls: (selection: RowSelectionState) => void;
  selectPolls: (pollIds: string[]) => void;
  unselectPolls: (pollIds: string[]) => void;
  togglePollSelection: (pollId: string) => void;
  clearSelection: () => void;
  isSelected: (pollId: string) => boolean;
  getSelectedPollIds: () => string[];
  selectedCount: number;
};

const PollSelectionContext = createContext<PollSelectionContextType | null>(
  null,
);

type PollSelectionProviderProps = {
  children: ReactNode;
};

export const PollSelectionProvider = ({
  children,
}: PollSelectionProviderProps) => {
  const [selectedPolls, setSelectedPolls] = useState<RowSelectionState>({});

  const selectPolls = useCallback((pollIds: string[]) => {
    setSelectedPolls((prev) => {
      const newSelection = { ...prev };
      pollIds.forEach((id) => {
        newSelection[id] = true;
      });
      return newSelection;
    });
  }, []);

  const unselectPolls = useCallback(
    (pollIds: string[]) =>
      setSelectedPolls((prev) => {
        const newSelection = { ...prev };
        pollIds.forEach((id) => {
          delete newSelection[id];
        });
        return newSelection;
      }),
    [],
  );

  const togglePollSelection = useCallback(
    (pollId: string) =>
      setSelectedPolls((prev) => {
        const newSelection = { ...prev };
        if (newSelection[pollId]) {
          delete newSelection[pollId];
        } else {
          newSelection[pollId] = true;
        }
        return newSelection;
      }),
    [],
  );

  const clearSelection = useCallback(() => setSelectedPolls({}), []);

  const isSelected = useCallback(
    (pollId: string) => Boolean(selectedPolls[pollId]),
    [selectedPolls],
  );

  const getSelectedPollIds = useCallback(
    () => Object.keys(selectedPolls),
    [selectedPolls],
  );

  const selectedCount = useMemo(
    () => Object.keys(selectedPolls).length,
    [selectedPolls],
  );

  const value = useMemo(
    () => ({
      selectedPolls,
      setSelectedPolls,
      selectPolls,
      unselectPolls,
      togglePollSelection,
      clearSelection,
      isSelected,
      getSelectedPollIds,
      selectedCount,
    }),
    [
      selectedPolls,
      setSelectedPolls,
      selectPolls,
      unselectPolls,
      togglePollSelection,
      clearSelection,
      isSelected,
      getSelectedPollIds,
      selectedCount,
    ],
  );

  return (
    <PollSelectionContext.Provider value={value}>
      {children}
      <PollSelectionActionBar />
    </PollSelectionContext.Provider>
  );
};

export const usePollSelection = () => {
  const context = useRequiredContext(
    PollSelectionContext,
    "usePollSelection must be used within a PollSelectionProvider",
  );

  return context;
};
