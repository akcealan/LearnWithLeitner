// ==========================================
// APP.JS - Main Application Logic
// ==========================================

class LeitnerApp {
  constructor() {
    this.currentDeckId = null;
    this.currentCards = [];
    this.currentCardIndex = 0;
    // Çalışma oturumu yanıt kilidi: bir kart en fazla bir yanıt alır,
    // gecikmiş zamanlayıcılar bayat oturumu canlandıramaz.
    this.isResponding = false;
    this.studyComplete = false;
    this.studyCompleteShown = false;
    this._renderToken = 0;
    // Takvim tazeleme bağları (tek seferlik) ve aralıklı zamanlayıcı.
    this._scheduleRefreshBound = false;
    this._scheduleTimer = null;
    // Çalışma kipi: 'normal' (vadesi gelenler, Leitner ilerlemeli) veya
    // 'free' (tüm kartlar, kalıcı durum değişmez). Varsayılan normaldir.
    this.studyMode = 'normal';
    this.init();
  }

  /**
   * Uygulamayı başlat
   */
  init() {
    this.loadTheme();
    this.loadPageType();
  }

  /**
   * Kaydedilmiş tema tercihini yükle
   */
  loadTheme() {
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('leitner_theme') || 'dark';
    } catch (error) {
      void error;
    }
    const html = document.documentElement;
    
    if (savedTheme === 'light') {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
  }

  /**
   * Sayfanın tipine göre işlem yap
   */
  loadPageType() {
    const path = window.location.pathname;
    const isWorkPage = path.includes('workpage');

    if (isWorkPage) {
      this.initWorkPage();
    } else {
      this.initIndexPage();
    }
  }

  // ======== INDEX PAGE ========

  /**
   * Ana sayfayı başlat
   */
  initIndexPage() {
    try {
      this.renderDecks();
    } catch (error) {
      void error;
      Utils.showStorageError('decks-container');
    }
    try {
      this.renderHeroStats();
    } catch (error) {
      void error;
      // Sayaç yer tutucu metinde kalır; sayfa çalışmaya devam eder.
    }
    this.refreshSchedule();
    this.setupIndexEventListeners();
    this.setupScheduleRefresh();
  }

  /**
   * Karşılama özetini gerçek veriyle doldur (uydurma istatistik yok)
   */
  renderHeroStats() {
    const el = document.getElementById('hero-stats');
    if (!el) return;
    const decks = Storage.getDecks();
    const cards = Storage.getCards();
    let due = 0;
    for (const deck of decks) {
      due += Storage.getCardsDueForReview(deck.id).length;
    }
    el.textContent = `${decks.length} deste • ${cards.length} kart • ${due} tekrar bekliyor`;
  }

  /**
   * Tekrar takvimini çizer (salt okunur; depoya yazmaz).
   * Kutu başına: toplam, bekleyen, geciken ve en erken yaklaşan zaman;
   * birden çok farklı zaman varsa açılabilir listede hepsi gösterilir.
   */
  renderSchedule() {
    const section = document.getElementById('tekrar-takvimi');
    const container = document.getElementById('schedule-container');
    if (!container) return;
    const nowMs = Date.now();
    const schedule = Storage.getReviewSchedule(nowMs);
    if (schedule.length === 0) {
      if (section) section.classList.add('hidden');
      container.innerHTML = '';
      return;
    }
    if (section) section.classList.remove('hidden');
    container.innerHTML = schedule.map(deck => this.renderScheduleDeck(deck, nowMs)).join('');
  }

  renderScheduleDeck(deck, nowMs) {
    const pill = deck.totalCards === 0
      ? ''
      : (deck.dueCount > 0
        ? `<p class="flex-shrink-0 inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">${deck.dueCount} bekliyor${deck.overdueCount > 0 ? ` • ${deck.overdueCount} gecikti` : ''}</p>`
        : `<p class="flex-shrink-0 text-slate-400 text-xs">Tümü güncel</p>`);
    const body = deck.totalCards === 0
      ? `<p class="text-slate-400 text-sm">Henüz kart yok.</p>`
      : deck.boxes.map(entry => this.renderScheduleBox(entry, nowMs)).join('');
    return `
      <div class="bg-card-dark rounded-2xl border border-border-dark p-5">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="text-slate-50 font-bold break-words min-w-0">${this.escapeHtml(deck.deckName)}</h3>
          ${pill}
        </div>
        <div class="space-y-3">${body}</div>
      </div>
    `;
  }

