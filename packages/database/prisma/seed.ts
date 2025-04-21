import { PrismaClient } from "@prisma/client";
import { seedPolls } from "./seed/polls";
import { seedScheduledEvents } from "./seed/scheduled-events";
import { seedUsers } from "./seed/users";

const prisma = new PrismaClient();

async function main() {
  const users = await seedUsers();

  for (const user of users) {
    await seedPolls(user.id);
    await seedScheduledEvents(user.id);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
