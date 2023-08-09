import { trpc } from "@rallly/backend";
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
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import { getPollLayout } from "@/components/layouts/poll-layout";
import { PayWall } from "@/components/pay-wall";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { poll } = usePoll();
  const duplicate = trpc.polls.duplicate.useMutation();
  const router = useRouter();

  const pollLink = `/poll/${poll.id}`;

  const form = useForm<{ title: string }>({
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
                  await router.push(`/poll/${res.id}`);
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

Page.getLayout = getPollLayout;

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps = getStaticTranslations;

export default Page;
