async function seedData(db) {
  try {
    console.log('检查是否需要插入测试数据...');
    // 检查是否已经有数据
    const [existingRows] = await db.query('SELECT COUNT(*) as count FROM orders');
    console.log('现有数据条数:', existingRows[0].count);
    if (existingRows[0].count === 0) {
      console.log('开始插入测试数据...');
      // 插入测试数据
      const testData = [
        {
          pay_id: 'PAY001',
          complaint_channel: '客服电话',
          phone: '13800138000',
          order_amount: 100.00,
          situation_explanation: '商品质量问题',
          indemnitor: '张三',
          compensation_amount: 50.00,
          status: '未处理订单/投诉',
          note: '客户满意'
        },
        {
          pay_id: 'PAY002',
          complaint_channel: '在线客服',
          phone: '13900139000',
          order_amount: 200.00,
          situation_explanation: '物流延迟',
          indemnitor: '李四',
          compensation_amount: 30.00,
          status: '未处理订单/投诉',
          note: '补偿运费'
        },
        {
          pay_id: 'PAY003',
          complaint_channel: '客服电话',
          phone: '13700137000',
          order_amount: 150.00,
          situation_explanation: '包装破损',
          indemnitor: '王五',
          compensation_amount: 0.00,
          status: '无需赔付订单',
          note: '已修复无需赔偿'
        },
        {
          pay_id: 'PAY004',
          complaint_channel: '在线客服',
          phone: '13600136000',
          order_amount: 300.00,
          situation_explanation: '描述不符',
          indemnitor: '赵六',
          compensation_amount: 0.00,
          status: '无需赔付订单',
          note: '解释清楚无需赔偿'
        },
        {
          pay_id: 'PAY005',
          complaint_channel: '客服电话',
          phone: '13500135000',
          order_amount: 250.00,
          situation_explanation: '服务态度问题',
          indemnitor: '孙七',
          compensation_amount: 80.00,
          status: '需赔付订单',
          note: '道歉并赔偿'
        },
        {
          pay_id: 'PAY006',
          complaint_channel: '在线客服',
          phone: '13400134000',
          order_amount: 180.00,
          situation_explanation: '缺货',
          indemnitor: '周八',
          compensation_amount: 50.00,
          status: '需赔付订单',
          note: '补发并赔偿'
        }
      ];

      for (const data of testData) {
        const query = `
          INSERT INTO orders (
            pay_id, complaint_channel, phone, order_amount,
            situation_explanation, indemnitor, compensation_amount,
            status, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
          data.pay_id,
          data.complaint_channel,
          data.phone,
          data.order_amount,
          data.situation_explanation,
          data.indemnitor,
          data.compensation_amount,
          data.status,
          data.note
        ]);
      }
      
      console.log('测试数据插入成功');
    } else {
      console.log('数据已存在，跳过插入测试数据');
    }

    // 检查是否需要插入默认用户
    const [existingUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('现有用户数:', existingUsers[0].count);
    if (existingUsers[0].count === 0) {
      console.log('开始插入默认用户...');
      // 插入默认管理员用户 (用户名: admin, 密码: admin123)
      await db.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['admin', 'admin123']
      );
      console.log('默认用户插入完成');
    }
    
    // 检查是否需要插入默认权限
    const [existingPermissions] = await db.query('SELECT COUNT(*) as count FROM permissions');
    console.log('现有权限数:', existingPermissions[0].count);
    if (existingPermissions[0].count === 0) {
      console.log('开始插入默认权限...');
      // 更新权限定义，添加具体的业务权限
      const permissions = [
        { name: 'add_order', description: '添加订单' },
        { name: 'edit_order', description: '编辑订单' },
        { name: 'process_basic_order', description: '处理待判责订单' },
        { name: 'process_pending_review_order', description: '处理待审核订单' },
        { name: 'process_payment_order', description: '赔付订单' },
        { name: 'manage_users', description: '管理用户' },
        { name: 'manage_permissions', description: '管理权限' },
        { name: 'view_reports', description: '查看报表' }
      ];
      
      for (const permission of permissions) {
        await db.query(
          'INSERT INTO permissions (name, description) VALUES (?, ?)', 
          [permission.name, permission.description]
        );
      }
      console.log('默认权限插入完成');
    }
    
    // 检查是否需要为默认用户分配权限
    const [userPermissionCount] = await db.query('SELECT COUNT(*) as count FROM user_permissions');
    console.log('现有用户权限关联数:', userPermissionCount[0].count);
    if (userPermissionCount[0].count === 0) {
      console.log('开始为默认用户分配权限...');
      // 获取默认用户ID
      const [users] = await db.query('SELECT id FROM users WHERE username = ?', ['admin']);
      if (users.length > 0) {
        const userId = users[0].id;
        
        // 获取所有权限ID
        const [permissions] = await db.query('SELECT id FROM permissions');
        
        // 为用户分配所有权限
        for (const permission of permissions) {
          await db.query(
            'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
            [userId, permission.id]
          );
        }
        console.log('默认用户权限分配完成');
      } else {
        console.log('未找到默认用户，跳过权限分配');
      }
    }
    
  } catch (error) {
    console.error('插入测试数据失败:', error);
  }
}

const promisePool = require('../config/db');

// 插入初始权限数据
async function seedPermissions() {
  const permissions = [
    'manage_orders',       // 管理订单权限
    'add_order',           // 添加订单权限
    'edit_order',          // 编辑订单权限
    'process_basic_order', // 处理待判责订单权限
    'process_pending_review_order', // 处理待审核订单权限
    'process_payment_order',        // 赔付订单权限
    'manage_users',        // 管理用户权限
    'manage_permissions',  // 管理权限权限
    'view_reports'         // 查看报表权限
  ];

  try {
    // 检查是否已存在权限数据
    const [existingPermissions] = await promisePool.query('SELECT COUNT(*) as count FROM permissions');
    
    if (existingPermissions[0].count > 0) {
      console.log('权限数据已存在，跳过插入');
      return;
    }

    // 插入权限数据
    for (const permission of permissions) {
      await promisePool.query('INSERT INTO permissions (name) VALUES (?)', [permission]);
    }
    
    console.log('权限数据插入成功');
  } catch (error) {
    console.error('插入权限数据时出错:', error);
  }
}

// 插入初始用户数据
async function seedUsers() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'user' },
    { username: 'superadmin', password: 'superadmin123', role: 'admin' }
  ];

  try {
    // 检查是否已存在用户数据
    const [existingUsers] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count > 0) {
      console.log('用户数据已存在，跳过插入');
      return;
    }

    // 插入用户数据
    for (const user of users) {
      await promisePool.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [user.username, user.password, user.role]
      );
    }
    
    console.log('用户数据插入成功');
  } catch (error) {
    console.error('插入用户数据时出错:', error);
  }
}

// 为管理员用户分配所有权限
async function assignAdminPermissions() {
  try {
    // 获取管理员用户
    const [adminUsers] = await promisePool.query(
      'SELECT id FROM users WHERE username = ? AND role = ?', 
      ['superadmin', 'admin']
    );
    
    if (adminUsers.length === 0) {
      console.log('未找到管理员用户，跳过权限分配');
      return;
    }
    
    const adminUserId = adminUsers[0].id;
    
    // 获取所有权限
    const [permissions] = await promisePool.query('SELECT id FROM permissions');
    
    // 检查是否已分配权限
    const [existingPermissions] = await promisePool.query(
      'SELECT COUNT(*) as count FROM user_permissions WHERE user_id = ?',
      [adminUserId]
    );
    
    if (existingPermissions[0].count > 0) {
      console.log('管理员权限已分配，跳过分配');
      return;
    }
    
    // 为管理员用户分配所有权限
    for (const permission of permissions) {
      await promisePool.query(
        'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
        [adminUserId, permission.id]
      );
    }
    
    console.log('管理员权限分配成功');
  } catch (error) {
    console.error('分配管理员权限时出错:', error);
  }
}

module.exports = {
  seedPermissions,
  seedUsers,
  assignAdminPermissions
};
