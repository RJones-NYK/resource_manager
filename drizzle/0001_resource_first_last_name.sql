ALTER TABLE "resources" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "last_name" text;--> statement-breakpoint
UPDATE "resources"
SET
  "first_name" = CASE
    WHEN position(' ' in "name") > 0 THEN split_part("name", ' ', 1)
    ELSE "name"
  END,
  "last_name" = CASE
    WHEN position(' ' in "name") > 0 THEN trim(substring("name" from position(' ' in "name") + 1))
    ELSE ''
  END;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN "name";
