/**
 * Application Controller - Lucky Wheel & Webhook Integration
 * Campaign: Tri Ân Hàng Triệu Khách Hàng Tại Bình Dương (UNLIMITED TEST MODE)
 */
document.addEventListener('DOMContentLoaded', () => {
  const wheel = new LuckyWheel('wheelCanvas');

  // DOM Elements
  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phone');
  const btnSpin = document.getElementById('btn-spin');
  const btnCenterSpin = document.getElementById('btn-center-spin');

  const winnerModal = document.getElementById('winnerModal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalPrizeName = document.getElementById('modalPrizeName');
  const modalPrizeDetail = document.getElementById('modalPrizeDetail');
  const modalCouponCode = document.getElementById('modalCouponCode');
  const modalZaloMsg = document.getElementById('modalZaloMsg');
  const btnOpenZaloDirect = document.getElementById('btn-open-zalo-direct');
  const btnJoinZaloGroup = document.getElementById('btn-join-zalo-group');
  const tickerList = document.getElementById('winners-ticker');

  // Danh sách fallback nếu không lấy được từ server
  let liveWinners = [
    { name: 'Chị Nguyễn Thị Thanh H.', prize: 'Voucher 500K' },
    { name: 'Chị Trần Thu T.', prize: 'Dưỡng Trắng Da 259K' },
    { name: 'Anh Lê Văn D.', prize: 'Triệt Lông Nách 399K' }
  ];

  async function loadLiveWinners() {
    try {
      const res = await fetch('/api/winners/recent');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        liveWinners = data.data.slice(0, 3).map(w => ({
          name: w.fullName,
          prize: w.prizeName
        }));
      }
    } catch (err) {
      console.warn('Không thể lấy danh sách trúng thưởng:', err);
    }
    renderWinnersTicker();
  }

  function renderWinnersTicker() {
    if (!tickerList) return;
    tickerList.innerHTML = liveWinners.map(w => `
      <li class="ticker-item">
        <span class="ticker-name">${w.name}</span>
        <span class="ticker-prize">✨ ${w.prize}</span>
      </li>
    `).join('');
  }
  
  // Lấy dữ liệu ngay khi tải trang
  loadLiveWinners();


  function isValidPhone(phone) {
    const regex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    return regex.test(phone.replace(/\s+/g, ''));
  }

  function handleSpinTrigger() {
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!fullName) {
      alert('Vui lòng nhập Họ và Tên của bạn để tham gia.');
      fullNameInput.focus();
      return;
    }

    if (!phone || !isValidPhone(phone)) {
      alert('Vui lòng nhập Số Điện Thoại Zalo hợp lệ (10 chữ số, ví dụ 0912345678).');
      phoneInput.focus();
      return;
    }

    btnSpin.disabled = true;
    btnCenterSpin.style.pointerEvents = 'none';

    wheel.spin(async (prize) => {
      btnCenterSpin.style.pointerEvents = 'auto';

      try {
        const response = await fetch('/webhook/lucky-wheel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName,
            phone,
            prizeName: `${prize.name} (${prize.detail})`
          })
        });

        const result = await response.json();

        if (result.success) {
          const couponCode = result.data ? result.data.couponCode : 'SPA-BD-500K';
          const spaZaloPhone = result.data ? result.data.spaZaloPhone : '0339603960';
          const zaloGroupUrl = result.data ? result.data.zaloGroupUrl : 'https://zalo.me/g/pdv89aulcjcossbvgxbt?joinSrc=9';
          const zaloStatus = result.data && result.data.zalo ? result.data.zalo.zaloStatus : '';
          showWinnerModal(fullName, prize.name, prize.detail, couponCode, result.data ? result.data.phone : phone, spaZaloPhone, zaloGroupUrl, zaloStatus);

          liveWinners.unshift({
            name: fullName.length > 15 ? fullName.substring(0, 15) + '...' : fullName,
            prize: prize.name,
            time: 'Vừa xong'
          });
          if (liveWinners.length > 3) liveWinners.pop();
          renderWinnersTicker();
        } else {
          alert('Lỗi Webhook: ' + (result.error || 'Không thể đồng bộ dữ liệu.'));
          btnSpin.disabled = false;
        }

      } catch (err) {
        console.error('Fetch error:', err);
        showWinnerModal(fullName, prize.name, prize.detail, 'SPA-BD-500K', phone, '0339603960', 'https://zalo.me/g/pdv89aulcjcossbvgxbt?joinSrc=9');
        btnSpin.disabled = false;
      }
    });
  }

  btnSpin.addEventListener('click', handleSpinTrigger);
  btnCenterSpin.addEventListener('click', handleSpinTrigger);

  btnCloseModal.addEventListener('click', () => {
    winnerModal.classList.add('hidden');
    btnSpin.disabled = false;
  });

  function showWinnerModal(name, prizeName, prizeDetail, couponCode, phoneNum, spaZaloPhone, zaloGroupUrl) {
    if (modalPrizeName) modalPrizeName.textContent = prizeName;
    if (modalPrizeDetail) modalPrizeDetail.textContent = prizeDetail || '';
    if (modalCouponCode) modalCouponCode.textContent = couponCode;

    const rawSpaPhone = (spaZaloPhone || '0339603960').replace(/\D/g, '');
    if (modalZaloMsg) {
      modalZaloMsg.textContent = `Hệ thống đã lưu thông tin đăng ký cho SĐT ${phoneNum}. Tham gia ngay Nhóm Zalo VIP của Spa để chốt lịch nhận quà và nhận thêm nhiều ưu đãi khuyến mãi cực khủng!`;
    }

    // 1. Link tham gia nhóm Zalo VIP Spa (mở trực tiếp mượt mà)
    if (btnJoinZaloGroup) {
      btnJoinZaloGroup.href = zaloGroupUrl || 'https://zalo.me/g/pdv89aulcjcossbvgxbt?joinSrc=9';
      btnJoinZaloGroup.onclick = null;
    }

    // 2. Link chat riêng Zalo với Spa
    if (btnOpenZaloDirect) {
      btnOpenZaloDirect.href = `https://zalo.me/${rawSpaPhone}`;
    }

    if (winnerModal) {
      winnerModal.classList.remove('hidden');
    }
    launchConfetti();
  }

  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f4d068', '#10b981', '#ffffff', '#e89a90', '#3b82f6'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        opacity: 1
      });
    }

    const startTime = performance.now();
    function animateConfetti(now) {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive && elapsed < 3500) {
        requestAnimationFrame(animateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    requestAnimationFrame(animateConfetti);
  }
});
