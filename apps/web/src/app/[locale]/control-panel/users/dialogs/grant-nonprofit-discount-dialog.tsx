"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordManagerIgnoreProps } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
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
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { toast } from "@rallly/ui/sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { grantNonprofitDiscountAction } from "@/features/billing/nonprofit/actions";
import { NONPROFIT_DISCOUNT_PERCENT } from "@/features/billing/nonprofit/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

const useSchema = () => {
  const { t } = useTranslation();
  return z.object({
    spaceId: z.string().min(1, {
      error: t("grantNonprofitDiscountSpaceRequired", {
        defaultValue: "Choose a space",
      }),
    }),
    organizationName: z
      .string()
      .trim()
      .min(1, {
        error: t("grantNonprofitDiscountOrganizationRequired", {
          defaultValue: "Enter the organization's name",
        }),
      })
      .max(200),
  });
};

export function GrantNonprofitDiscountDialog({
  email,
  spaces,
  open,
  onOpenChange,
}: {
  email: string;
  /** Spaces the user owns; the discount belongs to one of them. */
  spaces: { id: string; name: string; granted: boolean }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const schema = useSchema();
  const firstEligible = spaces.find((space) => !space.granted);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      spaceId: firstEligible?.id ?? "",
      organizationName: firstEligible?.name ?? "",
    },
  });

  const grant = useSafeAction(grantNonprofitDiscountAction, {
    onSuccess: ({ data }) => {
      if (data?.outcome === "already_granted") {
        toast.message(
          t("grantNonprofitDiscountAlreadyGranted", {
            defaultValue: "This space already has the discount",
          }),
        );
      } else {
        toast.success(
          t("grantNonprofitDiscountSuccess", {
            defaultValue: "Discount granted",
          }),
        );
      }
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="grantNonprofitDiscountTitle"
              defaults="Grant nonprofit discount"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="grantNonprofitDiscountDesc"
              defaults="Give a space owned by <b>{email}</b> {percent}% off Rallly Pro for as long as it subscribes. It applies to the current subscription and to any future checkout."
              values={{ email, percent: NONPROFIT_DISCOUNT_PERCENT }}
              components={{
                b: <b className="whitespace-nowrap font-normal" />,
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(async (data) => {
              await grant.executeAsync(data);
            })}
          >
            <FormField
              control={form.control}
              name="spaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="space" defaults="Space" />
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const space = spaces.find((s) => s.id === value);
                        if (space) {
                          form.setValue("organizationName", space.name);
                        }
                      }}
                    >
                      {spaces.map((space) => (
                        <div
                          key={space.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <RadioGroupItem
                            id={`grant-space-${space.id}`}
                            value={space.id}
                            disabled={space.granted}
                          />
                          <Label
                            htmlFor={`grant-space-${space.id}`}
                            className="min-w-0 truncate font-normal"
                          >
                            {space.name}
                          </Label>
                          {space.granted ? (
                            <Badge>
                              <Trans
                                i18nKey="grantNonprofitDiscountGranted"
                                defaults="Granted"
                              />
                            </Badge>
                          ) : null}
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans
                      i18nKey="nonprofitOrganizationName"
                      defaults="Organization name"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} {...passwordManagerIgnoreProps} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose render={<Button />}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button
                variant="primary"
                type="submit"
                loading={grant.isExecuting}
                disabled={!firstEligible}
              >
                <Trans
                  i18nKey="grantNonprofitDiscountSubmit"
                  defaults="Grant discount"
                />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
