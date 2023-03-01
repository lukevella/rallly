import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { usePoll } from "../../poll-context";
import { normalizeVotes } from "../mutations";
import { ParticipantForm, ParticipantFormSubmitted } from "../types";
import UserAvatar from "../user-avatar";
import { VoteSelector } from "../vote-selector";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

export interface ParticipantRowFormProps {
  name?: string;
  defaultValues?: Partial<ParticipantForm>;
  onSubmit: (data: ParticipantFormSubmitted) => Promise<void>;
  className?: string;
  isYou?: boolean;
  onCancel?: () => void;
}

const ParticipantRowForm: React.ForwardRefRenderFunction<
  HTMLFormElement,
  ParticipantRowFormProps
> = ({ defaultValues, onSubmit, name, isYou, className, onCancel }, ref) => {
  const { t } = useTranslation("app");
  const {
    columnWidth,
    scrollPosition,
    sidebarWidth,
    numberOfColumns,
    goToNextPage,
  } = usePollContext();

  const { options, optionIds } = usePoll();
  const { handleSubmit, control } = useForm({
    defaultValues: {
      votes: [],
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    });
  }, [onCancel]);

  const isColumnVisible = (index: number) => {
    return scrollPosition + numberOfColumns * columnWidth > columnWidth * index;
  };

  const checkboxRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <form
      id="participant-row-form"
      ref={ref}
      onSubmit={handleSubmit(async ({ votes }) => {
        await onSubmit({
          votes: normalizeVotes(optionIds, votes),
        });
      })}
      className={clsx("flex h-12 shrink-0", className)}
    >
      <div className="flex items-center px-3" style={{ width: sidebarWidth }}>
        <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
      </div>
      <Controller
        control={control}
        name="votes"
        render={({ field }) => {
          return (
            <ControlledScrollArea>
              {options.map(({ optionId }, index) => {
                const value = field.value[index];

                return (
                  <div
                    key={optionId}
                    className="flex shrink-0 items-center justify-center p-1"
                    style={{ width: columnWidth }}
                  >
                    <VoteSelector
                      className="h-full w-full"
                      value={value?.type}
                      onKeyDown={(e) => {
                        if (
                          e.code === "Tab" &&
                          index < options.length - 1 &&
                          !isColumnVisible(index + 1)
                        ) {
                          e.preventDefault();
                          goToNextPage();
                          setTimeout(() => {
                            checkboxRefs.current[index + 1]?.focus();
                          }, 100);
                        }
                      }}
                      onChange={(vote) => {
                        const newValue = [...field.value];
                        newValue[index] = { optionId, type: vote };
                        field.onChange(newValue);
                      }}
                      ref={(el) => {
                        checkboxRefs.current[index] = el;
                      }}
                    />
                  </div>
                );
              })}
            </ControlledScrollArea>
          );
        }}
      />
    </form>
  );
};

export default React.forwardRef(ParticipantRowForm);
