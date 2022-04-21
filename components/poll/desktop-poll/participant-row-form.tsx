import { Option } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import CheckCircle from "@/components/icons/check-circle.svg";

import { requiredString } from "../../../utils/form-validation";
import Button from "../../button";
import NameInput from "../../name-input";
import Tooltip from "../../tooltip";
import { ParticipantForm } from "../types";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

export interface ParticipantRowFormProps {
  defaultValues?: Partial<ParticipantForm>;
  onSubmit: (data: ParticipantForm) => Promise<void>;
  className?: string;
  options: Option[];
  onCancel?: () => void;
}

const ParticipantRowForm: React.VoidFunctionComponent<ParticipantRowFormProps> =
  ({ defaultValues, onSubmit, className, options, onCancel }) => {
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
      register,
      control,
      formState: { errors, submitCount, isSubmitting },
      reset,
    } = useForm<ParticipantForm>({
      defaultValues: { name: "", votes: [], ...defaultValues },
    });

    const isColumnVisible = (index: number) => {
      return (
        scrollPosition + numberOfColumns * columnWidth > columnWidth * index
      );
    };

    const checkboxRefs = React.useRef<HTMLInputElement[]>([]);
    const isAnimatingRef = React.useRef(false);
    // This hack is necessary because when there is only one checkbox,
    // react-hook-form does not know to format the value into an array.
    // See: https://github.com/react-hook-form/react-hook-form/issues/7834

    const checkboxProps = register("votes", {
      onBlur: () => setActiveOptionId(null),
    });

    const checkboxGroupHack = (
      <input type="checkbox" className="hidden" {...checkboxProps} />
    );

    return (
      <form
        onSubmit={handleSubmit(async ({ name, votes }) => {
          await onSubmit({
            name,
            // if there is only one checkbox then we get a string rather than array
            // See this issue with using dot notation: https://github.com/react-hook-form/react-hook-form/issues/7834
            votes: Array.isArray(votes) ? votes : [votes],
          });
          reset();
        })}
        className={clsx("flex h-14 shrink-0", className)}
      >
        {checkboxGroupHack}
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
                    "input-error animate-wiggle":
                      errors.name && submitCount > 0,
                  })}
                  placeholder="Your name"
                  {...field}
                  onKeyDown={(e) => {
                    if (e.code === "Tab" && scrollPosition > 0) {
                      e.preventDefault();
                      setScrollPosition(0);
                      setTimeout(() => {
                        checkboxRefs.current[0].focus();
                      }, 100);
                    }
                  }}
                />
              </div>
            )}
            control={control}
          />
        </div>
        <ControlledScrollArea>
          {options.map((option, index) => {
            return (
              <div
                key={option.id}
                className={clsx(
                  "flex shrink-0 items-center justify-center transition-colors",
                  {
                    "bg-slate-50": activeOptionId === option.id,
                  },
                )}
                style={{ width: columnWidth }}
                onMouseOver={() => setActiveOptionId(option.id)}
                onMouseOut={() => setActiveOptionId(null)}
              >
                <input
                  className="checkbox"
                  type="checkbox"
                  value={option.id}
                  onKeyDown={(e) => {
                    if (isAnimatingRef.current) {
                      return e.preventDefault();
                    }
                    if (
                      e.code === "Tab" &&
                      index < options.length - 1 &&
                      !isColumnVisible(index + 1)
                    ) {
                      isAnimatingRef.current = true;
                      e.preventDefault();
                      goToNextPage();
                      setTimeout(() => {
                        checkboxRefs.current[index + 1].focus();
                        isAnimatingRef.current = false;
                      }, 100);
                    }
                  }}
                  {...checkboxProps}
                  ref={(el) => {
                    if (el) {
                      checkboxRefs.current[index] = el;
                      checkboxProps.ref(el);
                    }
                  }}
                  onFocus={() => {
                    setActiveOptionId(option.id);
                  }}
                />
              </div>
            );
          })}
        </ControlledScrollArea>
        <div className="flex items-center space-x-2 px-2 transition-all">
          <Tooltip content="Save" placement="top">
            <Button
              htmlType="submit"
              icon={<CheckCircle />}
              type="primary"
              loading={isSubmitting}
              data-testid="submitNewParticipant"
            />
          </Tooltip>
          <Button onClick={onCancel} type="default">
            Cancel
          </Button>
        </div>
      </form>
    );
  };

export default ParticipantRowForm;
