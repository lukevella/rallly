ALTER TABLE "polls" ADD COLUMN "max_yes_votes_per_option" INTEGER;

ALTER TABLE "polls" ADD CONSTRAINT "polls_max_yes_votes_per_option_positive"
  CHECK ("max_yes_votes_per_option" IS NULL OR "max_yes_votes_per_option" > 0);
