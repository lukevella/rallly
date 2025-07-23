-- CreateTable
CREATE TABLE "space_member_invites" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role" "SpaceMemberRole" NOT NULL DEFAULT 'MEMBER',
    "inviter_id" TEXT NOT NULL,

    CONSTRAINT "space_member_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "space_member_invites_space_id_idx" ON "space_member_invites" USING HASH ("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_member_invites_space_id_email_key" ON "space_member_invites"("space_id", "email");

-- AddForeignKey
ALTER TABLE "space_member_invites" ADD CONSTRAINT "space_member_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_member_invites" ADD CONSTRAINT "space_member_invites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
