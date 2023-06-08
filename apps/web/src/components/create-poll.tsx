import { trpc } from "@rallly/backend";
import { ArrowLeftIcon, XIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import { TopBar } from "@/components/layouts/standard-layout/top-bar";
import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";

import {
  NewEventData,
  PollDetailsData,
  PollDetailsForm,
  PollOptionsData,
  PollOptionsForm,
  UserDetailsData,
  UserDetailsForm,
} from "./forms";
import Steps from "./steps";
import { useUser } from "./user-provider";

type StepName = "eventDetails" | "options" | "userDetails";

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
  const { t } = useTranslation();

  const router = useRouter();

  const session = useUser();

  const steps: StepName[] = React.useMemo(
    () =>
      session.user.isGuest
        ? ["eventDetails", "options", "userDetails"]
        : ["eventDetails", "options"],
    [session.user.isGuest],
  );

  const [formData, setFormData] = React.useState<NewEventData>({
    currentStep: 0,
  });

  React.useEffect(() => {
    const newStep = Math.min(steps.length - 1, formData.currentStep);
    if (newStep !== formData.currentStep) {
      setFormData((prevData) => ({
        ...prevData,
        currentStep: newStep,
      }));
    }
  }, [formData.currentStep, steps.length]);

  const currentStepIndex = formData?.currentStep ?? 0;

  const currentStepName = steps[currentStepIndex];

  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const posthog = usePostHog();
  const queryClient = trpc.useContext();
  const createPoll = trpc.polls.create.useMutation({
    onSuccess: (res) => {
      setIsRedirecting(true);
      posthog?.capture("created poll", {
        pollId: res.id,
        numberOfOptions: formData.options?.options?.length,
        optionsView: formData?.options?.view,
      });
      queryClient.polls.list.invalidate();
      router.replace(`/poll/${res.id}`);
    },
  });

  const isBusy = isRedirecting || createPoll.isLoading;

  const handleSubmit = async (
    data: PollDetailsData | PollOptionsData | UserDetailsData,
  ) => {
    if (currentStepIndex < steps.length - 1) {
      setFormData({
        ...formData,
        currentStep: currentStepIndex + 1,
        [currentStepName]: data,
      });
    } else {
      // last step
      const title = required(formData?.eventDetails?.title);

      await createPoll.mutateAsync({
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
      });
    }
  };

  const handleChange = (
    data: Partial<PollDetailsData | PollOptionsData | UserDetailsData>,
  ) => {
    setFormData({
      ...formData,
      currentStep: currentStepIndex,
      [currentStepName]: data,
    });
  };

  return (
    <div>
      <div className="py-8">
        <div className="flex justify-center py-8">
          <Steps current={currentStepIndex} total={steps.length} />
        </div>
        <Card className="mx-auto max-w-4xl" fullWidthOnMobile={true}>
          <div className="grow">
            <div className="py-5 px-6">
              {(() => {
                switch (currentStepName) {
                  case "eventDetails":
                    return (
                      <PollDetailsForm
                        name={currentStepName}
                        defaultValues={formData?.eventDetails}
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                      />
                    );
                  case "options":
                    return (
                      <PollOptionsForm
                        name={currentStepName}
                        defaultValues={formData?.options}
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                        title={formData.eventDetails?.title}
                      />
                    );
                  case "userDetails":
                    return (
                      <UserDetailsForm
                        name={currentStepName}
                        defaultValues={formData?.userDetails}
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                      />
                    );
                }
              })()}
            </div>
            <div className="mt-4 flex justify-end gap-x-2 border-t bg-gray-50 p-3">
              {currentStepIndex > 0 ? (
                <Button
                  icon={ArrowLeftIcon}
                  disabled={isBusy}
                  onClick={() => {
                    if (currentStepIndex > 0) {
                      setFormData({
                        ...formData,
                        currentStep: currentStepIndex - 1,
                      });
                    }
                  }}
                >
                  <Trans i18nKey="back" />
                </Button>
              ) : null}
              {currentStepIndex < steps.length - 1 ? (
                <Button
                  variant="primary"
                  form={currentStepName}
                  loading={isBusy}
                  type="submit"
                >
                  {t("continue")}
                </Button>
              ) : (
                <Button
                  form={currentStepName}
                  variant="primary"
                  loading={isBusy}
                  type="submit"
                >
                  {t("createPoll")}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
