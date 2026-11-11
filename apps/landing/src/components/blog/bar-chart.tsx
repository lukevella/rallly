import type React from "react";

export function BarChart({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  note,
  children,
}: {
  title: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-8 flex aspect-[16/10] flex-col rounded-xl border bg-white p-4 sm:p-6">
      <figcaption>
        <div className="font-medium text-gray-800">{title}</div>
        <div className="mt-1 text-gray-500 text-sm">{description}</div>
      </figcaption>
      {primaryLabel && secondaryLabel ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-sm bg-primary" />
            {primaryLabel}
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-sm bg-indigo-400"
            />
            {secondaryLabel}
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-1 flex-col justify-evenly gap-3">
        {children}
      </div>
      {note ? <div className="mt-4 text-gray-500 text-sm">{note}</div> : null}
    </figure>
  );
}

export function Bar({
  label,
  sublabel,
  value,
  secondaryValue,
}: {
  label: string;
  sublabel?: string;
  value: string;
  secondaryValue?: string;
}) {
  const primary = Number(value);
  const secondary = secondaryValue ? Number(secondaryValue) : 0;
  const total = primary + secondary;

  return (
    <div className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 sm:grid-cols-[8rem_1fr_4rem]">
      <div className="text-sm leading-tight">
        <div className="text-gray-800">{label}</div>
        {sublabel ? <div className="text-gray-500">{sublabel}</div> : null}
      </div>
      <div aria-hidden="true" className="flex h-5 gap-0.5 bg-gray-100 sm:h-10">
        <div
          className={secondary > 0 ? "bg-primary" : "rounded-r bg-primary"}
          style={{ width: `${primary}%` }}
        />
        {secondary > 0 ? (
          <div
            className="rounded-r bg-indigo-400"
            style={{ width: `${secondary}%` }}
          />
        ) : null}
      </div>
      <div className="text-right tabular-nums leading-tight">
        <div className="font-medium text-gray-800 text-sm">{total}%</div>
        {secondary > 0 ? (
          <div className="text-gray-500 text-xs">{primary}% yes</div>
        ) : null}
      </div>
    </div>
  );
}
