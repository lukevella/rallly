import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { usePoll } from "../../poll-context";
import { ParticipantForm, ParticipantFormSubmitted } from "../types";
import UserAvatar, { YouAvatar } from "../user-avatar";
import { VoteSelector } from "../vote-selector";
import { usePollContext } from "./poll-context";

export interface ParticipantRowFormProps {
  name?: string;
  defaultValues?: Partial<ParticipantForm>;
  onSubmit: (data: ParticipantFormSubmitted) => Promise<void>;
  className?: string;
  isYou?: boolean;
  onCancel?: () => void;
}

// const ParticipantRowForm: React.ForwardRefRenderFunction<
//   HTMLFormElement,
//   ParticipantRowFormProps
// > = ({ defaultValues, onSubmit, name, isYou, className, onCancel }, ref) => {
//   const { t } = useTranslation();
//   const {
//     columnWidth,
//     scrollPosition,
//     sidebarWidth,
//     numberOfColumns,
//     goToNextPage,
//   } = usePollContext();

//   const { optionIds } = usePoll();
//   const { handleSubmit, control } = useForm({
//     defaultValues: {
//       votes: [],
//       ...defaultValues,
//     },
//   });

//   React.useEffect(() => {
//     window.addEventListener("keydown", (e) => {
//       if (e.key === "Escape") {
//         onCancel?.();
//       }
//     });
//   }, [onCancel]);

//   const isColumnVisible = (index: number) => {
//     return scrollPosition + numberOfColumns * columnWidth > columnWidth * index;
//   };

//   const checkboxRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

//   return (
//     <form
//       id="participant-row-form"
//       ref={ref}
//       onSubmit={handleSubmit(async ({ votes }) => {
//         await onSubmit({
//           votes: normalizeVotes(optionIds, votes),
//         });
//       })}
//       className={clsx("flex h-12 shrink-0", className)}
//     >
//       <div className="flex items-center px-5" style={{ width: sidebarWidth }}>
//         {name ? (
//           <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
//         ) : (
//           <YouAvatar />
//         )}
//       </div>
//       <Controller
//         control={control}
//         name="votes"
//         render={({ field }) => {
//           return (
//             <ControlledScrollArea>
//               {optionIds.map((optionId, index) => {
//                 const value = field.value[index];

//                 return (
//                   <div
//                     key={optionId}
//                     className="flex shrink-0 items-center justify-center p-1"
//                     style={{ width: columnWidth }}
//                   >
//                     <VoteSelector
//                       className="h-full w-full"
//                       value={value?.type}
//                       onKeyDown={(e) => {
//                         if (
//                           e.code === "Tab" &&
//                           index < optionIds.length - 1 &&
//                           !isColumnVisible(index + 1)
//                         ) {
//                           e.preventDefault();
//                           goToNextPage();
//                           setTimeout(() => {
//                             checkboxRefs.current[index + 1]?.focus();
//                           }, 100);
//                         }
//                       }}
//                       onChange={(vote) => {
//                         const newValue = [...field.value];
//                         newValue[index] = { optionId, type: vote };
//                         field.onChange(newValue);
//                       }}
//                       ref={(el) => {
//                         checkboxRefs.current[index] = el;
//                       }}
//                     />
//                   </div>
//                 );
//               })}
//             </ControlledScrollArea>
//           );
//         }}
//       />
//     </form>
//   );
// };

const ParticipantRowForm: React.ForwardRefRenderFunction<
  HTMLFormElement,
  ParticipantRowFormProps
> = ({ defaultValues, onSubmit, name, isYou, className, onCancel }, ref) => {
  const { t } = useTranslation();
  const {
    columnWidth,
    scrollPosition,
    sidebarWidth,
    numberOfColumns,
    goToNextPage,
  } = usePollContext();

  const { optionIds } = usePoll();

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
    <tr className={cn(className)}>
      <td
        className="sticky left-0 z-10 bg-white/90 pl-4 pr-4 backdrop-blur-sm"
        style={{ minWidth: sidebarWidth }}
      >
        {name ? (
          <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
        ) : (
          <YouAvatar />
        )}
      </td>

      {optionIds.map((optionId, index) => {
        return (
          <td
            key={optionId}
            className="h-12 bg-white p-1"
            style={{ width: columnWidth }}
          >
            <VoteSelector
              className="h-full w-full"
              // value={value?.type}
              onKeyDown={(e) => {
                if (
                  e.code === "Tab" &&
                  index < optionIds.length - 1 &&
                  !isColumnVisible(index + 1)
                ) {
                  e.preventDefault();
                  goToNextPage();
                  setTimeout(() => {
                    checkboxRefs.current[index + 1]?.focus();
                  }, 100);
                }
              }}
              // onChange={(vote) => {
              //   const newValue = [...field.value];
              //   newValue[index] = { optionId, type: vote };
              //   field.onChange(newValue);
              // }}
              // ref={(el) => {
              //   checkboxRefs.current[index] = el;
              // }}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default React.forwardRef(ParticipantRowForm);
