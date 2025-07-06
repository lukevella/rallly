"use server";

import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getTranslation } from "@/i18n/server";
import { auth } from "@/next-auth";

import { actionClient } from "@/safe-action";
import { setupSchema } from "./schema";

export type SetupFormState = {
  message?: string | null;
  errors?: {
    name?: string[];
    timeZone?: string[];
    locale?: string[];
  };
};

export const updateUserAction = actionClient
  .inputSchema(setupSchema)
  .action(async ({ parsedInput }) => {
    const { t } = await getTranslation();
    const session = await auth();

    if (!session?.user?.id) {
      return {
        message: t("errorNotAuthenticated", {
          defaultValue: "Not authenticated",
        }),
      };
    }

    const validatedFields = setupSchema.safeParse({
      name: parsedInput.name,
      timeZone: parsedInput.timeZone,
      locale: parsedInput.locale,
    });

    if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors;
      const translatedErrors = Object.entries(errors).reduce(
        (acc, [key, value]) => {
          acc[key as keyof typeof errors] = value?.map((errKey) =>
            t(errKey, { defaultValue: `Invalid ${key}` }),
          );
          return acc;
        },
        {} as Required<SetupFormState>["errors"],
      );

      return {
        errors: translatedErrors,
        message: t("errorInvalidFields", {
          defaultValue: "Invalid fields. Please check your input.",
        }),
      };
    }

    const { name, timeZone, locale } = validatedFields.data;

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name,
          timeZone,
          locale,
        },
      });
    } catch (error) {
      console.error("Failed to update user setup:", error);
      return {
        message: t("errorDatabaseUpdateFailed", {
          defaultValue: "Database error: Failed to update settings.",
        }),
      };
    }

    posthog?.capture({
      event: "user_setup_completed",
      distinctId: session.user.id,
      properties: {
        $set: {
          name,
          timeZone,
          locale,
        },
      },
    });

    await posthog?.shutdown();

    revalidatePath("/", "layout");

    redirect("/");
  });
