const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const setupDatabase = require('./setup/dbSetup');
const seedData = require('./setup/seedData');
const imageRoutes = require('./routes/image'); // 添加图片路由
const migrateDatabase = require('./setup/migrate');
const authRoutes = require('./routes/auth'); // 添加认证路由

// 导入数据库配置
const dbConfig = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use('/uploads', express.static('uploads')); // 静态文件服务
//app.use('/api/auth', authRoutes(dbPool));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

//根路径
app.get('/', (req, res) => {
  res.json({ message: '赔偿表单管理系统 API' });
});

// 图片上传路由
app.use('/api/images', imageRoutes);

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({ error: '服务器内部错误', details: err.message });
});

// 初始化数据库
async function init() {
  let dbPool;
  try {
    console.log('开始初始化数据库...');
    
    // 先创建不指定数据库的连接池
    const initialPool = dbConfig;
    
    console.log('创建初始连接池成功');
    
    // 将初始连接池传递给数据库设置函数
    await setupDatabase(initialPool);
    console.log('数据库初始化成功');
    
    // 现在创建指定数据库的连接池
    dbPool = dbConfig;
    
    console.log('创建数据库连接池成功');
    
    // 执行数据库迁移
    await migrateDatabase(dbPool);
    console.log('数据库迁移已执行');

    // 插入测试数据
    await seedData(dbPool);
    console.log('测试数据插入完成');

    // 注册认证路由
    app.use('/api/auth', authRoutes(dbPool));
    
    // 设置路由，传入数据库连接池
    const orderRoutes = require('./routes/orders')(dbPool);
    app.use('/api', orderRoutes);
    
    // 404处理
    app.use((req, res) => {
      console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: '接口不存在' });
    });
    
    // 启动服务器
    const server = app.listen(PORT, '0.0.0.0',() =>{
      console.log(`服务器运行在端口 ${PORT}`);
    });
    
    // 错误处理
    server.on('error', (error) => {
      console.error('服务器启动错误:', error);
    });
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1); // 出现严重错误时退出进程
  }
}

// 启动初始化函数
init();

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});