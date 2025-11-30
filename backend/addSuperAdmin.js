const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'compensation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function addSuperAdmin() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 检查用户表是否已有 role 字段
    const [columns] = await connection.execute('SHOW COLUMNS FROM users LIKE "role"');
    
    if (columns.length === 0) {
      // 添加 role 字段
      await connection.execute('ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT "user"');
      console.log('成功添加 role 字段到 users 表');
    } else {
      console.log('role 字段已存在');
    }
    
    // 创建超级管理员用户
    const superAdmin = {
      username: 'superadmin',
      password: 'superadmin123',
      role: 'admin'
    };
    
    // 检查是否已存在同名用户
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ?', 
      [superAdmin.username]
    );
    
    if (existingUsers.length > 0) {
      console.log(`用户 "${superAdmin.username}" 已存在`);
      
      // 更新现有用户的角色为管理员
      await connection.execute(
        'UPDATE users SET role = ? WHERE username = ?', 
        [superAdmin.role, superAdmin.username]
      );
      console.log(`用户 "${superAdmin.username}" 的角色已更新为超级管理员`);
    } else {
      // 插入新的超级管理员用户
      const [result] = await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [superAdmin.username, superAdmin.password, superAdmin.role]
      );
      console.log(`成功创建超级管理员用户: ${superAdmin.username}`);
      console.log(`用户ID: ${result.insertId}`);
    }
    
  } catch (error) {
    console.error('添加超级管理员失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此脚本，则执行添加超级管理员操作
if (require.main === module) {
  addSuperAdmin();
}

// 导出函数供其他模块使用
module.exports = addSuperAdmin;