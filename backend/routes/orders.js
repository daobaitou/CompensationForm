const express = require('express');

// 获取所有订单
module.exports = function (db) {
  const router = express.Router();

  // 获取所有订单
  router.get('/orders', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC');
      console.log('从数据库获取的所有订单:', rows);
      console.log('订单总数:', rows.length);

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
        Note: row.note,
        'Classification of Payers': row.classification_of_payers,
        'Detailed explanation': row.detailed_explanation
      }));

      console.log('转换后的数据:', transformedRows);
      res.json(transformedRows);
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
        Note: note,
        'Classification of Payers': classification_of_payers,  // 新增字段
        'Detailed explanation': detailed_explanation          // 新增字段
      } = req.body;

      const query = `
      INSERT INTO orders (
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        status, note, classification_of_payers, detailed_explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await db.query(query, [
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        status, note, classification_of_payers, detailed_explanation
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
        time: new Date().toISOString().slice(0, 19).replace('T', ' '),
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
        Note: note,
        'Classification of Payers': classification_of_payers,  // 新增字段
        'Detailed explanation': detailed_explanation          // 新增字段
      } = req.body;

      const query = `
    UPDATE orders SET
      pay_id = ?, complaint_channel = ?, phone = ?, order_amount = ?,
      situation_explanation = ?, indemnitor = ?, compensation_amount = ?,
      status = ?, note = ?, classification_of_payers = ?, detailed_explanation = ?
    WHERE id = ?
  `;

      await db.query(query, [
        pay_id, complaint_channel, phone, order_amount,
        situation_explanation, indemnitor, compensation_amount,
        status, note, classification_of_payers, detailed_explanation, id
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
        time: new Date().toISOString().slice(0, 19).replace('T', ' '),
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