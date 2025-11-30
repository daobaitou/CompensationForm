async function setupDatabase(db) {
  try {
    // 创建数据库
    await db.query('CREATE DATABASE IF NOT EXISTS compensation_db');
    console.log('数据库创建成功');
    
    // 切换到新创建的数据库
    await db.query('USE compensation_db');
    
    // 创建订单表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pay_id VARCHAR(50) NOT NULL,
        complaint_channel VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        order_amount DECIMAL(10, 2) NOT NULL,
        situation_explanation TEXT,
        indemnitor VARCHAR(100),
        compensation_amount DECIMAL(10, 2) DEFAULT 0.00,
        status ENUM('未处理订单/投诉', '需赔付订单', '无需赔付订单') NOT NULL,
        time DATETIME DEFAULT CURRENT_TIMESTAMP,
        note TEXT,
        classification_of_payers VARCHAR(100),  
        detailed_explanation TEXT,             
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableQuery);
    console.log('数据库表创建成功');

 // 创建用户表
 const createUserTableQuery = `
 CREATE TABLE IF NOT EXISTS users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(50) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 )
`;
await db.query(createUserTableQuery);
console.log('用户表创建成功');

    // 创建权限表
    const createPermissionsTableQuery = `
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255)
      )
    `;
    
    await db.query(createPermissionsTableQuery);
    console.log('权限表创建成功');

        // 创建用户权限关联表
        const createUserPermissionsTableQuery = `
        CREATE TABLE IF NOT EXISTS user_permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          permission_id INT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_permission (user_id, permission_id)
        )
      `;
      
      await db.query(createUserPermissionsTableQuery);
      console.log('用户权限关联表创建成功');

      
    // 检查是否需要添加图片存储字段
    try {
      await db.query('ALTER TABLE orders ADD COLUMN images JSON');
      console.log('图片存储字段添加成功');
    } catch (error) {
      // 字段可能已存在，忽略错误
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.error('添加图片字段时出错:', error);
      }
    }
  } catch (error) {
    console.error('数据库设置失败:', error);
  }
}


module.exports = setupDatabase;

