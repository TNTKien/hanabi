-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- View top 10 users by xu
SELECT user_id, username, xu 
FROM users 
ORDER BY xu DESC 
LIMIT 10;

-- Check migration test data
SELECT user_id, username, xu 
FROM users 
WHERE user_id IN ('123456789', '987654321', '555555555', '111111111', '222222222');
