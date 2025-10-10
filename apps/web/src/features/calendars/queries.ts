import { prisma } from "@rallly/database";

export const getCalendars = async (userId: string) => {
  return await prisma.calendarConnection.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      provider: true,
      integrationId: true,
      providerCalendars: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          isSelected: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });
};

export const getDefaultCalendar = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultDestinationCalendarId: true },
  });
};
