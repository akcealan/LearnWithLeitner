// ==========================================
// UTILS.JS - Utility Functions
// ==========================================

const Utils = {
  /**
   * Tarihi Turkish formatta göster
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Dizinin elemanlarını karıştır (Fisher-Yates)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Çıkışı göster (HTML element)
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    
    // Stil
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      max-width: calc(100vw - 40px);
      overflow-wrap: break-word;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      ${type === 'success' ? 'background: #10b981; color: white;' : ''}
      ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
      ${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Tekrar zamanını yerel saatle kısa Türkçe biçimde gösterir:
   * "Bugün, 15.30" / "Yarın, 09.00" / "25 Eylül, 14.45" /
   * yıl gerekiyorsa "25 Eylül 2026, 14.45". nowMs testler için enjekte edilir.
   */
  formatReviewTime(timestamp, nowMs = Date.now()) {
    const at = new Date(timestamp);
    const time = at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const dayStart = new Date(at.getTime());
    dayStart.setHours(0, 0, 0, 0);
    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dayStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return `Bugün, ${time}`;
    if (diffDays === 1) return `Yarın, ${time}`;
    const date = at.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    if (at.getFullYear() !== new Date(nowMs).getFullYear()) {
      return `${date} ${at.getFullYear()}, ${time}`;
    }
    return `${date}, ${time}`;
  },

  /**
   * Input değerini trim et ve kontrol et
   */
  validateInput(input, minLength = 1) {
    const trimmed = input.trim();
    return trimmed.length >= minLength ? trimmed : null;
  },

  /**
   * Bozuk/okunamayan depoda kullanıcıya Türkçe açıklama gösterir.
   * Yalnızca sabit metin kullanır; ham veri veya kişisel içerik yansıtmaz.
   * Hiçbir veriyi silmez veya üzerine yazmaz. Başarıda true döner.
   */
  showStorageError(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return false;
    el.innerHTML = `
      <div class="bg-card-dark rounded-xl border border-border-dark p-6" role="alert">
        <h2 class="text-xl font-bold text-slate-100 mb-2">Veriler okunamadı</h2>
        <p class="text-slate-400 text-sm mb-3">Kayıtlı deste ve kart bilgileri okunamıyor. Mevcut verileriniz silinmedi ve üzerine yazılmadı.</p>
        <p class="text-slate-400 text-sm mb-5">Elinizde daha önce indirdiğiniz bir JSON yedeği varsa, Ayarlar sayfasından geri yükleyebilirsiniz. Tarayıcı depolamasını temizlemek, kayıtlı verileri kalıcı olarak siler.</p>
        <a href="settings.html" class="inline-block px-4 py-2.5 rounded-lg bg-primary text-slate-900 font-semibold hover:bg-primary/90 transition-colors text-sm">Ayarlar'a Git</a>
      </div>
    `;
    return true;
  },

  /**
   * JSON dosyası indir
   */
  downloadJSON(data, filename) {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `leitner-export-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  },

  /**
   * JSON dosyasını oku (file input)
   */
  readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('JSON parse hatası'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Dosya okuma hatası'));
      };
      
      reader.readAsText(file);
    });
  }
};
