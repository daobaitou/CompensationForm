const promisePool = require('../config/db');

// 插入初始权限数据
async function seedPermissions() {
  const permissions = [
    { name: 'add_order', description: '添加订单' },
    { name: 'edit_order', description: '编辑订单' },
    { name: 'process_basic_order', description: '处理待判责订单' },
    { name: 'process_pending_review_order', description: '处理待审核订单' },
    { name: 'process_payment_order', description: '赔付订单' },
    { name: 'manage_orders', description: '管理订单' },
    { name: 'manage_users', description: '管理用户' },
    { name: 'manage_permissions', description: '管理权限' },
    { name: 'view_reports', description: '查看报表' }
  ];

  try {
    // 检查现有的权限数据
    const [currentPermissions] = await promisePool.query('SELECT name, description FROM permissions');
    
    if (currentPermissions.length > 0) {
      console.log('权限数据已存在，检查是否有缺失的权限...');
      
      // 获取现有的权限名称
      const currentPermissionNames = currentPermissions.map(p => p.name);
      
      // 插入缺失的权限
      let insertedCount = 0;
      for (const permission of permissions) {
        if (!currentPermissionNames.includes(permission.name)) {
          await promisePool.query(
            'INSERT INTO permissions (name, description) VALUES (?, ?)', 
            [permission.name, permission.description]
          );
          console.log(`权限 "${permission.name}" 已添加`);
          insertedCount++;
        }
      }
      
      // 更新现有权限的描述（如果缺失）
      let updatedCount = 0;
      for (const permission of currentPermissions) {
        // 如果现有权限没有描述，则尝试更新
        if (!permission.description || permission.description.trim() === '') {
          const fullPermission = permissions.find(p => p.name === permission.name);
          if (fullPermission && fullPermission.description) {
            await promisePool.query(
              'UPDATE permissions SET description = ? WHERE name = ?',
              [fullPermission.description, fullPermission.name]
            );
            console.log(`权限 "${permission.name}" 的描述已更新`);
            updatedCount++;
          }
        }
      }
      
      if (insertedCount === 0 && updatedCount === 0) {
        console.log('所有权限均已存在且完整，无需更新');
      } else {
        if (insertedCount > 0) {
          console.log(`共插入 ${insertedCount} 个新权限`);
        }
        if (updatedCount > 0) {
          console.log(`共更新 ${updatedCount} 个权限的描述`);
        }
      }
      
      return;
    }

    // 插入所有权限数据
    for (const permission of permissions) {
      await promisePool.query(
        'INSERT INTO permissions (name, description) VALUES (?, ?)', 
        [permission.name, permission.description]
      );
    }
    
    console.log('权限数据插入成功');
  } catch (error) {
    console.error('处理权限数据时出错:', error);
  }
}

// 插入初始用户数据
async function seedUsers() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },  // 修改为admin角色
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
        }
      ];
      for (const data of testData) {
        await db.query(
          'INSERT INTO orders (pay_id, complaint_channel, phone, order_amount, situation_explanation, indemnitor, compensation_amount, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            data.pay_id,
            data.complaint_channel,
            data.phone,
            data.order_amount,
            data.situation_explanation,
            data.indemnitor,
            data.compensation_amount,
            data.status,
            data.note
          ]
        );
      }
      console.log('测试数据插入成功');
    } else {
      console.log('已有数据，跳过插入');
    }
    
    // 检查并确保权限数据存在
    console.log('开始检查权限数据...');
    const requiredPermissions = [
      { name: 'add_order', description: '添加订单' },
      { name: 'edit_order', description: '编辑订单' },
      { name: 'process_basic_order', description: '处理待判责订单' },
      { name: 'process_pending_review_order', description: '处理待审核订单' },
      { name: 'process_payment_order', description: '赔付订单' },
      { name: 'manage_orders', description: '管理订单' },
      { name: 'manage_users', description: '管理用户' },
      { name: 'manage_permissions', description: '管理权限' },
      { name: 'view_reports', description: '查看报表' }
    ];
    
    // 检查现有的权限数据
    const [existingPermissionsData] = await db.query('SELECT name, description FROM permissions');
    const existingPermissionNames = existingPermissionsData.map(p => p.name);
    
    // 插入缺失的权限
    for (const permission of requiredPermissions) {
      if (!existingPermissionNames.includes(permission.name)) {
        await db.query(
          'INSERT INTO permissions (name, description) VALUES (?, ?)', 
          [permission.name, permission.description]
        );
        console.log(`权限 "${permission.name}" 已添加`);
      }
    }
    
    // 更新现有权限的描述（如果缺失）
    let updatedCount = 0;
    for (const permission of existingPermissionsData) {
      // 如果现有权限没有描述，则尝试更新
      if (!permission.description || permission.description.trim() === '') {
        const fullPermission = requiredPermissions.find(p => p.name === permission.name);
        if (fullPermission && fullPermission.description) {
          await db.query(
            'UPDATE permissions SET description = ? WHERE name = ?',
            [fullPermission.description, fullPermission.name]
          );
          console.log(`权限 "${permission.name}" 的描述已更新`);
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      console.log(`共更新 ${updatedCount} 个权限的描述`);
    }
    
    console.log('权限数据检查完成');
    
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

module.exports = {
  seedPermissions,
  seedUsers,
  assignAdminPermissions
};
