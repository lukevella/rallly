"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { Textarea } from "@rallly/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { CheckCircle2Icon, MegaphoneIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Trans } from "@/components/trans";

import { useSafeAction } from "@/lib/safe-action/client";
import { isSelfHosted } from "@/utils/constants";
import { submitFeedbackAction } from "../actions";
import type { Feedback } from "../schema";
import { feedbackSchema } from "../schema";

export function FeedbackToggle() {
  const submitFeedback = useSafeAction(submitFeedbackAction);
  const form = useForm<Feedback>({
    resolver: zodResolver(feedbackSchema),
  });

  if (isSelfHosted) {
    return null;
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icon>
                <MegaphoneIcon />
              </Icon>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <Trans i18nKey="feedback" defaults="Feedback" />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <DialogContent>
        {!form.formState.isSubmitSuccessful ? (
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
              <form onSubmit={form.handleSubmit(submitFeedback.executeAsync)}>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <Textarea
                        disabled={form.formState.isSubmitting}
                        className="w-full"
                        rows={5}
                        {...field}
                        placeholder="Enter your feedback"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  className="mt-6"
                  variant="primary"
                >
                  <Trans i18nKey="sendFeedback" defaults="Send Feedback" />
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
