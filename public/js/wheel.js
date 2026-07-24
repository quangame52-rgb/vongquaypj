/**
 * Lucky Wheel Canvas Engine - Tri Ân Khách Hàng Bình Dương
 */
class LuckyWheel {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 5 Mục giải thưởng khớp chuẩn theo Poster quảng cáo:
    // 1. Chăm sóc Dưỡng Trắng Da 1 Tháng 259K (Không giới hạn số buổi + Tặng kèm Serum) - Tỷ lệ 30%
    // 2. Triệt Lông Nách Bảo Hành 1 Năm 399K (Giá gốc 3.500.000đ) - Tỷ lệ 20%
    // 3. Tắm Trắng Tri Ân 19K (Giá gốc 500.000đ) - Tỷ lệ 15%
    // 4. Liệu Trình Nám - Mụn 2.999K (Giá gốc 10 Triệu - Cam kết đến đẹp) - Tỷ lệ 30%
    // 5. GIẢI ĐẶC BIỆT: Voucher Tiền Mặt 500.000Đ (Đổi 500.000đ tiền mặt khi đến Spa) - Tỷ lệ 5%
    this.prizes = [
      { id: 1, name: 'Dưỡng Trắng Da 259K', detail: 'Chăm sóc 1 tháng không giới hạn buổi + Tặng 1 Lọ Serum (Giá gốc 3.5M)', weight: 30, color: '#0d5259', textColor: '#ffffff' },
      { id: 2, name: 'Triệt Lông Nách 399K', detail: 'Bảo hành 1 năm (Giá gốc 3.500.000đ)', weight: 25, color: '#06393e', textColor: '#ffffff' },
      { id: 3, name: 'Tắm Trắng Tri Ân 19K', detail: 'Suất Tắm Trắng giá sốc 19.000đ (Giá gốc 500.000đ)', weight: 15, color: '#09636c', textColor: '#ffffff' },
      { id: 4, name: 'Nám - Mụn 2.999K', detail: 'Liệu trình Nám - Mụn trọn gói 2.999K (Giá gốc 10 Triệu - Cam kết đến đẹp)', weight: 30, color: '#b45309', textColor: '#ffffff' }
    ];

    this.currentAngle = 0; // góc quay hiện tại (radian)
    this.isSpinning = false;
    this.audioCtx = null;
    this.lastSectorIndex = -1;

    this.draw();
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTickSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  playWinFanfare() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + index * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime + index * 0.1);
        osc.stop(this.audioCtx.currentTime + index * 0.1 + 0.35);
      });
    } catch (e) {}
  }

  // Thuật toán chọn giải thưởng ngẫu nhiên theo tỷ lệ phần trăm (Trọng số Weight)
  getRandomPrizeIndex() {
    const totalWeight = this.prizes.reduce((sum, p) => sum + (p.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;

    for (let i = 0; i < this.prizes.length; i++) {
      if (randomNum < this.prizes[i].weight) {
        return i;
      }
      randomNum -= this.prizes[i].weight;
    }
    return 0;
  }

  draw() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;
    const numSectors = this.prizes.length;
    const arcSize = (2 * Math.PI) / numSectors;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.currentAngle);

    // Draw Wheel Sectors
    for (let i = 0; i < numSectors; i++) {
      const angle = i * arcSize;
      const prize = this.prizes[i];

      // Sector background
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, angle, angle + arcSize);
      this.ctx.closePath();
      this.ctx.fillStyle = prize.color;
      this.ctx.fill();

      // Sector border line
      this.ctx.strokeStyle = 'rgba(243, 196, 103, 0.6)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Text drawing
      this.ctx.save();
      this.ctx.rotate(angle + arcSize / 2);
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = prize.textColor;
      this.ctx.font = 'bold 15px "Outfit", sans-serif';
      this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(prize.name, radius - 22, 5);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  spin(onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.initAudio();

    // Chọn phần thưởng theo tỷ lệ trọng số (Weight)
    const prizeIndex = this.getRandomPrizeIndex();
    const selectedPrize = this.prizes[prizeIndex];

    const numSectors = this.prizes.length;
    const arcSize = (2 * Math.PI) / numSectors;

    const fullRounds = 5 + Math.floor(Math.random() * 3);
    const targetSectorAngle = (numSectors - prizeIndex - 0.5) * arcSize - (Math.PI / 2);
    
    const baseAngle = this.currentAngle % (2 * Math.PI);
    const totalRotation = (fullRounds * 2 * Math.PI) + targetSectorAngle - baseAngle;

    const startTime = performance.now();
    const duration = 4500;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out Cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = baseAngle + totalRotation * easeOut;

      // Track tick sound when crossing sector lines
      const normalizedAngle = (this.currentAngle + Math.PI / 2) % (2 * Math.PI);
      const currentSectorIndex = Math.floor((2 * Math.PI - normalizedAngle) / arcSize) % numSectors;
      if (currentSectorIndex !== this.lastSectorIndex && progress < 0.95) {
        this.lastSectorIndex = currentSectorIndex;
        this.playTickSound();
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.playWinFanfare();
        if (onComplete) {
          onComplete(selectedPrize);
        }
      }
    };

    requestAnimationFrame(animate);
  }
}

window.LuckyWheel = LuckyWheel;
