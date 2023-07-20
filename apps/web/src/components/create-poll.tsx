import { trpc } from "@rallly/backend";
import { CalendarIcon, TableIcon } from "@rallly/icons";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form, FormField, FormItem, FormLabel } from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";

import { NewEventData, PollDetailsForm, PollOptionsForm } from "./forms";
import { useUser } from "./user-provider";

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

export interface CreatePollPageProps {
  title?: string;
  location?: string;
  description?: string;
  view?: "week" | "month";
}

export const CreatePoll: React.FunctionComponent = () => {
  const router = useRouter();

  const session = useUser();

  const form = useForm<NewEventData>({
    defaultValues: {
      allDay: true,
      options: {
        view: "week",
        options: [],
      },
    },
  });

  const posthog = usePostHog();
  const queryClient = trpc.useContext();
  const createPoll = trpc.polls.create.useMutation();

  const { t } = useTranslation();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (formData) => {
          const title = required(formData?.eventDetails?.title);

          await createPoll.mutateAsync(
            {
              title: title,
              location: formData?.eventDetails?.location,
              description: formData?.eventDetails?.description,
              user: session.user.isGuest
                ? {
                    name: required(formData?.userDetails?.name),
                    email: required(formData?.userDetails?.contact),
                  }
                : undefined,
              timeZone: formData?.options?.timeZone,
              options: required(formData?.options?.options).map((option) => ({
                startDate: option.type === "date" ? option.date : option.start,
                endDate: option.type === "timeSlot" ? option.end : undefined,
              })),
            },
            {
              onSuccess: (res) => {
                posthog?.capture("created poll", {
                  pollId: res.id,
                  numberOfOptions: formData.options?.options?.length,
                  optionsView: formData?.options?.view,
                });
                queryClient.polls.list.invalidate();
                router.replace(`/poll/${res.id}`);
              },
            },
          );
        })}
      >
        <div className="mx-auto max-w-4xl space-y-4 p-2 sm:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PollDetailsForm />
            </CardContent>
          </Card>
          <Tabs
            className="flex justify-center"
            value={form.watch("options.view")}
            onValueChange={(value) => {
              form.setValue("options.view", value);
            }}
          >
            <TabsList>
              <TabsTrigger value="month">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <Trans i18nKey="monthView" />
              </TabsTrigger>
              <TabsTrigger value="week">
                <TableIcon className="mr-2 h-4 w-4" />
                <Trans i18nKey="weekView" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-x-4">
                <CardTitle>Select Dates</CardTitle>
              </div>
            </CardHeader>
            <PollOptionsForm />
          </Card>
          <hr />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-x-2">
                <CardTitle>Advanced</CardTitle>
                <Badge>Pro</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start justify-between gap-x-4">
                        <div className="grid gap-2 pt-0.5">
                          <Label htmlFor="allDay">Hide participant</Label>
                          <p className="text-muted-foreground text-sm">
                            Only you will be able to see the participant names
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            React.startTransition(() => {
                              field.onChange(checked);
                            });
                          }}
                        />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <hr />
          <Button
            loading={form.formState.isSubmitting || form.formState.isSubmitted}
            size="lg"
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="createPoll" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
