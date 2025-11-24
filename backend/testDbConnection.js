const mysql = require('mysql2');

// 测试数据库连接
const pool = mysql.createPool({
  host: 'localhost',
  user: 'compensation_user',
  password: 'compensation_password',
  database: 'compensation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

async function testConnection() {
  try {
    console.log('尝试连接数据库...');
    const connection = await promisePool.getConnection();
    console.log('数据库连接成功!');
    
    // 测试查询
    const [rows] = await promisePool.query('SELECT 1 as test');
    console.log('查询测试结果:', rows);
    
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    await promisePool.end();
  }
}

testConnection();
