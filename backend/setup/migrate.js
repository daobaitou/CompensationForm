async function migrateDatabase(db) {
  try {
    // 切换到数据库
    await db.query('USE compensation_db');
    
    // 添加 Classification of Payers 字段
    try {
      await db.query('ALTER TABLE orders ADD COLUMN classification_of_payers VARCHAR(100)');
      console.log('成功添加 classification_of_payers 字段');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.error('添加 classification_of_payers 字段时出错:', error);
      } else {
        console.log('classification_of_payers 字段已存在');
      }
    }
    
    // 添加 Detailed explanation 字段
    try {
      await db.query('ALTER TABLE orders ADD COLUMN detailed_explanation TEXT');
      console.log('成功添加 detailed_explanation 字段');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.error('添加 detailed_explanation 字段时出错:', error);
      } else {
        console.log('detailed_explanation 字段已存在');
      }
    }
    
    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error);
  }
}

module.exports = migrateDatabase;