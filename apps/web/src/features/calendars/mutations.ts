import { prisma } from "@rallly/database";
import { loadCredential } from "@/features/credentials/queries";
import type { UserInfo } from "@/lib/oauth/types";
import { createCalendarService } from "./service";

export const createCalendarConnection = async (params: {
  userId: string;
  provider: string;
  providerAccountId: string;
  integrationId: string;
  credentialId: string;
  displayName: string;
  userInfo: UserInfo;
}) => {
  const {
    userId,
    provider,
    credentialId,
    integrationId,
    providerAccountId,
    userInfo,
  } = params;

  const connection = await prisma.calendarConnection.upsert({
    where: {
      user_provider_account_unique: {
        userId,
        provider,
        providerAccountId,
      },
    },
    create: {
      userId,
      provider,
      integrationId,
      credentialId,
      providerAccountId,
      email: userInfo.email,
      displayName: params.displayName,
    },
    update: {
      credentialId,
      email: userInfo.email,
    },
  });

  return connection;
};

export const disconnectCalendarConnection = async (
  userId: string,
  id: string,
) => {
  const connection = await prisma.calendarConnection.findFirst({
    where: { id, userId },
  });

  if (!connection) {
    return {
      success: false,
      error: "Calendar connection not found" as const,
    };
  }

  return await prisma.calendarConnection.delete({
    where: { id },
  });
};

/**
 * Syncs calendars from the provider, including detection of deleted calendars.
 * When a calendar is deleted on Google, it will be marked as deleted in our database.
 */
export const syncCalendars = async ({
  userId,
  connectionId,
}: {
  userId: string;
  connectionId: string;
}) => {
  const connection = await prisma.calendarConnection.findFirst({
    where: { id: connectionId, userId },
  });

  if (!connection) {
    return {
      success: false,
      error: "Calendar connection not found" as const,
    };
  }

  const credential = await loadCredential(connection.credentialId);

  if (!credential) {
    return {
      success: false,
      error: "Credential not found" as const,
    };
  }

  const calendarService = await createCalendarService({
    provider: connection.provider,
    credentials: credential.secret,
  });

  const calendars = await calendarService.listCalendars();

  await prisma.$transaction(async (tx) => {
    // Get current calendar IDs from the provider response
    const providerCalendarIds = calendars.map((cal) => cal.id);

    // Mark any calendars not in the response as deleted
    // (This handles calendars deleted from Google that aren't returned even with showDeleted=true)
    const deletedCalendars = await tx.providerCalendar.findMany({
      where: {
        calendarConnectionId: connection.id,
        providerCalendarId: {
          notIn: providerCalendarIds,
        },
        isDeleted: false,
      },
      select: { id: true },
    });

    if (deletedCalendars.length > 0) {
      const deletedCalendarIds = deletedCalendars.map((cal) => cal.id);

      // Clear any users who have a deleted calendar as their default destination
      await tx.user.updateMany({
        where: {
          defaultDestinationCalendarId: {
            in: deletedCalendarIds,
          },
        },
        data: {
          defaultDestinationCalendarId: null,
        },
      });

      await tx.providerCalendar.updateMany({
        where: { id: { in: deletedCalendarIds } },
        data: { isDeleted: true, lastSyncedAt: new Date() },
      });
    }

    // Upsert calendars from the provider response
    for (const calendar of calendars) {
      await tx.providerCalendar.upsert({
        where: {
          connection_calendar_unique: {
            calendarConnectionId: connection.id,
            providerCalendarId: calendar.id,
          },
        },
        create: {
          calendarConnectionId: connection.id,
          providerCalendarId: calendar.id,
          name: calendar.name,
          timeZone: calendar.timeZone,
          isPrimary: calendar.isPrimary,
          isSelected: calendar.isSelected,
          isDeleted: calendar.isDeleted ?? false,
          isWritable: calendar.isWritable,
          providerData: calendar._rawData,
        },
        update: {
          // Only update provider-controlled fields, preserve user customizations
          name: calendar.name,
          timeZone: calendar.timeZone,
          isPrimary: calendar.isPrimary,
          isDeleted: calendar.isDeleted ?? false,
          isWritable: calendar.isWritable,
          lastSyncedAt: new Date(),
          providerData: calendar._rawData,
        },
      });
    }
  });

  return { success: true };
};

export const setCalendarSelection = async (params: {
  userId: string;
  calendarId: string;
  isSelected: boolean;
}) => {
  const { calendarId, isSelected } = params;

  const calendar = await prisma.providerCalendar.findFirst({
    where: { id: calendarId },
  });

  if (!calendar) {
    return { success: false, error: "Calendar not found" as const };
  }

  await prisma.providerCalendar.update({
    where: { id: calendarId },
    data: {
      isSelected,
    },
  });

  return { success: true };
};

export const setDefaultCalendar = async ({
  userId,
  calendarId,
}: {
  userId: string;
  calendarId: string | null;
}) => {
  if (calendarId) {
    const calendar = await prisma.providerCalendar.findFirst({
      where: { id: calendarId },
      select: {
        calendarConnectionId: true,
        calendarConnection: {
          select: { userId: true },
        },
      },
    });

    if (!calendar) {
      return { success: false, error: "Calendar not found" as const };
    }

    if (calendar.calendarConnection.userId !== userId) {
      return {
        success: false,
        error: "Calendar does not belong to user" as const,
      };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { defaultDestinationCalendarId: calendarId },
  });

  return { success: true };
};
