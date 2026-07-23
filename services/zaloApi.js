const axios = require('axios');

/**
 * Service xử lý chuẩn hóa Số điện thoại và gửi tin nhắn Zalo API (Zalo VIP Group Redirect)
 */
class ZaloApiService {
  constructor() {
    this.botToken = process.env.ZALO_BOT_TOKEN || process.env.ZALO_OA_ACCESS_TOKEN || '';
    this.adminChatId = process.env.ZALO_ADMIN_CHAT_ID || process.env.ZALO_CHAT_ID || '';
    this.botApiBase = 'https://bot-api.zaloplatforms.com';
    this.znsApiUrl = 'https://business.openapi.zalo.me/message/template';
    this.templateId = process.env.ZALO_TEMPLATE_ID || '325412';
    this.spaPhone = process.env.SPA_ZALO_PHONE || '0339603960';
    this.zaloGroupUrl = process.env.ZALO_GROUP_URL || 'https://zalo.me/g/pdv89aulcjcossbvgxbt?joinSrc=9';
  }

  formatZaloPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '84' + cleaned.substring(1);
    } else if (!cleaned.startsWith('84') && cleaned.length >= 9) {
      cleaned = '84' + cleaned;
    }
    return cleaned;
  }

  /**
   * Gửi tin nhắn thông báo trúng thưởng & Điều hướng Nhóm Zalo VIP Spa
   */
  async sendWinnerNotification({ fullName, phone, prizeName, couponCode }) {
    const formattedPhone = this.formatZaloPhone(phone);
    const messageContent = `🎉 CHÚC MỪNG KHÁCH HÀNG: ${fullName}\n\n` +
      `🎁 Bạn đã quay trúng: ${prizeName}\n` +
      `🎫 Mã Ưu Đãi: ${couponCode}\n\n` +
      `📌 Vui lòng tham gia Nhóm Zalo VIP để nhận thêm ưu đãi khuyến mãi và chốt lịch quy đổi thành công. Trân trọng cảm ơn!`;

    // Nếu có ZALO_ADMIN_CHAT_ID (Ví dụ ID Group Spa), gửi thông báo nội bộ cho Spa
    if (this.botToken && this.adminChatId && this.botToken.includes(':')) {
      try {
        const adminMessage = `🔔 [VÒNG QUAY MAY MẮN] KHÁCH HÀNG MỚI TRÚNG THƯỞNG!\n` +
          `👤 Họ tên: ${fullName}\n` +
          `📞 SĐT Zalo: ${phone} (${formattedPhone})\n` +
          `🎁 Phần thưởng: ${prizeName}\n` +
          `🎫 Mã Voucher: ${couponCode}\n` +
          `⏰ Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

        await axios.post(`${this.botApiBase}/bot${this.botToken}/sendMessage`, {
          chat_id: this.adminChatId,
          text: adminMessage
        }, { timeout: 5000 });
      } catch (err) {}
    }

    return {
      success: true,
      mode: 'zalo_group_vip',
      zaloStatus: 'ĐÃ LƯU HỆ THỐNG - ĐIỀU HƯỚNG VÀO NHÓM ZALO VIP',
      formattedPhone,
      messageSent: messageContent
    };
  }
}

module.exports = new ZaloApiService();
