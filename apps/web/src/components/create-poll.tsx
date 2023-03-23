import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React from "react";

import { usePostHog } from "@/utils/posthog";

import { encodeDateOption } from "../utils/date-time-utils";
import { trpc } from "../utils/trpc";
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

const Page: React.FunctionComponent = () => {
  const { t } = useTranslation("app");

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

  const createPoll = trpc.polls.create.useMutation({
    onSuccess: (res) => {
      setIsRedirecting(true);
      posthog?.capture("created poll", {
        pollId: res.id,
        numberOfOptions: formData.options?.options?.length,
        optionsView: formData?.options?.view,
      });
      router.replace(`/admin/${res.urlId}`);
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
        type: "date",
        location: formData?.eventDetails?.location,
        description: formData?.eventDetails?.description,
        user: session.user.isGuest
          ? {
              name: required(formData?.userDetails?.name),
              email: required(formData?.userDetails?.contact),
            }
          : undefined,
        timeZone: formData?.options?.timeZone,
        options: required(formData?.options?.options).map(encodeDateOption),
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
    <div className="max-w-full p-3 sm:p-4">
      <div className="max-w-full">
        <div className="max-w-full overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="flex justify-between border-b p-4">
            <h1 className="m-0 text-xl font-semibold text-slate-800">
              {t("createNew")}
            </h1>
            <Steps current={currentStepIndex} total={steps.length} />
          </div>
          <div className="">
            {(() => {
              switch (currentStepName) {
                case "eventDetails":
                  return (
                    <PollDetailsForm
                      className="max-w-full p-3 sm:p-4"
                      name={currentStepName}
                      defaultValues={formData?.eventDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
                case "options":
                  return (
                    <PollOptionsForm
                      className="grow"
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
                      className="grow p-4"
                      name={currentStepName}
                      defaultValues={formData?.userDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
              }
            })()}
            <div className="flex w-full justify-end space-x-3 border-t bg-slate-50 px-4 py-3">
              {currentStepIndex > 0 ? (
                <Button
                  disabled={isBusy}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      currentStep: currentStepIndex - 1,
                    });
                  }}
                >
                  {t("back")}
                </Button>
              ) : null}
              <Button
                form={currentStepName}
                loading={isBusy}
                htmlType="submit"
                type="primary"
              >
                {currentStepIndex < steps.length - 1
                  ? t("continue")
                  : t("createPoll")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
