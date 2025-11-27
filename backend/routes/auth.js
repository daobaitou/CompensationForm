const express = require('express');
const jwt = require('jsonwebtoken');

// 获取所有订单
const router = express.Router();

module.exports = function (dbInstance) {
  db = dbInstance;

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  // 查询用户及其权限
  const query = `
    SELECT u.*, GROUP_CONCAT(p.name) as permissions 
    FROM users u 
    LEFT JOIN user_permissions up ON u.id = up.user_id 
    LEFT JOIN permissions p ON up.permission_id = p.id 
    WHERE u.username = ? 
    GROUP BY u.id
  `;
  
  db.query(query, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ message: '服务器内部错误' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = results[0];

    // 直接比较密码（无加密）
    if (password !== user.password) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        permissions: user.permissions ? user.permissions.split(',') : []
      },
      process.env.JWT_SECRET || 'compensation_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions ? user.permissions.split(',') : []
      }
    });
  });
});

// 验证token接口
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
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

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否有管理用户权限
    if (!decoded.permissions.includes('manage_users')) {
      return res.status(403).json({ message: '权限不足' });
    }

    // 查询所有用户及其权限
    const query = `
      SELECT u.id, u.username, GROUP_CONCAT(p.name) as permissions 
      FROM users u 
      LEFT JOIN user_permissions up ON u.id = up.user_id 
      LEFT JOIN permissions p ON up.permission_id = p.id 
      GROUP BY u.id
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ message: '服务器内部错误' });
      }

      // 处理权限字段，确保返回数组格式
      const users = results.map(user => ({
        ...user,
        permissions: user.permissions ? user.permissions.split(',') : []
      }));

      res.json({ users });
    });
  });
});

// 获取所有权限
router.get('/permissions', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'compensation_secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '令牌无效或已过期' });
    }

    // 检查用户是否有管理权限权限
    if (!decoded.permissions.includes('manage_permissions')) {
      return res.status(403).json({ message: '权限不足' });
    }

    // 查询所有权限
    const query = 'SELECT * FROM permissions';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('数据库查询错误:', err);
        return res.status(500).json({ message: '服务器内部错误' });
      }

      res.json({ permissions: results });
    });
  });
});

  return router;
};