const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const setupDatabase = require('./setup/dbSetup');
const seedData = require('./setup/seedData');
const imageRoutes = require('./routes/image'); // 添加图片路由

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // 静态文件服务

//根路径
app.get('/', (req, res) => {
  res.json({ message: '赔偿表单管理系统 API' });
});

// 图片上传路由
app.use('/api/images', imageRoutes);
// 初始化数据库
async function init() {
  let dbPool;
  try {
    console.log('开始初始化数据库...');
    
    // 先创建不指定数据库的连接池
    const initialPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '1',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }).promise();
    
    console.log('创建初始连接池成功');
    
    // 将初始连接池传递给数据库设置函数
    await setupDatabase(initialPool);
    console.log('数据库初始化成功');
    
    // 现在创建指定数据库的连接池
    dbPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '1',
      database: 'compensation_db', // 现在可以指定数据库了
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }).promise();
    
    console.log('创建数据库连接池成功');
    
    // 插入测试数据
    await seedData(dbPool);
    console.log('测试数据插入完成');
    
    // 设置路由，传入数据库连接池
    const orderRoutes = require('./routes/orders')(dbPool);
    app.use('/api', orderRoutes);
    
    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
    
    // 错误处理
    server.on('error', (error) => {
      console.error('服务器启动错误:', error);
    });
    
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

init();