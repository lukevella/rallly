"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PayWall } from "@/components/pay-wall";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

const formSchema = z.object({
  title: z.string().trim().min(1),
});

const Page: NextPageWithLayout = () => {
  const { poll } = usePoll();
  const duplicate = trpc.polls.duplicate.useMutation();
  const router = useRouter();
  const posthog = usePostHog();
  const pollLink = `/poll/${poll.id}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: poll.title,
    },
  });

  return (
    <PayWall>
      <Form {...form}>
        <form
          className="mx-auto max-w-3xl"
          onSubmit={form.handleSubmit((data) => {
            //submit
            duplicate.mutate(
              { pollId: poll.id, newTitle: data.title },
              {
                onSuccess: async (res) => {
                  posthog?.capture("duplicate poll", {
                    pollId: poll.id,
                    newPollId: res.id,
                  });
                  router.push(`/poll/${res.id}`);
                },
              },
            );
          })}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans i18nKey="duplicate" defaults="Duplicate" />
              </CardTitle>
              <CardDescription>
                <Trans
                  i18nKey="duplicateDescription"
                  defaults="Create a new poll based on this one"
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>
                        <Trans i18nKey="duplicateTitleLabel" defaults="Title" />
                      </FormLabel>
                      <Input {...field} />
                      <FormDescription>
                        <Trans
                          i18nKey="duplicateTitleDescription"
                          defaults="Hint: Give your new poll a unique title"
                        />
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
            </CardContent>
            <CardFooter className="justify-between">
              <Button asChild>
                <Link href={pollLink}>
                  <Trans i18nKey="cancel" />
                </Link>
              </Button>
              <Button
                type="submit"
                loading={duplicate.isLoading}
                variant="primary"
              >
                <Trans i18nKey="duplicate" defaults="Duplicate" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </PayWall>
  );
};

export default Page;
