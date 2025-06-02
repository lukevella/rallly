-- CreateTable
CREATE TABLE "instance_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "disable_user_registration" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instance_settings_pkey" PRIMARY KEY ("id")
);

-- Create default instance settings
INSERT INTO "instance_settings" ("id", "disable_user_registration") VALUES (1, false);
