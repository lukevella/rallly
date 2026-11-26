"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import languages from "@rallly/languages";
import { LanguagesIcon } from "lucide-react";
import * as React from "react";

import { Button } from "./button";
import { cn } from "./lib/utils";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const LanguageSelectContext = React.createContext<string | undefined>(
  undefined,
);

/**
 * Picks one of the supported languages. Controlled: the caller decides what
 * choosing a language does (write a cookie, navigate to a locale path).
 * Compose it with a trigger and `LanguageSelectContent`.
 */
function LanguageSelect({
  value,
  onValueChange,
  onOpenChange,
  children,
}: {
  value: string;
  onValueChange: (language: string) => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <LanguageSelectContext.Provider value={value}>
      <SelectPrimitive.Root
        items={languages}
        value={value}
        onOpenChange={onOpenChange}
        onValueChange={(language) => {
          if (language) {
            onValueChange(language);
          }
        }}
      >
        {children}
      </SelectPrimitive.Root>
    </LanguageSelectContext.Provider>
  );
}

/** A form field trigger showing the selected language's name. */
function LanguageSelectTrigger({
  className,
  ...props
}: SelectPrimitive.Trigger.Props) {
  const value = React.useContext(LanguageSelectContext);
  return (
    <SelectTrigger className={className} {...props}>
      {value ? <LanguageFlag code={value} /> : null}
      <SelectValue lang={value} />
    </SelectTrigger>
  );
}

/**
 * A compact button showing the selected language's name. Its accessible name
 * is `label` followed by that name, so it still contains the visible text.
 */
function LanguageSelectButton({
  className,
  label,
  ...props
}: SelectPrimitive.Trigger.Props & { label: string }) {
  const value = React.useContext(LanguageSelectContext);
  const name = value ? languages[value as keyof typeof languages] : undefined;
  return (
    <SelectPrimitive.Trigger
      render={
        <Button
          type="button"
          variant="ghost"
          aria-label={name ? `${label}: ${name}` : label}
        />
      }
      // Below sm the name would crowd the header, so only the icon shows.
      className={cn("max-sm:size-9 max-sm:px-0", className)}
      {...props}
    >
      <LanguagesIcon />
      <SelectPrimitive.Value lang={value} className="max-sm:sr-only" />
    </SelectPrimitive.Trigger>
  );
}

const flags: Record<string, string> = {
  cs: "🇨🇿",
  da: "🇩🇰",
  de: "🇩🇪",
  en: "🇺🇸",
  "en-GB": "🇬🇧",
  el: "🇬🇷",
  es: "🇪🇸",
  fr: "🇫🇷",
  it: "🇮🇹",
  hu: "🇭🇺",
  nl: "🇳🇱",
  no: "🇳🇴",
  pl: "🇵🇱",
  "pt-BR": "🇧🇷",
  "pt-PT": "🇵🇹",
  ru: "🇷🇺",
  fi: "🇫🇮",
  sv: "🇸🇪",
  zh: "🇨🇳",
  "zh-Hant": "🇹🇼",
};

function LanguageFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("text-base leading-none", className)}
    >
      {flags[code]}
    </span>
  );
}

/**
 * Each language in its own name and script, beside its flag. Typeahead
 * matches the name.
 */
function LanguageSelectContent({
  className,
  ...props
}: Omit<SelectPrimitive.Popup.Props, "children">) {
  return (
    <SelectContent className={cn("max-h-[360px]", className)} {...props}>
      {Object.entries(languages).map(([code, name]) => (
        <SelectItem key={code} value={code} label={name}>
          <span className="flex items-center gap-2.5">
            <LanguageFlag code={code} />
            <span lang={code}>{name}</span>
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  );
}

export {
  LanguageSelect,
  LanguageSelectButton,
  LanguageSelectContent,
  LanguageSelectTrigger,
};
