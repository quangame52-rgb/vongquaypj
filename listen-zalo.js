require('dotenv').config();
const axios = require('axios');

const token = process.env.ZALO_BOT_TOKEN || '3297618082364369677:PSpdEaZzuthLdCetOMBbJreWLVfJxIbKfJdPHJZkEWhcvEymDsXYPTgwdrGSxEiK';
const apiUrl = `https://bot-api.zaloplatforms.com/bot${token}/getUpdates`;

console.log('================================================================');
console.log('🚀 ĐANG CHỜ TIN NHẮN TỪ ZALO (GỬI THÊM 1 TIN BẤT KỲ TRÊN ZALO)...');
console.log('================================================================\n');

let isDone = false;

async function listenLoop() {
  while (!isDone) {
    try {
      const res = await axios.get(apiUrl, { timeout: 35000 });
      if (res.data && res.data.ok && Array.isArray(res.data.result) && res.data.result.length > 0) {
        console.log('\n🎉 [THÀNH CÔNG] ĐÃ BẮT ĐƯỢC CHAT ID TỪ ZALO! 🎉\n');
        res.data.result.forEach((up) => {
          const m = up.message || up.channel_post || up.edited_message;
          if (m && m.chat) {
            console.log('==================================================');
            console.log(`🔥 COPY CHUỖI DƯỚI ĐÂY DÁN VÀO FILE .ENV:`);
            console.log(`ZALO_ADMIN_CHAT_ID=${m.chat.id}`);
            console.log(`- Tên Chat: ${m.chat.title || m.from?.first_name || 'Khách VIP'}`);
            console.log(`- Loại: ${m.chat.type}`);
            console.log(`- Nội dung: "${m.text || ''}"`);
            console.log('==================================================\n');
          }
        });
        isDone = true;
        process.exit(0);
      }
    } catch (e) {
      // Timeout -> tự động quét tiếp ngay lập tức
    }
  }
}

listenLoop();
