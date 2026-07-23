require('dotenv').config();
const axios = require('axios');

const token = process.env.ZALO_BOT_TOKEN || '3297618082364369677:PSpdEaZzuthLdCetOMBbJreWLVfJxIbKfJdPHJZkEWhcvEymDsXYPTgwdrGSxEiK';
const apiUrl = `https://bot-api.zaloplatforms.com/bot${token}/getUpdates`;

console.log('================================================================');
console.log('🔍 ĐANG QUÉT TIN NHẮN TỪ ZALO BOT...');
console.log('👉 Vui lòng @Tag tên Bot trong Nhóm: @Bot PJ CLINIC hi');
console.log('👉 HOẶC Chat riêng 1-on-1 với Bot: gõ "hi"');
console.log('================================================================\n');

let isRunning = true;

async function pollUpdates() {
  while (isRunning) {
    try {
      const res = await axios.get(apiUrl, { timeout: 4000 });
      if (res.data && res.data.ok && Array.isArray(res.data.result) && res.data.result.length > 0) {
        console.log('\n🎉 ĐÃ NHẬN ĐƯỢC THÔNG TIN TỪ ZALO! 🎉');
        res.data.result.forEach((update) => {
          const msg = update.message || update.channel_post || update.edited_message;
          if (msg && msg.chat) {
            console.log('\n==================================================');
            console.log(`📌 KẾT QUẢ ĐÃ LẤY ĐƯỢC CHAT ID ZALO:`);
            console.log(`👉 ZALO_ADMIN_CHAT_ID=${msg.chat.id}`);
            console.log(`- Loại Chat : ${msg.chat.type || 'group/private'}`);
            console.log(`- Tiêu đề  : ${msg.chat.title || msg.from?.first_name || 'Zalo Chat'}`);
            console.log(`- Nội dung : "${msg.text || ''}"`);
            console.log('==================================================\n');
          }
        });
        isRunning = false;
        process.exit(0);
      }
    } catch (err) {
      // Tiếp tục vòng lặp
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

pollUpdates();
