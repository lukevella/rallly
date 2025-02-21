-- Create the enum type
CREATE TYPE subscription_interval AS ENUM ('day', 'week', 'month', 'year');

-- Add the new column
ALTER TABLE subscriptions ADD COLUMN interval_enum subscription_interval;

-- Populate the new column
UPDATE subscriptions 
SET interval_enum = CASE 
    WHEN interval = 'month' THEN 'month'::subscription_interval
    WHEN interval = 'year' THEN 'year'::subscription_interval
    ELSE NULL 
END;

-- Make the new column required
ALTER TABLE subscriptions ALTER COLUMN interval_enum SET NOT NULL;

-- Drop the old column
ALTER TABLE subscriptions DROP COLUMN interval;

-- Rename the new column to interval
ALTER TABLE subscriptions RENAME COLUMN interval_enum TO interval;
