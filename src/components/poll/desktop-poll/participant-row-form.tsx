import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import ArrowLeft from "@/components/icons/arrow-left.svg";
import ArrowRight from "@/components/icons/arrow-right.svg";

import { requiredString } from "../../../utils/form-validation";
import { Button } from "../../button";
import NameInput from "../../name-input";
import { usePoll } from "../../poll-context";
import { normalizeVotes } from "../mutations";
import { ParticipantForm, ParticipantFormSubmitted } from "../types";
import { VoteSelector } from "../vote-selector";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

export interface ParticipantRowFormProps {
  defaultValues?: Partial<ParticipantForm>;
  onSubmit: (data: ParticipantFormSubmitted) => Promise<void>;
  className?: string;
  onCancel?: () => void;
}

const ParticipantRowForm: React.ForwardRefRenderFunction<
  HTMLFormElement,
  ParticipantRowFormProps
> = ({ defaultValues, onSubmit, className, onCancel }, ref) => {
  const { t } = useTranslation("app");
  const {
    columnWidth,
    scrollPosition,
    sidebarWidth,
    numberOfColumns,
    goToNextPage,
    goToPreviousPage,
    maxScrollPosition,
    setScrollPosition,
  } = usePollContext();

  const { options, optionIds } = usePoll();
  const {
    handleSubmit,
    control,
    formState: { errors, submitCount },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
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
      onSubmit={handleSubmit(async ({ name, votes }) => {
        await onSubmit({
          name,
          votes: normalizeVotes(optionIds, votes),
        });
        reset();
      })}
      className={clsx("flex h-14 shrink-0", className)}
    >
      <div className="flex items-center px-2" style={{ width: sidebarWidth }}>
        <Controller
          name="name"
          rules={{
            validate: requiredString,
          }}
          render={({ field }) => (
            <div className="w-full">
              <NameInput
                className={clsx("w-full", {
                  "input-error": errors.name && submitCount > 0,
                })}
                placeholder={t("yourName")}
                {...field}
                onKeyDown={(e) => {
                  if (e.code === "Tab" && scrollPosition > 0) {
                    e.preventDefault();
                    setScrollPosition(0);
                    setTimeout(() => {
                      checkboxRefs.current[0]?.focus();
                    }, 100);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.code === "Enter") {
                    e.preventDefault();
                    checkboxRefs.current[0]?.focus();
                  }
                }}
              />
            </div>
          )}
          control={control}
        />
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
                    className="flex shrink-0 items-center justify-center px-2"
                    style={{ width: columnWidth }}
                  >
                    <VoteSelector
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
      {maxScrollPosition > 0 ? (
        <div className="flex items-center space-x-2 px-2 transition-all">
          <Button
            disabled={scrollPosition === 0}
            className="text-xs"
            rounded={true}
            onClick={() => {
              goToPreviousPage();
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            disabled={scrollPosition >= maxScrollPosition}
            className="text-xs"
            rounded={true}
            onClick={() => {
              goToNextPage();
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </form>
  );
};

export default React.forwardRef(ParticipantRowForm);
