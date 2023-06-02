import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";

const formName = "finalize-form";

const formSchema = z.object({
  selectedOptionId: z.string(),
});

type FinalizeFormData = z.infer<typeof formSchema>;

const FinalizeForm = () => {
  const { poll } = usePoll();
  const { options } = poll;
  const form = useForm<FinalizeFormData>({
    defaultValues: {
      selectedOptionId: options[0].id,
    },
  });
  return (
    <Form {...form}>
      <form id={formName}>
        <FormField
          control={form.control}
          name="selectedOptionId"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="selectOption" defaults="Select Option" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    {options.map((option) => {
                      return (
                        <Label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-md border bg-white p-3",
                            field.value === option.id
                              ? "border-primary"
                              : "hover:border-primary",
                          )}
                        >
                          <RadioGroupItem id={option.id} value={option.id} />
                          <div>{dayjs(option.start).format("LLL")}</div>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};

export const FinalizePollDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalizePollTitle" defaults="Finalize Poll" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="finalizePollTitle"
              defaults="Pick a date from the list to book a date for your event."
            />
          </DialogDescription>
        </DialogHeader>
        <FinalizeForm />
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            <Trans i18nKey="cancel" />
          </Button>
          <Button type="submit" form={formName} variant="primary">
            <Trans i18nKey="book" defaults="Book" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
