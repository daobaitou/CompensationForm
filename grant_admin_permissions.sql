-- 为超级管理员用户分配所有权限
-- 首先清空该用户的现有权限（如果有的话）
DELETE FROM user_permissions WHERE user_id = 2;

-- 为用户ID为2的超级管理员(superadmin)分配所有权限
INSERT INTO user_permissions (user_id, permission_id) 
SELECT 2, id FROM permissions;

-- 验证权限分配结果
SELECT u.username, p.name, p.description 
FROM user_permissions up 
JOIN users u ON up.user_id = u.id 
JOIN permissions p ON up.permission_id = p.id 
WHERE u.id = 2;
