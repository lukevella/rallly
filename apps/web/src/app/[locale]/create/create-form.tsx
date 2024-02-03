"use client";

import { IfNeedBeIcon, NoIcon, YesIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Calendar } from "@rallly/ui/calendar";
import { Checkbox } from "@rallly/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger } from "@rallly/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { Textarea } from "@rallly/ui/textarea";
import dayjs from "dayjs";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ListIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm, useFormContext } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useTranslation } from "react-i18next";

import {
  InviteCard,
  InviteCardForm,
  InviteCardGeneral,
} from "@/app/[locale]/create/invite-card";
import {
  PageContainer,
  PageContent,
  PageHeader,
} from "@/app/components/page-layout";
import { useQueryString } from "@/utils/query-string";

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function FieldGroupTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-semibold">{children}</h2>;
}

export function FieldGroupContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function SidebarTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="sticky top-14 flex items-center gap-x-2 border-b bg-gray-50 px-5 py-4 text-sm font-bold">
      {children}
    </h3>
  );
}

function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function SidebarSection({ children }: { children?: React.ReactNode }) {
  return <section>{children}</section>;
}

function SidebarContent({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
}

function GeneralForm() {
  const form = useFormContext<FormData>();
  const { t } = useTranslation();
  return (
    <SidebarSection>
      <SidebarContent>
        <FieldGroupContent>
          <FormField
            control={form.control}
            name="event.title"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("titlePlaceholder")} />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="event.description"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="event.location"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t("location")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("locationPlaceholder")} />
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </FieldGroupContent>
      </SidebarContent>
    </SidebarSection>
  );
}

type FormData = {
  event: {
    title: string;
    description?: string;
    location?: string;
    timezone?: string; // undefined if meeting is remote
  };
  form: {
    type: "poll";
    poll: {
      prompt: string;
      duration: number;
      options: {
        start: Date;
      }[];
      settings: {
        hideParticipants: boolean;
        hideScores: boolean;
        allowTentative: boolean;
      };
    };
    advanced: {
      requireParticipantEmail: boolean;
    };
  };
};

function PollForm() {
  const form = useFormContext<FormData>();
  const { t } = useTranslation();
  return (
    <SidebarSection>
      <SidebarContent>
        <FieldGroup>
          <FormField
            control={form.control}
            name="form.poll.prompt"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    {t("prompt", {
                      defaultValue: "Prompt",
                    })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("pollPromptPlaceholder", {
                        defaultValue: "Select as many dates as you can attend",
                      })}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="form.poll.options"
            defaultValue={[]}
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    {t("options", {
                      defaultValue: "Options",
                    })}
                  </FormLabel>
                  <FormControl>
                    <Calendar
                      selected={field.value.map((option) => option.start)}
                      onSelectedChange={(selection) => {
                        field.onChange(
                          selection?.map(
                            (date) =>
                              ({
                                start: date,
                              }) ?? [],
                          ),
                        );
                      }}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="form.poll.duration"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>
                    {t("duration", {
                      defaultValue: "Duration",
                    })}
                  </FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(newValue) => {
                      field.onChange(parseInt(newValue));
                    }}
                  >
                    <SelectTrigger ref={field.ref}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All-day</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />
          {form.watch("form.poll.duration") === 0 ? (
            <div>all-day</div>
          ) : (
            <div>time</div>
          )}
        </FieldGroup>
      </SidebarContent>
    </SidebarSection>
  );
}

function Poll({
  prompt,
  options,
}: {
  prompt: string;
  options: { start: Date }[];
}) {
  return (
    <div className="flex h-full flex-col">
      <h3 className="sticky top-0 -mx-6 -mt-6 p-6 font-semibold">{prompt}</h3>
      <ul className="mb-4 flex gap-x-4">
        <li className="flex items-center gap-x-2">
          <YesIcon className="size-5 text-green-500" />
          <span className="text-sm">Yes</span>
        </li>
        <li className="flex items-center gap-x-2">
          <IfNeedBeIcon className="size-5 text-amber-400" />
          <span className="text-sm">If need be</span>
        </li>
        <li className="flex items-center gap-x-2">
          <NoIcon className="size-5 text-gray-400" />
          <span className="text-sm">No</span>
        </li>
      </ul>
      <div className="flex grow gap-x-4">
        <div className="grow">
          <div className="grid grow gap-2">
            {options.map((option, i) => (
              <div
                className="flex items-center gap-x-4 rounded-md border bg-white px-4 py-3"
                key={i}
              >
                <Checkbox id={`option${i}`} name={`option${i}`} />
                <label className="grow font-medium" htmlFor={`option${i}`}>
                  {dayjs(option.start).format("DD MMM YYYY")}
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontalIcon className="text-muted-foreground size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
        {/* <div>
          <Calendar
            disabled={(date) => {
              return !options.some((option) =>
                dayjs(option.start).isSame(date, "day"),
              );
            }}
          />
        </div> */}
      </div>
    </div>
  );
}

function CreateFormInput() {
  const form = useFormContext<FormData>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <Tabs
        onValueChange={(newValue) => {
          const queryString = new URLSearchParams(searchParams?.toString());
          queryString.set("tab", newValue);
          router.replace(pathname + `?${queryString.toString()}`);
        }}
        value={searchParams?.get("tab") ?? "event"}
      >
        {/* <div className="p-4">
          <TabsList className="w-full">
            <TabsTrigger
              value="event"
              className="flex grow items-center gap-x-2"
            >
              <CalendarIcon className="size-4" /> Event
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="flex grow items-center gap-x-2"
            >
              <ListIcon className="size-4" />
              Form
            </TabsTrigger>
          </TabsList>
        </div> */}
        <TabsContent value="event">
          <GeneralForm />
        </TabsContent>
        <TabsContent value="form">
          <PollForm />
        </TabsContent>
      </Tabs>
    </SidebarGroup>
  );
}

function CreateFormPreview() {
  const form = useFormContext<FormData>();
  const { t } = useTranslation();

  return (
    <InviteCard className="mx-auto scale-95">
      <InviteCardGeneral
        title={form.watch("event.title") || t("titlePlaceholder")}
        location={form.watch("event.location") || t("locationPlaceholder")}
        description={
          form.watch("event.description") || t("descriptionPlaceholder")
        }
      />
      <InviteCardForm>
        <div
          className="h-full rounded-md"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <div className="text-muted-foreground">Step 1 of 2</div>
          {form.watch("form.type") === "poll" && (
            <Poll
              prompt={
                form.watch("form.poll.prompt") ||
                t("pollPromptPlaceholder", {
                  defaultValue: "Select as many dates as you can attend",
                })
              }
              options={form.watch("form.poll.options", [])}
            />
          )}
        </div>
      </InviteCardForm>
    </InviteCard>
  );
}

export function CreateForm() {
  const form = useForm<FormData>();

  const { clear } = useFormPersist("create-form", {
    watch: form.watch,
    setValue: form.setValue,
  });

  return (
    <Form {...form}>
      <form className="flex gap-x-16" onSubmit={() => {}}>
        <div className="max-w-xl grow">
          <CreateFormInput />
        </div>
        <div className="rounded-md border bg-gray-100 px-5 py-4">
          <h2 className="text-muted-foreground mb-1 text-sm">Preview</h2>
          <CreateFormPreview />
        </div>
      </form>
    </Form>
  );
}
