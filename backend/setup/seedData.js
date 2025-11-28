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
      const permissions = ['manage_orders', 'manage_users', 'manage_permissions', 'view_reports'];
      for (const permission of permissions) {
        await db.query('INSERT INTO permissions (name) VALUES (?)', [permission]);
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

module.exports = seedData;