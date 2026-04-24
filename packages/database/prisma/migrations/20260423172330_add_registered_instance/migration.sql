-- CreateTable
CREATE TABLE "registered_instances" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registered_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registered_instances_instance_id_key" ON "registered_instances"("instance_id");
