const mysql = require('mysql2/promise');

// 使用与应用相同的数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'compensation_user',
  password: 'compensation_password',
  database: 'compensation_db'
};

async function migrateDatabase() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 修改status字段，扩展枚举值以匹配前端定义
    const alterTableQuery = `
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM(
        '未处理订单/投诉',
        '需赔付订单',
        '无需赔付订单',
        '确认可赔付',
        '确认已赔付',
        '确认无需赔付',
        '被驳回需赔付订单',
        '被驳回无需赔付'
      ) NOT NULL
    `;
    
    await connection.query(alterTableQuery);
    console.log('数据库表结构更新成功: status字段的枚举值已扩展');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 导出迁移函数
module.exports = migrateDatabase;