const express = require('express');

// 获取所有订单
module.exports = function (db) {
  const router = express.Router();

  // 获取所有订单
  router.get('/orders', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM orders ORDER BY time DESC');
      
      // 转换为前端期望的格式
      const orders = rows.map(row => ({
        id: row.id,
        pay_id: row.pay_id,
        'Complaint channel': row.complaint_channel,
        phone: row.phone,
        'Order Amount': row.order_amount,
        'Situation Explanation': row.situation_explanation,
        Indemnitor: row.indemnitor,
        'Compensation Amount': row.compensation_amount,
        status: row.status,
        time: row.time,  // 直接使用数据库中的时间
        Note: row.note,
        'Classification of Payers': row.classification_of_payers,  // 新增字段
        'Detailed explanation': row.detailed_explanation          // 新增字段
      }));
      
      res.json(orders);
    } catch (error) {
      console.error('获取订单失败:', error);
      res.status(500).json({ error: '获取订单失败' });
    }
  });

  // 根据状态获取订单
  router.get('/orders/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      // 解码并还原特殊字符
      const decodedStatus = decodeURIComponent(status).replace(/_SLASH_/g, '/');
      console.log('请求的状态:', status, '解码后的状态:', decodedStatus);

      const [rows] = await db.query('SELECT * FROM orders WHERE status = ? ORDER BY id DESC', [decodedStatus]);
      console.log('根据状态查询到的数据条数:', rows.length);
      console.log('查询结果:', rows);

      // 转换字段名以匹配前端期望的格式
      const transformedRows = rows.map(row => ({
        id: row.id,
        pay_id: row.pay_id,
        'Complaint channel': row.complaint_channel,
        phone: row.phone,
        'Order Amount': row.order_amount,
        'Situation Explanation': row.situation_explanation,
        Indemnitor: row.indemnitor,
        'Compensation Amount': row.compensation_amount,
        status: row.status,
        time: row.time ? row.time : new Date().toISOString().slice(0, 19).replace('T', ' '),
        Note: row.note
      }));

      console.log('返回给前端的数据:', transformedRows);
      res.json(transformedRows);
    } catch (error) {
      console.error('获取订单失败:', error);
      res.status(500).json({ error: '获取订单失败', details: error.message });
    }
  });

  // 添加订单
  router.post('/orders', async (req, res) => {
    try {
      // 从前端格式转换为数据库格式
      const {
        pay_id,
        'Complaint channel': complaint_channel,
        phone,
        'Order Amount': order_amount,
        'Situation Explanation': situation_explanation,
        Indemnitor: indemnitor,
        'Compensation Amount': compensation_amount,
        status,
        time,
        Note: note,
        'Classification of Payers': classification_of_payers,  // 新增字段
        'Detailed explanation': detailed_explanation          // 新增字段
      } = req.body;
      
      // 验证必填字段
      if (!pay_id || pay_id.length !== 28) {
        return res.status(400).json({ error: '支付编码必须为28位' });
      }
      
      if (!phone || phone.length !== 11) {
        return res.status(400).json({ error: '手机号必须为11位' });
      }

      const query = `
      INSERT INTO orders (
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        status, time, note, classification_of_payers, detailed_explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await db.query(query, [
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        status, time, note, classification_of_payers, detailed_explanation
      ]);

      // 返回前端期望的格式
      res.status(201).json({
        id: result.insertId,
        pay_id,
        'Complaint channel': complaint_channel,
        phone,
        'Order Amount': order_amount,
        'Situation Explanation': situation_explanation,
        Indemnitor: indemnitor,
        'Compensation Amount': compensation_amount,
        status,
        time: time,  // 使用用户选择的时间而不是当前时间
        Note: note,
        'Classification of Payers': classification_of_payers,   // 新增字段
        'Detailed explanation': detailed_explanation           // 新增字段
      });
    } catch (error) {
      console.error('添加订单失败:', error);
      res.status(500).json({ error: '添加订单失败' });
    }
  });

  // 更新订单
  router.put('/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // 从前端格式转换为数据库格式
      const {
        pay_id,
        'Complaint channel': complaint_channel,
        phone,
        'Order Amount': order_amount,
        'Situation Explanation': situation_explanation,
        Indemnitor: indemnitor,
        'Compensation Amount': compensation_amount,
        status,
        time,
        Note: note,
        'Classification of Payers': classification_of_payers,  // 新增字段
        'Detailed explanation': detailed_explanation          // 新增字段
      } = req.body;
      
      // 验证必填字段
      if (!pay_id || pay_id.length !== 28) {
        return res.status(400).json({ error: '支付编码必须为28位' });
      }
      
      if (!phone || phone.length !== 11) {
        return res.status(400).json({ error: '手机号必须为11位' });
      }

      // 状态映射，将前端状态值映射到数据库枚举值
      const statusMap = {
        '需赔付订单': '需赔付订单',
        '无需赔付订单': '无需赔付订单',
        '未处理订单/投诉': '未处理订单/投诉',
        '确认可赔付': '确认可赔付',
        '确认已赔付': '确认已赔付',
        '确认无需赔付': '确认无需赔付',
        '被驳回需赔付订单': '被驳回需赔付订单',
        '被驳回无需赔付': '被驳回无需赔付'
      };

      const dbStatus = statusMap[status] || status;
      
      // 处理日期格式，将ISO格式转换为MySQL DATETIME格式
      let mysqlTime = time;
      if (time && typeof time === 'string' && time.includes('T')) {
        // 将ISO格式(2025-11-23T04:09:20.000Z)转换为MySQL格式(2025-11-23 04:09:20)
        mysqlTime = time.replace('T', ' ').replace(/\.\d+Z$/, '');
      }

      const query = `
    UPDATE orders SET
      pay_id = ?, complaint_channel = ?, phone = ?, order_amount = ?,
      situation_explanation = ?, indemnitor = ?, compensation_amount = ?,
      status = ?, time = ?, note = ?, classification_of_payers = ?, detailed_explanation = ?
    WHERE id = ?
  `;

      await db.query(query, [
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        dbStatus, mysqlTime, note, classification_of_payers, detailed_explanation, id
      ]);

      // 返回前端期望的格式
      res.json({
        id: parseInt(id),
        pay_id,
        'Complaint channel': complaint_channel,
        phone,
        'Order Amount': order_amount,
        'Situation Explanation': situation_explanation,
        Indemnitor: indemnitor,
        'Compensation Amount': compensation_amount,
        status,
        time: mysqlTime,  // 使用转换后的MySQL时间格式
        Note: note,
        'Classification of Payers': classification_of_payers,   // 新增字段
        'Detailed explanation': detailed_explanation           // 新增字段
      });
    } catch (error) {
      console.error('更新订单失败:', error);
      res.status(500).json({ error: '更新订单失败' });
    }
  });

  // 删除订单
  router.delete('/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM orders WHERE id = ?', [id]);
      res.json({ message: '订单删除成功' });
    } catch (error) {
      console.error('删除订单失败:', error);
      res.status(500).json({ error: '删除订单失败' });
    }
  });

  return router;
};
