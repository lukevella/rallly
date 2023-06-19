import { trpc } from "@rallly/backend";
import { ArrowLeftIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

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
      <div className="sm:p-8">
        <div className="my-4 flex justify-center">
          <Steps current={currentStepIndex} total={steps.length} />
        </div>
        <Card className="mx-auto max-w-4xl rounded-none border-x-0 sm:rounded-md sm:border-x">
          <CardHeader>
            <CardTitle>
              <Trans i18nKey="newPoll" />
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="createPollDescription"
                defaults="Create an event and invite participants to vote on the best time to meet."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="justify-between">
            <div>
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
            </div>
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
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
