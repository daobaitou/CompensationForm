const express = require('express');
const jwt = require('jsonwebtoken');

// 获取所有订单
const router = express.Router();

module.exports = function (dbInstance) {
  db = dbInstance;

  // 登录接口
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('收到登录请求:', { username, password });

      if (!username || !password) {
        console.log('用户名或密码为空');
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }

      const query = 'SELECT * FROM users WHERE username = ?';
      console.log('执行数据库查询:', query, [username]);
      
      const [results] = await db.query(query, [username]);
      console.log('数据库查询结果:', results);

      if (results.length === 0) {
        console.log('未找到用户:', username);
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const user = results[0];
      console.log('找到用户:', user);

      if (password !== user.password) {
        console.log('密码不匹配');
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      console.log('密码匹配，生成JWT令牌');
      
      // 获取用户权限
      let permissions = [];
      if (user.role !== 'admin') {
        // 普通用户需要查询权限
        const [permissionResults] = await db.query(
          `SELECT p.name FROM permissions p 
           JOIN user_permissions up ON p.id = up.permission_id 
           WHERE up.user_id = ?`, 
          [user.id]
        );
        permissions = permissionResults.map(p => p.name);
      } else {
        // 超级管理员拥有所有权限
        permissions = ['manage_orders', 'manage_users', 'manage_permissions', 'view_reports'];
      }
      
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: user.role,
          permissions: permissions
        },
        process.env.JWT_SECRET || 'compensation_secret_key',
        { expiresIn: '24h' }
      );

      console.log('JWT令牌生成成功');
      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: permissions
        }
      });
    } catch (error) {
      console.error('登录处理错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  });
  
  // 登出接口
router.post('/logout', (req, res) => {
  // 对于JWT token，服务端不需要特别处理登出
  // 因为JWT是无状态的，客户端只需删除token即可
  // 但我们可以在这里记录登出日志或执行其他清理操作
  
  console.log('用户登出');
  res.json({ message: '登出成功' });
});

// 验证token接口
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 如果是旧令牌，可能没有role字段，需要重新查询数据库
    if (!decoded.role) {
      try {
        const [results] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (results.length > 0) {
          decoded.role = results[0].role || 'user';
        } else {
          decoded.role = 'user';
        }
      } catch (dbErr) {
        console.error('数据库查询错误:', dbErr);
        decoded.role = 'user';
      }
    }

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        permissions: decoded.permissions
      }
    });
  });
});

// 获取所有用户（仅管理员）
router.get('/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否为管理员
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    try {
      // 查询所有用户及其权限
      const query = `
        SELECT u.id, u.username, u.role, GROUP_CONCAT(p.name) as permissions 
        FROM users u 
        LEFT JOIN user_permissions up ON u.id = up.user_id 
        LEFT JOIN permissions p ON up.permission_id = p.id 
        GROUP BY u.id, u.username, u.role
      `;

      const [results] = await db.query(query);

      // 处理权限字段，确保返回数组格式
      const users = results.map(user => ({
        ...user,
        permissions: user.role === 'admin' 
          ? [] // 管理员拥有所有权限，不需要特定权限列表
          : (user.permissions ? user.permissions.split(',') : [])
      }));

      res.json({ users });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ message: '服务器内部错误' });
    }
  });
});

// 获取所有权限（仅管理员）
router.get('/permissions', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否为管理员
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    try {
      // 获取所有权限
      const [permissions] = await db.query('SELECT id, name FROM permissions ORDER BY id');
      
      res.json({
        permissions: permissions.map(p => ({
          id: p.id,
          name: p.name
        }))
      });
    } catch (error) {
      console.error('获取权限错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  });
});

// 创建用户（仅管理员）
router.post('/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否为管理员
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    try {
      const { username, password, role = 'user', permissions = [] } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }

      // 检查用户名是否已存在
      const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: '用户名已存在' });
      }

      // 开始事务
      await db.query('BEGIN');

      try {
        // 插入新用户
        const [result] = await db.query(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [username, password, role]
        );

        const userId = result.insertId;

        // 如果是普通用户并且有权限设置，则添加权限
        if (role === 'user' && Array.isArray(permissions) && permissions.length > 0) {
          // 获取权限ID
          const placeholders = permissions.map(() => '?').join(',');
          const [permissionResults] = await db.query(
            `SELECT id FROM permissions WHERE name IN (${placeholders})`,
            permissions
          );

          const permissionIds = permissionResults.map(p => p.id);

          // 插入用户权限关联
          if (permissionIds.length > 0) {
            const insertValues = permissionIds.map(pid => [userId, pid]);
            const insertPlaceholders = insertValues.map(() => '(?, ?)').join(',');
            const insertParams = insertValues.flat();

            await db.query(
              `INSERT INTO user_permissions (user_id, permission_id) VALUES ${insertPlaceholders}`,
              insertParams
            );
          }
        }

        // 提交事务
        await db.query('COMMIT');

        res.status(201).json({
          message: '用户创建成功',
          user: {
            id: userId,
            username,
            role
          }
        });
      } catch (error) {
        // 回滚事务
        await db.query('ROLLBACK');
        console.error('创建用户权限错误:', error);
        throw error;
      }
    } catch (error) {
      console.error('创建用户错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  });
});

// 更新用户（仅管理员）
router.put('/users/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const userId = req.params.id;

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否为管理员
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    try {
      const { role, permissions } = req.body;

      // 检查用户是否存在
      const [existingUsers] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (existingUsers.length === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // 开始事务
      await db.query('BEGIN');

      try {
        // 更新用户角色
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

        // 如果是普通用户，更新权限
        if (role === 'user') {
          // 删除现有权限
          await db.query('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

          // 如果有新权限，添加它们
          if (Array.isArray(permissions) && permissions.length > 0) {
            // 获取权限ID
            const placeholders = permissions.map(() => '?').join(',');
            const [permissionResults] = await db.query(
              `SELECT id FROM permissions WHERE name IN (${placeholders})`,
              permissions
            );

            const permissionIds = permissionResults.map(p => p.id);

            // 插入用户权限关联
            if (permissionIds.length > 0) {
              const insertValues = permissionIds.map(pid => [userId, pid]);
              const insertPlaceholders = insertValues.map(() => '(?, ?)').join(',');
              const insertParams = insertValues.flat();

              await db.query(
                `INSERT INTO user_permissions (user_id, permission_id) VALUES ${insertPlaceholders}`,
                insertParams
              );
            }
          }
        } else {
          // 如果用户是管理员，删除其所有权限记录
          await db.query('DELETE FROM user_permissions WHERE user_id = ?', [userId]);
        }

        // 提交事务
        await db.query('COMMIT');

        res.json({
          message: '用户更新成功'
        });
      } catch (error) {
        // 回滚事务
        await db.query('ROLLBACK');
        console.error('更新用户权限错误:', error);
        throw error;
      }
    } catch (error) {
      console.error('更新用户错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  });
});

  return router;
};