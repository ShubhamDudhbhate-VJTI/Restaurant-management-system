UPDATE `tables`
SET `status` = CASE
  WHEN `status` = 'free' THEN 'available'
  WHEN `status` = 'held' THEN 'occupied'
  ELSE `status`
END
WHERE `status` IN ('free', 'held');
