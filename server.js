require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const googleSheetsService = require('./services/googleSheets');
const zaloApiService = require('./services/zaloApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Thư mục dữ liệu
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL;
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const PLAYED_PHONES_FILE = path.join(DATA_DIR, 'played_phones.json');
const CUSTOMERS_JSON_FILE = path.join(DATA_DIR, 'customers.json');
const CUSTOMERS_CSV_FILE = path.join(DATA_DIR, 'customers.csv');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CUSTOMERS_CSV_FILE)) {
    const csvHeader = '\uFEFF"Thời Gian","Họ và Tên","Số Điện Thoại","Giải Thưởng","Mã Voucher","Trạng Thái Zalo"\n';
    fs.writeFileSync(CUSTOMERS_CSV_FILE, csvHeader, 'utf8');
  }
} catch (err) {
  console.error('[INIT ERROR] Không thể tạo file cục bộ (có thể do môi trường serverless chỉ đọc):', err.message);
}

let playedPhones = new Set();

function loadPlayedPhones() {
  try {
    if (fs.existsSync(PLAYED_PHONES_FILE)) {
      const data = fs.readFileSync(PLAYED_PHONES_FILE, 'utf8');
      const list = JSON.parse(data);
      playedPhones = new Set(list);
    }
  } catch (err) {}
}

function savePlayedPhones() {
  try {
    fs.writeFileSync(PLAYED_PHONES_FILE, JSON.stringify(Array.from(playedPhones), null, 2), 'utf8');
  } catch (err) {}
}

function saveCustomerLocal(customerRecord) {
  try {
    let customers = [];
    if (fs.existsSync(CUSTOMERS_JSON_FILE)) {
      const content = fs.readFileSync(CUSTOMERS_JSON_FILE, 'utf8');
      if (content.trim()) customers = JSON.parse(content);
    }
    customers.unshift(customerRecord);
    fs.writeFileSync(CUSTOMERS_JSON_FILE, JSON.stringify(customers, null, 2), 'utf8');

    const csvLine = `"${customerRecord.timestamp}","${customerRecord.fullName}","${customerRecord.phone}","${customerRecord.prizeName}","${customerRecord.couponCode}","${customerRecord.zaloStatus}"\n`;
    fs.appendFileSync(CUSTOMERS_CSV_FILE, csvLine, 'utf8');
  } catch (err) {
    console.error('[LOCAL STORAGE ERROR]', err.message);
  }
}

loadPlayedPhones();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LUCKY-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Pre-check endpoint
app.post('/api/webhook/check-phone', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Thiếu SĐT' });

  const formattedPhone = zaloApiService.formatZaloPhone(phone);
  
  // 1. Kiểm tra bộ nhớ tạm (phòng hờ đánh spam liên tục)
  if (playedPhones.has(formattedPhone)) {
    return res.json({
      success: true,
      alreadySpun: true,
      formattedPhone,
      message: 'Số điện thoại này đã tham gia quay thưởng trước đó.'
    });
  }

  // 2. Kiểm tra trực tiếp trên Google Sheets (đảm bảo tuyệt đối)
  const existsOnSheet = await googleSheetsService.checkPhoneExists(formattedPhone);
  if (existsOnSheet) {
    playedPhones.add(formattedPhone); // Cache lại vào bộ nhớ
    return res.json({
      success: true,
      alreadySpun: true,
      formattedPhone,
      message: 'Số điện thoại này đã tham gia quay thưởng trước đó.'
    });
  }

  return res.json({
    success: true,
    alreadySpun: false,
    formattedPhone,
    message: 'Số điện thoại hợp lệ.'
  });
});

app.get('/api/admin/export-customers', (req, res) => {
  if (fs.existsSync(CUSTOMERS_CSV_FILE)) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="DanhSachKhachHang_VongQuay.csv"');
    return res.sendFile(CUSTOMERS_CSV_FILE);
  } else {
    return res.status(404).send('Chưa có dữ liệu khách hàng.');
  }
});

const handleLuckyWheelWebhook = async (req, res) => {
  try {
    const { fullName, phone, prizeName, prizeCode } = req.body;

    if (!fullName || !phone || !prizeName) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc: fullName, phone, prizeName.'
      });
    }

    const formattedPhone = zaloApiService.formatZaloPhone(phone);

    // Kiểm tra trùng lặp lần cuối trước khi quay
    if (playedPhones.has(formattedPhone) || await googleSheetsService.checkPhoneExists(formattedPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Số điện thoại này đã tham gia quay thưởng rồi.'
      });
    }
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const couponCode = prizeCode || generateCouponCode();

    console.log(`\n---------------------------------------------------------`);
    console.log(`[WEBHOOK TEST SPIN] ${timestamp}`);
    console.log(`- Họ Tên      : ${fullName}`);
    console.log(`- SĐT         : ${phone} -> Formatted: ${formattedPhone}`);
    console.log(`- Giải Thưởng  : ${prizeName}`);
    console.log(`- Mã Ưu Đãi    : ${couponCode}`);
    console.log(`---------------------------------------------------------`);

    // 1. Kích hoạt Zalo API
    const zaloResult = await zaloApiService.sendWinnerNotification({
      fullName,
      phone,
      prizeName,
      couponCode
    });

    // 2. Đồng bộ Google Sheets
    const sheetResult = await googleSheetsService.appendWinnerRecord({
      timestamp,
      fullName,
      phone,
      prizeName,
      couponCode,
      zaloStatus: zaloResult.zaloStatus || 'Thành công'
    });

    // 3. Lưu dữ liệu file cục bộ
    saveCustomerLocal({
      timestamp,
      fullName,
      phone: formattedPhone,
      prizeName,
      couponCode,
      zaloStatus: zaloResult.zaloStatus || 'Thành công'
    });

    playedPhones.add(formattedPhone);
    savePlayedPhones();

    return res.status(200).json({
      success: true,
      message: 'Xử lý lượt quay thành công.',
      data: {
        timestamp,
        fullName,
        phone: formattedPhone,
        prizeName,
        couponCode,
        spaZaloPhone: process.env.SPA_ZALO_PHONE || '0339603960',
        zaloGroupUrl: process.env.ZALO_GROUP_URL || 'https://zalo.me/g/pdv89aulcjcossbvgxbt?joinSrc=9',
        zalo: zaloResult,
        sheet: sheetResult
      }
    });

  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi xử lý Webhook.',
      details: err.message
    });
  }
};

app.post('/webhook/lucky-wheel', handleLuckyWheelWebhook);
app.post('/api/webhook/lucky-wheel', handleLuckyWheelWebhook);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mode: 'UNLIMITED_TEST_MODE',
    totalPlayedPhones: playedPhones.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    hasWebhookUrl: !!process.env.GOOGLE_SHEET_WEBHOOK_URL,
    hasZaloGroup: !!process.env.ZALO_GROUP_URL,
    webhookUrlStart: process.env.GOOGLE_SHEET_WEBHOOK_URL ? process.env.GOOGLE_SHEET_WEBHOOK_URL.substring(0, 30) + '...' : 'MISSING',
    isVercel: isVercel
  });
});

app.get('/api/winners/recent', async (req, res) => {
  try {
    const winners = await googleSheetsService.getRecentWinners(3);
    res.json({ success: true, data: winners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`\n==========================================================`);
    console.log(`🚀 WEBHOOK SERVER CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`🔒 CHẾ ĐỘ THỰC TẾ: Mỗi số điện thoại chỉ được quay 1 lần.`);
    console.log(`==========================================================\n`);
  });
}

module.exports = app;


