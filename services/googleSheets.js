const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');

/**
 * Service đồng bộ dữ liệu người dùng trúng thưởng Vòng quay may mắn vào Google Sheets.
 */
class GoogleSheetsService {
  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
    this.keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account.json';
    this.webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';
    this.sheets = null;
    this.initClient();
  }

  initClient() {
    try {
      const resolvedPath = path.resolve(process.cwd(), this.keyFilePath);
      if (fs.existsSync(resolvedPath)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: resolvedPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('[GoogleSheetsService] Đã kết nối thành công với Google Sheets API qua Service Account.');
      } else {
        console.log(`[GoogleSheetsService] Chưa có file service-account.json. Hỗ trợ qua Google Apps Script Webhook hoặc lưu file Excel cục bộ.`);
      }
    } catch (err) {
      console.warn('[GoogleSheetsService] Khởi tạo API thất bại:', err.message);
    }
  }

  /**
   * Append một dòng dữ liệu trúng thưởng mới vào Google Sheet.
   * @param {Object} data - { timestamp, fullName, phone, prizeName, couponCode, zaloStatus }
   */
  async appendWinnerRecord(data) {
    const row = [
      data.timestamp || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      data.fullName || '',
      data.phone || '',
      data.prizeName || '',
      data.couponCode || '',
      data.zaloStatus || 'ĐÃ LƯU HỆ THỐNG'
    ];

    // 1. GỬI QUA GOOGLE APPS SCRIPT WEBHOOK URL (Nếu được cấu hình)
    const webhook = this.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhook) {
      try {
        const payload = JSON.stringify({
          timestamp: row[0],
          fullName: row[1],
          phone: row[2],
          prizeName: row[3],
          couponCode: row[4],
          zaloStatus: row[5]
        });

        const webhookRes = await axios.post(webhook, payload, {
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          maxRedirects: 5,
          timeout: 10000
        });
        console.log('[GoogleSheetsService] 🚀 Đã đẩy dữ liệu thành công qua Google Apps Script Webhook:', webhookRes.status);
        return { success: true, mode: 'webhook', response: webhookRes.data };
      } catch (whErr) {
        console.warn('[GoogleSheetsService] Lỗi gửi Google Webhook:', whErr.message);
      }
    }

    // 2. GỬI QUA GOOGLE SHEETS API SERVICE ACCOUNT (Nếu có keyfile)
    if (this.sheets && this.sheetId && this.sheetId !== 'demo_sheet_id') {
      try {
        let response;
        try {
          response = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.sheetId,
            range: `${this.sheetName || 'Sheet1'}!A:F`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
          });
        } catch (rangeErr) {
          response = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.sheetId,
            range: 'A:F',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
          });
        }
        console.log('[GoogleSheetsService] Ghi nhận thành công dòng mới vào Google Sheet:', response.data.updates.updatedRange);
        return { success: true, mode: 'live', range: response.data.updates.updatedRange };
      } catch (error) {
        console.error('[GoogleSheetsService] Lỗi khi ghi Google Sheet API:', error.message);
        return { success: false, mode: 'live_fallback', error: error.message, dataRecorded: row };
      }
    } else {
      // Mock mode logging
      console.log('\n========= [GOOGLE SHEETS LOCAL MOCK DATA APPENDED] =========');
      console.log(`- Thời gian     : ${row[0]}`);
      console.log(`- Họ & Tên      : ${row[1]}`);
      console.log(`- SĐT           : ${row[2]}`);
      console.log(`- Giải thưởng  : ${row[3]}`);
      console.log(`- Mã ưu đãi     : ${row[4]}`);
      console.log(`- Trạng thái Zalo: ${row[5]}`);
      console.log('===========================================================\n');
      return { success: true, mode: 'demo', dataRecorded: row };
    }
  }
}

module.exports = new GoogleSheetsService();
