"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Textarea } from "@rallly/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Trans, useTranslation } from "@/i18n/client";
import { submitFeedbackAction } from "../actions";
import { isFeedbackEnabled } from "../constants";
import { feedbackSchema } from "../schema";

export function FeedbackDialog(props: DialogProps) {
  const { t } = useTranslation();
  const submitFeedback = useMutation(mutationOptions(submitFeedbackAction));
  const form = useForm({
    resolver: zodResolver(feedbackSchema),
  });

  if (!isFeedbackEnabled) {
    return null;
  }

  return (
    <Dialog {...props}>
      <DialogContent>
        {!submitFeedback.isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="feedback" defaults="Feedback" />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="sendFeedbackDesc"
                  defaults="Share your feedback with us."
                />
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  submitFeedback.mutate(data);
                })}
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <Textarea
                        disabled={submitFeedback.isPending}
                        className="w-full"
                        rows={5}
                        {...field}
                        placeholder={t("feedbackDialogEnterFeedback", {
                          defaultValue: "Enter your feedback",
                        })}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  loading={submitFeedback.isPending}
                  className="mt-6"
                  variant="primary"
                >
                  <Trans i18nKey="sendFeedback" defaults="Send feedback" />
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2Icon className="h-12 w-12 text-green-500" />
              <div className="mt-4 text-sm">
                <Trans
                  i18nKey="sendFeedbackSuccess"
                  defaults="Thank you for your feedback!"
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
