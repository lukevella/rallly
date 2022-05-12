import { Option } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import CompactButton from "@/components/compact-button";
import Check from "@/components/icons/check.svg";
import X from "@/components/icons/x.svg";

import { requiredString } from "../../../utils/form-validation";
import Button from "../../button";
import NameInput from "../../name-input";
import { ParticipantForm } from "../types";
import { VoteSelector } from "../vote-selector";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

export interface ParticipantRowFormProps {
  defaultValues?: Partial<ParticipantForm>;
  onSubmit: (data: ParticipantForm) => Promise<void>;
  className?: string;
  options: Option[];
  onCancel?: () => void;
}

const ParticipantRowForm: React.ForwardRefRenderFunction<
  HTMLFormElement,
  ParticipantRowFormProps
> = ({ defaultValues, onSubmit, className, options, onCancel }, ref) => {
  const {
    setActiveOptionId,
    activeOptionId,
    columnWidth,
    scrollPosition,
    sidebarWidth,
    numberOfColumns,
    goToNextPage,
    setScrollPosition,
  } = usePollContext();

  const {
    handleSubmit,
    control,
    formState: { errors, submitCount, isSubmitting },
    reset,
  } = useForm<ParticipantForm>({
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
      ref={ref}
      onSubmit={handleSubmit(async ({ name, votes }) => {
        await onSubmit({
          name,
          // no need to create votes for "no"
          votes,
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
                autoFocus={true}
                className={clsx("w-full", {
                  "input-error animate-wiggle": errors.name && submitCount > 0,
                })}
                placeholder="Your name"
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
              {options.map((option, index) => {
                const value = field.value[index];

                return (
                  <div
                    key={option.id}
                    className={clsx(
                      "flex shrink-0 items-center justify-center transition-colors",
                      {
                        "bg-gray-50": activeOptionId === option.id,
                      },
                    )}
                    style={{ width: columnWidth }}
                    onMouseOver={() => setActiveOptionId(option.id)}
                    onMouseOut={() => setActiveOptionId(null)}
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
                        newValue[index] = { optionId: option.id, type: vote };
                        field.onChange(newValue);
                      }}
                      ref={(el) => {
                        checkboxRefs.current[index] = el;
                      }}
                      onFocus={() => {
                        setActiveOptionId(option.id);
                      }}
                    />
                  </div>
                );
              })}
            </ControlledScrollArea>
          );
        }}
      />

      <div className="flex items-center space-x-2 px-2 transition-all">
        <Button
          htmlType="submit"
          icon={<Check />}
          type="primary"
          loading={isSubmitting}
          data-testid="submitNewParticipant"
        >
          Save
        </Button>
        <CompactButton onClick={onCancel} icon={X} />
      </div>
    </form>
  );
};

export default React.forwardRef(ParticipantRowForm);
