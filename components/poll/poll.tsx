import clsx from "clsx";
import debounce from "lodash/debounce";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useMeasure } from "react-use";
import { decodeDateOption } from "../../utils/date-time-utils";
import Button from "../button";
import DateCard from "../date-card";
import ArrowLeft from "../icons/arrow-left.svg";
import ArrowRight from "../icons/arrow-right.svg";
import PlusCircle from "../icons/plus-circle.svg";
import TimeZonePicker from "../time-zone-picker";
import { TransitionPopInOut } from "../transitions";
import { useAddParticipantMutation } from "./mutations";
import ParticipantRow from "./participant-row";
import ParticipantRowForm from "./participant-row-form";
import { PollContext, usePollContext } from "./poll-context";
import Score from "./score";
import TimeRange from "./time-range";
import { PollProps } from "./types";
import smoothscroll from "smoothscroll-polyfill";
import { usePoll } from "../use-poll";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

// There's a bug in Safari 15.4 that causes `scroll` to no work as intended
const isSafariV154 =
  typeof window !== "undefined"
    ? /Version\/15.[4-9]\sSafari/.test(navigator.userAgent)
    : false;

export const ControlledScrollDiv: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  className?: string;
}> = ({ className, children }) => {
  const { setScrollPosition, availableSpace, scrollPosition } =
    usePollContext();

  const ref = React.useRef<HTMLDivElement>(null);

  const didSetInitialScrollPosition = React.useRef(false);

  React.useEffect(() => {
    if (ref.current) {
      if (!isSafariV154) {
        ref.current.scroll({
          left: scrollPosition,
          behavior: didSetInitialScrollPosition?.current ? "smooth" : "auto",
        });
      } else {
        ref.current.scrollLeft = scrollPosition;
      }
      didSetInitialScrollPosition.current = true;
    }
  }, [scrollPosition]);

  return (
    <div
      ref={ref}
      className={clsx("flex min-w-0 overflow-hidden", className)}
      style={{ width: availableSpace, maxWidth: availableSpace }}
      onScroll={(e) => {
        const div = e.target as HTMLDivElement;
        setScrollPosition(div.scrollLeft);
      }}
    >
      {children}
    </div>
  );
};

const Poll: React.VoidFunctionComponent<
  PollProps & {
    width?: number;
    sidebarWidth?: number;
    columnWidth?: number;
    actionColumnWidth?: number;
  }
