import { trpc } from "@rallly/backend";
import { ArrowLeftIcon, CheckIcon, ChevronLeftIcon } from "@rallly/icons";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import { TopBar } from "@/components/layouts/standard-layout/top-bar";
import { Trans } from "@/components/trans";
import { cn } from "@/lib/utils";
import { usePostHog } from "@/utils/posthog";

import { Button } from "./button";
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
      router.replace(`/poll/${res.id}`);
      queryClient.polls.list.invalidate();
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
      <TopBar className="">
        <div className="flex justify-between">
          <Button
            icon={<ArrowLeftIcon />}
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
            <Trans i18nKey="back" defaults="Back" />
          </Button>
          <Steps current={currentStepIndex} total={steps.length} />
        </div>
      </TopBar>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 p-3 md:p-8">
        <div className="grow">
          <div className="">
            {(() => {
              switch (currentStepName) {
                case "eventDetails":
                  return (
                    <PollDetailsForm
                      className="max-w-3xl"
                      name={currentStepName}
                      defaultValues={formData?.eventDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
                case "options":
                  return (
                    <div>
                      <div className="mb-8">
                        <h2 className="">
                          <Trans i18nKey="dates" defaults="Dates" />
                        </h2>
                        <p className="leading-6 text-gray-500">
                          <Trans
                            i18nKey="datesDescription"
                            defaults="Select a few dates for your participants to choose from"
                          />
                        </p>
                      </div>
                      <Card>
                        <PollOptionsForm
                          className="max-w-4xl"
                          name={currentStepName}
                          defaultValues={formData?.options}
                          onSubmit={handleSubmit}
                          onChange={handleChange}
                          title={formData.eventDetails?.title}
                        />
                      </Card>
                    </div>
                  );
                case "userDetails":
                  return (
                    <UserDetailsForm
                      className="max-w-lg"
                      name={currentStepName}
                      defaultValues={formData?.userDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
              }
            })()}
          </div>
          <div className="mt-8 flex gap-x-2">
            {currentStepIndex < steps.length - 1 ? (
              <Button
                type="primary"
                form={currentStepName}
                loading={isBusy}
                htmlType="submit"
              >
                {t("continue")}
              </Button>
            ) : (
              <Button
                form={currentStepName}
                type="primary"
                loading={isBusy}
                htmlType="submit"
              >
                {t("createPoll")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
