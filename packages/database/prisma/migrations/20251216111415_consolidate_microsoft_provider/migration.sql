-- Step 1: For the case with different users sharing the same providerAccountId,
-- delete the OLDER account link (keep the newer one so they can still log in)
WITH different_user_duplicates AS (
  SELECT 
    a.id,
    ROW_NUMBER() OVER (
      PARTITION BY a."provider_account_id" 
      ORDER BY a.created_at DESC  -- Keep newest
    ) as rn
  FROM accounts a
  WHERE a.provider IN ('microsoft-entra-id', 'azure-ad', 'microsoft')
    AND a."provider_account_id" IN (
      SELECT "provider_account_id"
      FROM accounts
      WHERE provider IN ('microsoft-entra-id', 'azure-ad', 'microsoft')
      GROUP BY "provider_account_id"
      HAVING COUNT(DISTINCT user_id) > 1
    )
)
DELETE FROM accounts 
WHERE id IN (SELECT id FROM different_user_duplicates WHERE rn > 1);

-- Step 2: Delete same-user duplicates (keep 'microsoft' or newest)
WITH same_user_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "provider_account_id" 
    ORDER BY 
      CASE provider WHEN 'microsoft' THEN 0 ELSE 1 END,
      created_at DESC
  ) as rn
  FROM accounts
  WHERE provider IN ('microsoft-entra-id', 'azure-ad', 'microsoft')
)
DELETE FROM accounts 
WHERE id IN (SELECT id FROM same_user_duplicates WHERE rn > 1);

-- Step 3: Rename remaining legacy providers
UPDATE accounts 
SET provider = 'microsoft' 
WHERE provider IN ('microsoft-entra-id', 'azure-ad');