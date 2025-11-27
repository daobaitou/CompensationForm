const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // 替换为你的 MySQL 用户名
  password: '123456', // 替换为你的 MySQL 密码
  database: 'compensation_db', // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 获取 Promise 版本的连接池
const promisePool = pool.promise();

module.exports = promisePool;