> = ({
  pollId,
  role,
  timeZone,
  options,
  participants,
  highScore,
  targetTimeZone,
  onChangeTargetTimeZone,
  actionColumnWidth = 160,
  sidebarWidth: minSidebarWidth = 200,
  columnWidth: defaultColumnWidth,
  width: defaultWidth,
}) => {
  const { t } = useTranslation("app");

  const [ref, { width: measuredWidth }] = useMeasure<HTMLDivElement>();
  const [editingParticipantId, setEditingParticipantId] =
    React.useState<string | null>(null);

  const width = defaultWidth ?? measuredWidth;
  const columnWidth =
    defaultColumnWidth ??
    Math.min(
      100,
      Math.max(
        95,
        (width - minSidebarWidth - actionColumnWidth) / options.length,
      ),
    );

  const numberOfVisibleColumns = Math.min(
    options.length,
    Math.floor((width - (minSidebarWidth + actionColumnWidth)) / columnWidth),
  );

  const sidebarWidth =
    width - (numberOfVisibleColumns * columnWidth + actionColumnWidth);

  const availableSpace = Math.min(
    numberOfVisibleColumns * columnWidth,
    options.length * columnWidth,
  );

  const [activeOptionId, setActiveOptionId] =
    React.useState<string | null>(null);

  const [scrollPosition, setScrollPosition] = React.useState(0);

  const maxScrollPosition =
    columnWidth * options.length - columnWidth * numberOfVisibleColumns;

  const debouncedSetScrollPosition = React.useMemo(
    () => debounce(setScrollPosition, 200),
    [],
  );

  const numberOfInvisibleColumns = options.length - numberOfVisibleColumns;

  const [didUsePagination, setDidUsePagination] = React.useState(false);

  const [shouldShowNewParticipantForm, setShouldShowNewParticipantForm] =
    React.useState(participants.length === 0);

  const pollWidth =
    sidebarWidth + options.length * columnWidth + actionColumnWidth;

  const { mutate: addParticipant } = useAddParticipantMutation(pollId);

  const goToNextPage = () => {
    debouncedSetScrollPosition(
      Math.min(
        maxScrollPosition,
        scrollPosition + numberOfVisibleColumns * columnWidth,
      ),
    );
  };

  const goToPreviousPage = () => {
    setScrollPosition(
      Math.max(0, scrollPosition - numberOfVisibleColumns * columnWidth),
    );
  };

  const poll = usePoll();

  return (
    <PollContext.Provider
      value={{
        activeOptionId,
        setActiveOptionId,
        scrollPosition,
        setScrollPosition: debouncedSetScrollPosition,
        columnWidth,
        sidebarWidth,
        goToNextPage,
        goToPreviousPage,
        numberOfColumns: numberOfVisibleColumns,
        availableSpace,
        actionColumnWidth,
      }}
    >
      <div
        className="relative max-w-full min-w-full" // Don't add styles like border, margin, padding – that can mess up the sizing calculations
        style={{ width: `min(${pollWidth}px, calc(100vw - 3rem))` }}
        ref={ref}
      >
        <div className="md:rounded-lg shadow-sm bg-white border-t border-b md:border">
          <div className="shadow-sm shadow-slate-50 bg-white/80 backdrop-blur-md rounded-t-lg border-gray-200 border-b sticky top-0 z-10">
            {role !== "readOnly" ? (
              <div className="flex px-4 h-14 items-center justify-end space-x-4 border-b bg-gray-50 rounded-t-lg">
                {timeZone ? (
                  <div className="flex items-center grow">
                    <div className="text-sm mr-2 font-medium text-slate-500">
                      {t("timeZone")}
                    </div>
                    <TimeZonePicker
                      value={targetTimeZone}
                      onChange={onChangeTargetTimeZone}
                      className="grow"
                    />
                  </div>
                ) : null}
                <div className="shrink-0 flex">
                  {!shouldShowNewParticipantForm && !poll.closed ? (
                    <Button
                      type="primary"
                      icon={<PlusCircle />}
                      onClick={() => {
                        setShouldShowNewParticipantForm(true);
                      }}
                    >
                      New Participant
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="flex">
              <div
                className="flex items-center pl-4 pr-2 py-4 shrink-0 font-medium"
                style={{ width: sidebarWidth }}
              >
                <div className="grow h-full flex items-end">
                  {t("participantCount", { count: participants.length })}
                </div>
                <TransitionPopInOut show={scrollPosition > 0}>
                  <Button rounded={true} onClick={goToPreviousPage}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TransitionPopInOut>
              </div>
              <ControlledScrollDiv>
                {options.map((option) => {
                  const parsedOption = decodeDateOption(
                    option.value,
                    timeZone,
                    targetTimeZone,
                  );
                  const numVotes = option.votes.length;
                  return (
                    <div
                      key={option.id}
                      className={clsx(
                        "py-4 text-center shrink-0 transition-colors",
                        {
                          "bg-slate-50": activeOptionId === option.id,
                        },
                      )}
                      style={{ width: columnWidth }}
                      onMouseOver={() => setActiveOptionId(option.id)}
                      onMouseOut={() => setActiveOptionId(null)}
                    >
                      <div>
                        <DateCard
                          day={parsedOption.day}
                          dow={parsedOption.dow}
                          month={parsedOption.month}
                          annotation={
                            <Score
                              count={numVotes}
                              highlight={numVotes === highScore}
                            />
                          }
                        />
                      </div>
                      <div>
                        {parsedOption.type === "timeSlot" ? (
                          <TimeRange
                            className="mt-2 -mr-2"
                            startTime={parsedOption.startTime}
                            endTime={parsedOption.endTime}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </ControlledScrollDiv>
              <div
                className="flex items-center py-3 px-2"
                style={{ width: actionColumnWidth }}
              >
                <TransitionPopInOut show={scrollPosition < maxScrollPosition}>
                  <Button
                    className="text-xs"
                    rounded={true}
                    onClick={() => {
                      setDidUsePagination(true);
                      goToNextPage();
                    }}
                  >
                    {didUsePagination ? (
                      <ArrowRight className="w-4 h-4" />
                    ) : (
                      `+${numberOfInvisibleColumns} more…`
                    )}
                  </Button>
                </TransitionPopInOut>
              </div>
            </div>
            {shouldShowNewParticipantForm ? (
              <ParticipantRowForm
                className="border-t bg-slate-100 bg-opacity-0"
                onSubmit={(data) => {
                  return new Promise((resolve, reject) => {
                    addParticipant(data, {
                      onSuccess: () => {
                        setShouldShowNewParticipantForm(false);
                        resolve();
                      },
                      onError: reject,
                    });
                  });
                }}
                options={options}
                onCancel={() => {
                  setShouldShowNewParticipantForm(false);
                }}
              />
            ) : null}
          </div>
          <div className="min-h-0 overflow-y-auto">
            {participants.map((participant, i) => {
              return (
                <ParticipantRow
                  urlId={pollId}
                  key={i}
                  participant={participant}
                  options={options}
                  canDelete={role === "admin"}
                  editMode={editingParticipantId === participant.id}
                  onChangeEditMode={(isEditing) => {
                    setEditingParticipantId(isEditing ? participant.id : null);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PollContext.Provider>
  );
};

export default React.memo(Poll);