  renderScheduleBox(entry, nowMs) {
    const duePart = entry.due > 0
      ? `<p class="text-sm font-bold text-slate-200">${entry.due} bekliyor${entry.overdue > 0 ? ` (${entry.overdue} gecikti)` : ''}</p>`
      : `<p class="text-slate-400 text-xs">Bekleyen yok</p>`;
    let upcomingPart;
    if (entry.upcoming.length === 0) {
      upcomingPart = `<p class="text-slate-400 text-xs mt-1">Yaklaşan tekrar yok</p>`;
    } else {
      const first = entry.upcoming[0];
      upcomingPart = `<p class="text-slate-400 text-xs mt-1">En erken: ${Utils.formatReviewTime(first.at, nowMs)} (${first.count} kart)</p>`;
      if (entry.upcoming.length > 1) {
        const items = entry.upcoming
          .map(u => `<li class="text-slate-400 text-xs">${Utils.formatReviewTime(u.at, nowMs)} — ${u.count} kart</li>`)
          .join('');
        upcomingPart += `
          <details class="mt-2">
            <summary class="cursor-pointer text-sm font-semibold text-slate-100">Tüm zamanlar (${entry.upcoming.length})</summary>
            <ul class="mt-2 space-y-1">${items}</ul>
          </details>`;
      }
    }
    return `
      <div class="rounded-xl border border-border-dark p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-bold text-slate-200">Kutu ${entry.box} • ${entry.total} kart</p>
          ${duePart}
        </div>
        ${upcomingPart}
      </div>
    `;
  }

  /**
   * Takvimi güncel veriyle tazeler. Yazma yapmaz; okuma hatasında
   * sessiz boş liste yerine açıklama gösterir.
   */
  refreshSchedule() {
    const container = document.getElementById('schedule-container');
    if (!container) return;
    try {
      this.renderSchedule();
    } catch (error) {
      void error;
      Utils.showStorageError(container);
    }
  }

