import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
} from "@floating-ui/react-dom-interactions";
import { Combobox } from "@headlessui/react";
import ChevronDown from "@rallly/icons/chevron-down.svg";
import clsx from "clsx";
import React from "react";
import spacetime from "spacetime";
import soft from "timezone-soft";

import { styleMenuItem } from "../menu-styles";
import timeZones from "./time-zones.json";

interface TimeZoneOption {
  value: string;
  label: string;
  offset: number;
}

const useTimeZones = () => {
  const options = React.useMemo(() => {
    return Object.entries(timeZones)
      .reduce<TimeZoneOption[]>((selectOptions, zone) => {
        const now = spacetime.now(zone[0]);
        const tz = now.timezone();

        let label = "";

        const min = tz.current.offset * 60;
        const hr =
          `${(min / 60) ^ 0}:` + (min % 60 === 0 ? "00" : Math.abs(min % 60));
        const prefix = `(GMT${hr.includes("-") ? hr : `+${hr}`}) ${zone[1]}`;

        label = prefix;

        selectOptions.push({
          value: tz.name,
          label: label,
          offset: tz.current.offset,
        });

        return selectOptions;
      }, [])
      .sort((a: TimeZoneOption, b: TimeZoneOption) => a.offset - b.offset);
  }, []);

  const findFuzzyTz = React.useCallback(
    (zone: string): TimeZoneOption => {
      let currentTime = spacetime.now("GMT");
      try {
        currentTime = spacetime.now(zone);
      } catch (err) {
        throw new Error(`Invalid time zone: zone`);
      }
      return options
        .filter(
          (tz: TimeZoneOption) =>
            tz.offset === currentTime.timezone().current.offset,
        )
        .map((tz: TimeZoneOption) => {
          let score = 0;
          if (
            currentTime.timezones[tz.value.toLowerCase()] &&
            !!currentTime.timezones[tz.value.toLowerCase()].dst ===
              currentTime.timezone().hasDst
          ) {
            if (
              tz.value
                .toLowerCase()
                .indexOf(
                  currentTime.tz.substring(currentTime.tz.indexOf("/") + 1),
                ) !== -1
            ) {
              score += 8;
            }
            if (
              tz.label
                .toLowerCase()
                .indexOf(
                  currentTime.tz.substring(currentTime.tz.indexOf("/") + 1),
                ) !== -1
            ) {
              score += 4;
            }
            if (
              tz.value
                .toLowerCase()
                .indexOf(
                  currentTime.tz.substring(0, currentTime.tz.indexOf("/")),
                )
            ) {
              score += 2;
            }
            score += 1;
          } else if (tz.value === "GMT") {
            score += 1;
          }
          return { tz, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(({ tz }) => tz)[0];
    },
    [options],
  );

  return React.useMemo(
    () => ({
      options,
      findFuzzyTz,
    }),
    [findFuzzyTz, options],
  );
};

const TimeZonePicker: React.FunctionComponent<{
  value: string;
  onChange: (tz: string) => void;
  onBlur?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}> = ({ value, onChange, onBlur, className, style, disabled }) => {
  const { options, findFuzzyTz } = useTimeZones();

  const { reference, floating, x, y, strategy, refs } = useFloating({
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      size({
        apply: ({ rects }) => {
          if (refs.floating.current) {
            Object.assign(refs.floating.current.style, {
              width: `${rects.reference.width}px`,
            });
          }
        },
      }),
    ],
  });

  const timeZoneOptions = React.useMemo(
    () => [
      {
        value: "",
        label: "Ignore time zone",
        offset: 0,
      },
      ...options,
    ],
    [options],
  );

  const selectedTimeZone = React.useMemo(
    () =>
      value
        ? timeZoneOptions.find(
            (timeZoneOption) => timeZoneOption.value === value,
          ) ?? findFuzzyTz(value)
        : timeZoneOptions[0],
    [findFuzzyTz, timeZoneOptions, value],
  );

  const [query, setQuery] = React.useState("");

  const filteredTimeZones = React.useMemo(() => {
    return query
      ? timeZoneOptions.filter((tz) => {
          if (tz.label.toLowerCase().includes(query.toLowerCase())) {
            return true;
          }
          const tzStrings = soft(query);
          return tzStrings.some((tzString) => tzString.iana === tz.value);
        })
      : timeZoneOptions;
  }, [timeZoneOptions, query]);

  return (
    <Combobox
      value={selectedTimeZone}
      onChange={(newTimeZone) => {
        setQuery("");
        onChange(newTimeZone.value);
      }}
      disabled={disabled}
    >
      <div
        className={clsx("relative", className)}
        ref={reference}
        style={style}
      >
        {/* Remove generic params once Combobox.Input can infer the types */}
        <Combobox.Input<"input">
          className="input w-full pr-8"
          displayValue={() => ""}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onBlur={onBlur}
        />
        <Combobox.Button className="absolute inset-0 flex h-9 w-full cursor-default items-center px-2 text-left">
          <span className="grow truncate">
            {!query ? selectedTimeZone.label : null}
          </span>
          <span className="pointer-events-none flex">
            <ChevronDown className="h-5 w-5" />
          </span>
        </Combobox.Button>
        <FloatingPortal>
          <Combobox.Options
            ref={floating}
            className="z-50 mt-1 max-h-72 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            style={{
              position: strategy,
              left: x ?? "",
              top: y ?? "",
            }}
          >
            {filteredTimeZones.map((timeZone) => (
              <Combobox.Option
                key={timeZone.value}
                className={styleMenuItem}
                value={timeZone}
              >
                {timeZone.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </FloatingPortal>
      </div>
    </Combobox>
  );
};

export default TimeZonePicker;
