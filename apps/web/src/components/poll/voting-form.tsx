import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { usePoll } from "@/contexts/poll";

const formSchema = z.object({
  participantId: z.string().optional(),
  votes: z.array(
    z.object({
      optionId: z.string(),
      type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
    }),
  ),
});

type VotingFormValues = z.infer<typeof formSchema>;

export const useVotingForm = () => {
  return useFormContext<VotingFormValues>();
};

export const VotingForm = ({ children }: React.PropsWithChildren) => {
  const { options } = usePoll();
  const form = useForm<VotingFormValues>({
    defaultValues: {
      votes: options.map((option) => ({
        optionId: option.id,
      })),
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          console.log("new-partiipant");
        })}
      />
      <form
        id="edit-participant-form"
        onSubmit={form.handleSubmit((data) => {
          console.log("edit-partiipant");
        })}
      />
      {children}
    </FormProvider>
  );
};