  /**
   * Takvim tazeliği: görünürlük/odak dönüşü + seyrek aralıklı tazeleme.
   * Tek sefer bağlanır; kart başına zamanlayıcı kurulmaz.
   */
  setupScheduleRefresh() {
    if (this._scheduleRefreshBound) return;
    this._scheduleRefreshBound = true;
    const refresh = () => this.refreshSchedule();
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refresh();
      });
    }
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('focus', refresh);
    }
    if (typeof setInterval === 'function') {
      this._scheduleTimer = setInterval(refresh, 60000);
    }
  }

  /**
   * Destleri render et
   */
  renderDecks() {
    const decks = Storage.getDecks();
    const container = document.getElementById('decks-container');
    
    if (!container) return;

    if (decks.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-card-dark rounded-xl border border-border-dark p-6 sm:p-8">
          <h2 class="text-slate-50 text-xl font-bold leading-normal mb-2">İlk destenle başla</h2>
          <p class="text-slate-400 text-sm mb-6">Üç küçük adımda çalışmaya hazır ol:</p>
          <ol class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <li class="flex gap-3">
              <span aria-hidden="true" class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold inline-flex items-center justify-center">1</span>
              <div>
                <p class="text-slate-100 text-sm font-bold">Deste oluştur</p>
                <p class="text-slate-400 text-xs mt-1">Yukarıya bir konu yaz, Yeni Deste'ye bas.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span aria-hidden="true" class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold inline-flex items-center justify-center">2</span>
              <div>
                <p class="text-slate-100 text-sm font-bold">Kart ekle</p>
                <p class="text-slate-400 text-xs mt-1">Kartlar sayfasından soru-cevap ekle.</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span aria-hidden="true" class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold inline-flex items-center justify-center">3</span>
              <div>
                <p class="text-slate-100 text-sm font-bold">Tekrar et</p>
                <p class="text-slate-400 text-xs mt-1">Çalış ile günü gelenleri bitir.</p>
              </div>
            </li>
          </ol>
        </div>
      `;
      return;
    }

    container.innerHTML = decks.map(deck => {
      const stats = Storage.getDeckStats(deck.id);
      const dueCount = Storage.getCardsDueForReview(deck.id).length;
      const boxCounts = [stats.box1, stats.box2, stats.box3, stats.box4, stats.box5];
      const boxCells = boxCounts.map((count, i) => {
        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
        return `
          <div class="text-center">
            <p class="text-[11px] font-semibold text-slate-400">K${i + 1}</p>
            <p class="text-sm font-bold text-slate-200">${count}</p>
            <div class="h-1 mt-1 rounded-full bg-slate-700">
              <div class="h-full rounded-full bg-primary" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
      const duePill = dueCount > 0
        ? `<p class="inline-flex w-fit items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">${dueCount} kart tekrar bekliyor</p>`
        : `<p class="text-slate-400 text-xs">Bekleyen kart yok</p>`;

      return `
        <div class="lp-lift flex flex-col gap-4 p-5 bg-card-dark rounded-2xl border border-border-dark shadow-lg shadow-black/20 hover:shadow-xl">
          <div class="flex justify-between items-start gap-3">
            <div class="min-w-0">
              <p class="text-slate-50 text-lg font-bold leading-snug break-words">${this.escapeHtml(deck.name)}</p>
              <p class="text-slate-400 text-xs mt-1">Toplam: ${stats.total} kart</p>
            </div>
            <button data-action="delete-deck" data-id="${this.escapeAttr(deck.id)}" aria-label="Desteyi sil" class="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>

          <div>${duePill}</div>

          <div class="grid grid-cols-5 gap-1.5" role="group" aria-label="Kutu dağılımı">
            ${boxCells}
          </div>

          <div class="flex gap-2">
            <button data-action="start-study" data-id="${this.escapeAttr(deck.id)}" class="flex-1 h-12 rounded-xl bg-primary text-slate-900 text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition">
              Çalış
            </button>
            <button data-action="open-deck" data-id="${this.escapeAttr(deck.id)}" class="h-12 px-5 rounded-xl bg-slate-700/50 text-slate-300 text-sm font-bold hover:bg-slate-700 active:scale-[0.98] transition">
              Kartlar
            </button>
          </div>
          <div class="flex gap-2 mt-2">
            <button data-action="start-free-study" data-id="${this.escapeAttr(deck.id)}" aria-label="Serbest Çalışma başlat" class="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm font-bold hover:bg-slate-700 active:scale-[0.98] transition">
              <span aria-hidden="true" class="material-symbols-outlined text-sm">replay</span>
              <span>Serbest Çalış</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Index sayfası event listener'larını ayarla.
   * Deste kartı düğmeleri için tek bir yetkilendirilmiş dinleyici kullanılır;
   * liste yeniden çizilse de dinleyici tek kalır, her eylem bir kez çalışır.
   */
  setupIndexEventListeners() {
    const createBtn = document.getElementById('create-deck-btn');
    const deckInput = document.getElementById('deck-name-input');
    const container = document.getElementById('decks-container');

    if (createBtn) {
      createBtn.addEventListener('click', () => this.createNewDeck());
    }

    if (deckInput) {
      deckInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.createNewDeck();
        }
      });
    }

    if (container && !container.dataset.delegationBound) {
      container.dataset.delegationBound = 'true';
      container.addEventListener('click', (e) => {
        const target = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
        if (!target || !container.contains(target)) return;
        const action = target.getAttribute('data-action');
        const deckId = target.getAttribute('data-id');
        if (!deckId) return;
        if (action === 'delete-deck') {
          this.deleteDeck(deckId);
        } else if (action === 'start-study') {
          this.startStudy(deckId);
        } else if (action === 'start-free-study') {
          this.startFreeStudy(deckId);
        } else if (action === 'open-deck') {
          this.openDeckCards(deckId);
        }
      });
    }
  }

  /**
   * Yeni deste oluştur
   */
  createNewDeck() {
    const input = document.getElementById('deck-name-input');
    const name = Utils.validateInput(input.value, 2);

    if (!name) {
      Utils.showToast('Deste adı en az 2 karakter olmalı', 'error');
      return;
    }

    const deck = Storage.createDeck(name);
    if (!deck) {
      Utils.showToast('Deste kaydedilemedi; depolama hatası', 'error');
      return;
    }
    input.value = '';
    this.renderDecks();
    this.refreshSchedule();
    try {
      this.renderHeroStats();
    } catch (error) {
      void error;
    }
    Utils.showToast(`"${name}" destesi oluşturuldu!`, 'success');
  }

  /**
   * Desteyi sil (Modal ile onay sor)
   */
  deleteDeck(deckId) {
    let deck;
    try {
      deck = Storage.getDecks().find(d => d.id === deckId);
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
      return;
    }
    if (!deck) return;

    this.showConfirmationModal(
      `"${this.escapeHtml(deck.name)}" Destesini Sil`,
      `Bu desteyi ve içindeki tüm kartları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      () => {
        if (!Storage.deleteDeck(deckId)) {
          Utils.showToast('Deste silinemedi; depolama hatası', 'error');
          return;
        }
        this.renderDecks();
        this.refreshSchedule();
        try {
          this.renderHeroStats();
        } catch (error) {
          void error;
        }
        Utils.showToast('Deste silindi...', 'success');
      }
    );
  }

  /**
   * Onay modalını göster.
   * Odak güvenli iptal düğmesine girer; Escape iptal eder; Tab diyalogda kalır.
   */
  showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal) return;

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Event listenerları temizle
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.replaceWith(newConfirmBtn);
    cancelBtn.replaceWith(newCancelBtn);

    // Yeni event listenerları ekle
    newConfirmBtn.addEventListener('click', () => {
      onConfirm();
      this.hideConfirmationModal();
    });

    newCancelBtn.addEventListener('click', () => {
      this.hideConfirmationModal();
    });

    // Klavye: Escape iptal eder, Tab diyalog içinde döner (tek seferlik bağ).
    if (!modal.dataset.modalKeysBound) {
      modal.dataset.modalKeysBound = 'true';
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          const cancel = modal.querySelector('#modal-cancel');
          if (cancel) cancel.click();
          return;
        }
        if (e.key !== 'Tab' || typeof modal.querySelectorAll !== 'function') return;
        const list = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!list || list.length === 0) return;
        const focusable = Array.prototype.filter.call(list, (el) => !el.disabled);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }

    // Modalı göster, odağı güvenli düğmeye al
    this._modalOpener = document.activeElement || null;
    modal.classList.remove('hidden');
    if (typeof newCancelBtn.focus === 'function') {
      newCancelBtn.focus();
    }
  }

  /**
   * Onay modalını gizle
   */
  hideConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    const opener = this._modalOpener;
    this._modalOpener = null;
    if (opener && typeof opener.focus === 'function') {
      try {
        opener.focus();
      } catch (error) {
        void error;
      }
    }
  }

  /**
   * Çalışmayı başlat
   */
  startStudy(deckId) {
    let cards;
    try {
      cards = Storage.getCardsDueForReview(deckId);
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
      return;
    }

    if (cards.length === 0) {
      Utils.showToast('Bugün tekrar edilecek kart yok!', 'info');
      return;
    }

    const shuffled = Utils.shuffleArray(cards);
    sessionStorage.setItem('workCards', JSON.stringify(shuffled));
    sessionStorage.setItem('workDeckId', deckId);
    sessionStorage.setItem('workMode', 'normal');

    window.location.href = 'workpage.html';
  }

  /**
   * Serbest çalışmayı başlat: destedeki TÜM kartlar (vadesi gelmiş ya da
   * gelmemiş) karıştırılıp oturuma alınır. Kalıcı Leitner durumu değişmez.
   */
  startFreeStudy(deckId) {
    let cards;
    try {
      cards = Storage.getCardsByDeck(deckId);
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
      return;
    }

    if (cards.length === 0) {
      Utils.showToast('Bu destede henüz kart yok. Önce kart ekle!', 'info');
      return;
    }

    const shuffled = Utils.shuffleArray(cards);
    sessionStorage.setItem('workCards', JSON.stringify(shuffled));
    sessionStorage.setItem('workDeckId', deckId);
    sessionStorage.setItem('workMode', 'free');

    window.location.href = 'workpage.html';
  }

  /**
   * Deste kartlarını aç
   */
  openDeckCards(deckId) {
    window.location.href = `deckpage.html?id=${encodeURIComponent(deckId)}`;
  }

  // ======== WORK PAGE ========

  /**
   * Çalışma sayfasını başlat
   */
  initWorkPage() {
    const cardData = sessionStorage.getItem('workCards');
    const deckId = sessionStorage.getItem('workDeckId');

    if (!cardData || !deckId) {
      window.location.href = 'index.html';
      return;
    }

    let sessionCards;
    try {
      sessionCards = JSON.parse(cardData);
    } catch (error) {
      void error;
      window.location.href = 'index.html';
      return;
    }
    if (!Array.isArray(sessionCards) || sessionCards.length === 0) {
      window.location.href = 'index.html';
      return;
    }

    this.currentDeckId = deckId;
    this.currentCards = sessionCards;
    this.currentCardIndex = 0;
    this.isResponding = false;
    this.studyComplete = false;
    this.studyCompleteShown = false;
    this._renderToken = 0;
    // Kip yalnızca açık izin listesiyle seçilir; eksik/geçersiz değer
    // normal kip sayılır (eski bağlantılar ve yer imleri korunur).
    this.studyMode = sessionStorage.getItem('workMode') === 'free' ? 'free' : 'normal';

    try {
      // Oturum kartı çizilmeden önce kalıcı kart verisi de okunabilir olmalı:
      // deste geçerli, kart JSON'u bozuksa panel gösterilir, oturum çizilmez.
      void Storage.getCards();
      const deck = Storage.getDecks().find(d => d.id === deckId);
      if (deck) {
        document.title = `${deck.name} - Çalış`;
        const deckTitle = document.getElementById('deck-title');
        if (deckTitle) {
          deckTitle.textContent = deck.name;
        }
      }
    } catch (error) {
      void error;
      this.setResponseEnabled(false);
      Utils.showStorageError('card-container');
      return;
    }

    const modeBadge = document.getElementById('study-mode-badge');
    if (modeBadge) {
      modeBadge.textContent = this.studyMode === 'free' ? 'Serbest Çalışma' : 'Normal Çalışma';
    }
    const modeNote = document.getElementById('study-mode-note');
    if (modeNote && this.studyMode === 'free') {
      modeNote.textContent = 'Serbest Çalışma · Bu oturum tekrar takvimini değiştirmez.';
      modeNote.classList.remove('hidden');
    }

    this.renderCard();
    this.setupWorkPageEventListeners();
  }

  /**
   * Kartı render et
   */
  renderCard() {
    if (this.studyComplete) return;
    const card = this.currentCards[this.currentCardIndex];
    if (!card) return;
    const progress = this.currentCardIndex + 1;
    const total = this.currentCards.length;

    // Kartı render et
    const cardContainer = document.getElementById('card-container');
    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="perspective-[1000px] group w-full">
          <div class="relative w-full min-h-[280px] sm:min-h-[400px] flip-card-inner" id="flip-card" role="button" tabindex="0" aria-label="Kartı çevir: soru ve cevap">
            <!-- Front -->
            <div class="absolute w-full h-full flip-card-front">
              <div class="flex flex-col items-stretch justify-start rounded-2xl bg-card-dark border border-border-dark shadow-xl shadow-black/10 h-full">
                <div class="flex w-full grow flex-col items-center justify-center gap-1 p-6 sm:p-8 text-center min-h-[220px] sm:min-h-[320px]">
                  <h2 class="text-primary text-base font-semibold tracking-wide uppercase">Soru</h2>
                  <p class="text-slate-100 text-2xl sm:text-3xl font-bold leading-tight tracking-tight mt-4 break-words max-w-full">${this.escapeHtml(card.question)}</p>
                  <p class="text-slate-400 text-base font-normal leading-normal mt-4">Cevabı görmek için tıklayın</p>
                </div>
              </div>
            </div>

            <!-- Back -->
            <div class="absolute w-full h-full flip-card-back">
              <div class="flex flex-col items-stretch justify-start rounded-2xl bg-card-dark border border-primary/25 shadow-xl shadow-black/10 h-full">
                <div class="flex w-full grow flex-col items-center justify-center gap-1 p-6 sm:p-8 text-center min-h-[220px] sm:min-h-[320px]">
                  <h2 class="inline-flex items-center rounded-full bg-primary/15 px-4 py-1 text-primary text-sm font-bold tracking-wide uppercase">Cevap</h2>
                  <p class="text-slate-100 text-2xl sm:text-3xl font-bold leading-tight tracking-tight mt-4 break-words max-w-full">${this.escapeHtml(card.answer)}</p>
                  ${card.category ? `<p class="text-slate-400 text-sm mt-4 break-words max-w-full">Kategori: ${this.escapeHtml(card.category)}</p>` : ''}
                  ${BOX_SCHEDULE[card.box] ? `<p class="text-slate-400 text-xs mt-3">Kutu ${card.box} • ${BOX_SCHEDULE[card.box]} günde bir tekrar</p>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Flip functionality
      const flipCard = document.getElementById('flip-card');
      if (flipCard) {
        flipCard.addEventListener('click', () => {
          flipCard.classList.toggle('flipped');
        });
        flipCard.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            flipCard.classList.toggle('flipped');
          }
        });
      }
    }

    // İlerleme render et
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const progressTrack = document.getElementById('progress-track');

    if (progressText) {
      progressText.textContent = `${progress} / ${total}`;
    }

    if (progressFill) {
      const percent = (progress / total) * 100;
      progressFill.style.width = `${percent}%`;
    }

    if (progressTrack) {
      progressTrack.setAttribute('aria-valuemax', String(total));
      progressTrack.setAttribute('aria-valuenow', String(progress));
    }

    // Tüm kartlar bitti mi kontrol et
    // Son kartsa ve o kart kaldıysa, cevap verdikten sonra otomatik tamamlanacak
    // (handleCardResponse'de zaten kontrol ediliyor)
  }

  /**
   * Çalışma sayfası event listener'larını ayarla
   */
  setupWorkPageEventListeners() {
    const correctBtn = document.getElementById('correct-btn');
    const wrongBtn = document.getElementById('wrong-btn');
    const closeBtn = document.getElementById('close-btn');

    if (correctBtn) {
      correctBtn.addEventListener('click', () => this.handleCardResponse(true));
    }

    if (wrongBtn) {
      wrongBtn.addEventListener('click', () => this.handleCardResponse(false));
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const isFree = this.studyMode === 'free';
        this.showConfirmationModal(
          isFree ? 'Serbest Çalışmadan Çık' : 'Çalışmayı Sonlandır',
          isFree
            ? 'Serbest çalışma oturumundan çıkmak istiyor musun? Bu oturumdaki alıştırma ilerlemen kaydedilmeyecek. Normal Leitner tekrar takvimin değişmeyecek.'
            : 'Çalışmayı sonlandırmak istediğinizden emin misiniz? İlerlemeniz kaydedilmiştir.',
          () => {
            window.location.href = 'index.html';
          }
        );
      });
    }

    // Keyboard shortcuts: Space kartı çevirir, 1/Sol yanlış, 2/Sağ doğru.
    // keydown kullanılır (keypress ok tuşlarında tutarlı çalışmaz).
    document.addEventListener('keydown', (e) => {
      if (this._isModalOpen()) return;
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      if (e.repeat) return;
      if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.handleCardResponse(false);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.handleCardResponse(true);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Odaktaki düğmenin beklenmedik tetiklenmesini ve sayfa kaymasını engeller.
        e.preventDefault();
        const flipCard = document.getElementById('flip-card');
        if (flipCard) flipCard.click();
      }
    });
  }

  /**
   * Onay diyaloğu açıkken kısayollar işletilmez
   */
  _isModalOpen() {
    const modal = document.getElementById('confirmation-modal');
    return !!modal && !modal.classList.contains('hidden');
  }

  /**
   * Yanıt düğmelerinin geçici kilit görünümü
   */
  setResponseEnabled(enabled) {
    const ids = ['correct-btn', 'wrong-btn'];
    for (const id of ids) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      btn.disabled = !enabled;
      if (btn.classList && typeof btn.classList.toggle === 'function') {
        btn.classList.toggle('opacity-50', !enabled);
        btn.classList.toggle('cursor-not-allowed', !enabled);
      }
    }
  }

  /**
   * Kart cevabını işle. Görünür bir kart en fazla bir yanıt alır: yanıt
   * işlenirken kilit tutulur, kilit yalnızca sonraki kart çizilince açılır.
   * Yalnızca Normal Çalışma kalıcı karta yazar; Serbest Çalışma yalnızca
   * oturum-içi ilerler ve depoya hiç dokunmaz.
   * Yazma başarısız olursa indeks ilerlemez, kullanıcı yeniden deneyebilir.
   */
  handleCardResponse(isCorrect) {
    if (this.studyComplete || this.isResponding) return;
    const card = this.currentCards[this.currentCardIndex];
    if (!card) return;

    this.isResponding = true;
    this.setResponseEnabled(false);

    if (this.studyMode !== 'free') {
      // Normal Çalışma: kart ilerlemesi kalıcı depoya yazılır.
      if (!Storage.updateCardBox(card.id, isCorrect)) {
        this.isResponding = false;
        this.setResponseEnabled(true);
        Utils.showToast('Kart kaydedilemedi; depolama hatası', 'error');
        return;
      }
    }

    // Sonraki karta geç
    this.currentCardIndex += 1;

    // Kontrol: Tüm kartlar bitti mi?
    if (this.currentCardIndex >= this.currentCards.length) {
      // Tamamlama ekranını göster
      this.showStudyComplete();
    } else {
      // Bir küçük delay ekle (UX için) sonra render et.
      // Jeton, oturum bittikten sonra gelen bayat çağrıları ezer.
      const token = ++this._renderToken;
      setTimeout(() => {
        if (token !== this._renderToken || this.studyComplete) return;
        this.isResponding = false;
        this.setResponseEnabled(true);
        this.renderCard();
      }, 300);
    }
  }

  /**
   * Çalışma tamamlandı (en fazla bir kez gösterilir)
   */
  showStudyComplete() {
    if (this.studyCompleteShown) return;
    this.studyCompleteShown = true;
    this.studyComplete = true;
    this._renderToken += 1;
    const cardContainer = document.getElementById('card-container');
    const buttonContainer = document.getElementById('button-container');
    const progressBar = document.getElementById('progress-bar');

    if (cardContainer) {
      const practiced = this.currentCards.length;
      const isFree = this.studyMode === 'free';
      cardContainer.innerHTML = isFree ? `
        <div class="flex flex-col items-center justify-center py-12 text-center" role="status">
          <div aria-hidden="true" class="w-16 h-16 rounded-full bg-primary/15 inline-flex items-center justify-center mb-5">
            <span class="material-symbols-outlined text-primary text-4xl">check_circle</span>
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2">Serbest Çalışma Tamamlandı</h2>
          <p class="text-slate-400 mb-2">Tekrar takvimin değişmedi.</p>
          <p class="text-slate-400 text-sm mb-8">${practiced} kart çalıştın.</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button data-action="go-deck" class="min-h-[48px] px-6 py-3 bg-primary text-slate-900 font-bold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition">
              Desteye Dön
            </button>
            <button data-action="go-home" class="min-h-[48px] px-6 py-3 bg-slate-700/50 text-slate-300 font-bold rounded-xl hover:bg-slate-700 active:scale-[0.98] transition">
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      ` : `
        <div class="flex flex-col items-center justify-center py-12 text-center" role="status">
          <div aria-hidden="true" class="w-16 h-16 rounded-full bg-primary/15 inline-flex items-center justify-center mb-5">
            <span class="material-symbols-outlined text-primary text-4xl">check_circle</span>
          </div>
          <h2 class="text-2xl font-bold text-slate-100 mb-2">Tebrikler!</h2>
          <p class="text-slate-400 mb-2">Bugünün çalışması tamamlandı.</p>
          <p class="text-slate-400 text-sm mb-8">${practiced} kartı bitirdin.</p>
          <button data-action="go-home" class="min-h-[48px] px-6 py-3 bg-primary text-slate-900 font-bold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition">
            Ana Sayfaya Dön
          </button>
        </div>
      `;
      const homeBtn = cardContainer.querySelector('[data-action="go-home"]');
      if (homeBtn) {
        homeBtn.addEventListener('click', () => {
          window.location.href = 'index.html';
        });
      }
      if (isFree) {
        const deckBtn = cardContainer.querySelector('[data-action="go-deck"]');
        if (deckBtn) {
          deckBtn.addEventListener('click', () => {
            if (this.currentDeckId) this.openDeckCards(this.currentDeckId);
          });
        }
      }
    }

    if (buttonContainer) {
      buttonContainer.innerHTML = '';
    }

    if (progressBar) {
      progressBar.innerHTML = '';
    }
  }

  /**
   * HTML escape (XSS prevention)
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Nitelik değeri escape (tırnak/köşeli parantez kaçışı).
   * data-id gibi eylemsiz niteliklere kimlik yerleştirirken kullanılır.
   */
  escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Uygulamayı başlat
const app = new LeitnerApp();
