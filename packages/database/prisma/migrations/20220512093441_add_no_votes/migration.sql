-- Previously we only stored "yes" and "ifNeedBe" votes and assumed missing votes are "no"
-- Since we want to differentiate between "no" and did not vote yet we want to include "no" votes
-- in this table
INSERT INTO votes (id, poll_id, participant_id, option_id, type)
SELECT nanoid(), poll_id, participant_id, option_id, 'no'
FROM (
  SELECT o.poll_id, p.id participant_id, o.id option_id
  FROM options o
  JOIN participants p ON o.poll_id = p.poll_id
EXCEPT
  SELECT poll_id, participant_id, option_id
  FROM votes
) AS missing;
