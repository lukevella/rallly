"use client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Link } from "@/components/link";
import type { ConferencingOptions } from "@/features/conferencing/components/conferencing-field";
import {
  toConferencingFormValues,
  toPollConferencing,
} from "@/features/conferencing/components/conferencing-field";
import { PollDetailsForm } from "@/features/poll/components/forms/poll-details-form";
import type { PollDetailsData } from "@/features/poll/components/forms/types";
import { useUpdatePollMutation } from "@/features/poll/components/mutations";
import { usePoll } from "@/features/poll/components/poll-context";
import { Trans } from "@/i18n/client";

export function EditDetailsForm({
  conferencing,
}: {
  conferencing: ConferencingOptions;
}) {
  const { poll } = usePoll();
  const { mutate: updatePollMutation, isPending: isUpdating } =
    useUpdatePollMutation();
  const router = useRouter();

  const pollLink = `/poll/${poll.id}`;

  const redirectBackToPoll = () => {
    router.push(pollLink);
  };

  const form = useForm<PollDetailsData>({
    defaultValues: {
      title: poll.title,
      location: poll.location ?? "",
      description: poll.description ?? "",
      ...toConferencingFormValues(poll.conferencing),
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          //submit
          updatePollMutation(
            {
              pollId: poll.id,
              title: data.title,
              location: data.location,
              description: data.description,
              conferencing: toPollConferencing(data) ?? null,
            },
            {
              onSuccess: (res) => {
                if (res.ok) {
                  redirectBackToPoll();
                }
              },
            },
          );
        })}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="editDetails" defaults="Edit details" />
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="editDetailsDescription"
                defaults="Change the details of your event."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PollDetailsForm conferencing={conferencing} />
          </CardContent>
          <CardFooter className="justify-between">
            <Link href={pollLink} className={buttonVariants()}>
              <Trans i18nKey="cancel" />
            </Link>
            <Button type="submit" loading={isUpdating} variant="primary">
              <Trans i18nKey="save" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
