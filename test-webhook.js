/**
 * Automated Verification Script for Webhook /webhook/lucky-wheel
 */
const http = require('http');

function testWebhook() {
  console.log('=====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG ENDPOINT WEBHOOK LUCKY WHEEL');
  console.log('=====================================================\n');

  const testPayload = JSON.stringify({
    fullName: 'Nguyễn Thanh Thảo',
    phone: '0987654321',
    prizeName: 'Spa Chăm Sóc Da Chuyên Sâu 0Đ'
  });

  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/webhook/lucky-wheel',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testPayload)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';

    console.log(`STATUS CODE: ${res.statusCode} ${res.statusCode === 200 ? '✅ (PASS)' : '❌ (FAIL)'}`);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('\nPHẢN HỒI NỘI DUNG PAYLOAD (JSON):');
      try {
        const json = JSON.parse(body);
        console.log(JSON.stringify(json, null, 2));

        console.log('\n--- KIỂM TRA ĐIỀU KIỆN XÁC MINH ---');
        console.log(`1. HTTP Status 200       : ${res.statusCode === 200 ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`2. Response success == true: ${json.success === true ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`3. SĐT Formatted 84      : ${json.data && json.data.phone === '84987654321' ? '✅ PASS (84987654321)' : '❌ FAIL'}`);
        console.log(`4. Sinh mã Voucher       : ${json.data && json.data.couponCode ? '✅ PASS (' + json.data.couponCode + ')' : '❌ FAIL'}`);
        console.log(`5. Trạng thái Zalo       : ${json.data && json.data.zalo ? '✅ PASS (' + json.data.zalo.zaloStatus + ')' : '❌ FAIL'}`);
        console.log(`6. Trạng thái Google Sheet: ${json.data && json.data.sheet ? '✅ PASS (' + json.data.sheet.mode + ')' : '❌ FAIL'}`);
        console.log('------------------------------------\n');

      } catch (e) {
        console.error('Không thể parse JSON response:', body);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Lỗi kết nối tới server Webhook: ${e.message}`);
    console.log('💡 Gợi ý: Vui lòng đảm bảo server Node.js đang chạy trên port 3000 (node server.js).');
  });

  req.write(testPayload);
  req.end();
}

// Chạy test nếu gọi trực tiếp từ CLI
if (require.main === module) {
  testWebhook();
}

module.exports = testWebhook;
