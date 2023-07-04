-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'paused', 'deleted', 'trialing', 'past_due');

-- CreateTable
CREATE TABLE "user_payment_data" (
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "subscription_status" NOT NULL,
    "update_url" TEXT NOT NULL,
    "cancel_url" TEXT NOT NULL,

    CONSTRAINT "user_payment_data_pkey" PRIMARY KEY ("user_id")
);
