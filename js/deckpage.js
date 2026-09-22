// ==========================================
// DECKPAGE.JS - Deste Yönetim Sayfası
// ==========================================

class DeckPage {
  constructor() {
    this.deckId = null;
    this.init();
  }

  init() {
    this.loadTheme();
    const params = new URLSearchParams(window.location.search);
    this.deckId = params.get('id');

    if (!this.deckId) {
      window.location.href = 'index.html';
      return;
    }

    try {
      this.loadDeckInfo();
      this.renderCards();
    } catch (error) {
      void error;
      const deckTitle = document.getElementById('deck-title');
      if (deckTitle) {
        deckTitle.textContent = 'Veri okunamadı';
      }
      const deckSubtitle = document.getElementById('deck-subtitle');
      if (deckSubtitle) {
        deckSubtitle.textContent = '';
      }
      Utils.showStorageError('cards-container');
    }
    this.setupEventListeners();
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
   * Deste bilgilerini yükle
   */
  loadDeckInfo() {
    const decks = Storage.getDecks();
    const deck = decks.find(d => d.id === this.deckId);

    if (!deck) {
      window.location.href = 'index.html';
      return;
    }

    document.title = `${deck.name} - Kartları Yönet`;
    const deckTitle = document.getElementById('deck-title');
    if (deckTitle) {
      deckTitle.textContent = deck.name;
    }

    this.renderDeckSubtitle();
  }

  /**
   * Deste alt başlığındaki sayaçları tazeler (salt okuma görünümü).
   */
  renderDeckSubtitle() {
    const deckSubtitle = document.getElementById('deck-subtitle');
    if (deckSubtitle) {
      const cards = Storage.getCardsByDeck(this.deckId);
      const due = Storage.getCardsDueForReview(this.deckId).length;
      deckSubtitle.textContent = `${cards.length} kart • ${due} tekrar bekliyor`;
    }
  }

  /**
   * Kartları render et
   */
  renderCards() {
    const cards = Storage.getCardsByDeck(this.deckId);
    const container = document.getElementById('cards-container');

    if (!container) return;

    const cardsTitle = document.getElementById('cards-title');
    if (cardsTitle) {
      cardsTitle.textContent = cards.length > 0 ? `Kartlar (${cards.length})` : 'Kartlar';
    }

    if (cards.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-card-dark rounded-2xl border border-dashed border-border-dark p-8 text-center">
          <div aria-hidden="true" class="w-12 h-12 rounded-full bg-primary/15 inline-flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-primary">style</span>
          </div>
          <p class="text-slate-100 font-bold mb-1">Bu destede henüz kart yok.</p>
          <p class="text-slate-400 text-sm">Yukarıdaki formu kullanarak ilk kartı ekle.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = cards.map(card => {
      const boxLabels = {
        1: '📦 Kutu 1',
        2: '📦 Kutu 2',
        3: '📦 Kutu 3',
        4: '📦 Kutu 4',
        5: '📦 Kutu 5'
      };

      return `
        <div class="lp-lift bg-card-dark rounded-2xl border border-border-dark p-4 hover:shadow-lg transition-shadow">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <p class="text-slate-100 font-bold text-sm mb-1 break-words">${this.escapeHtml(card.question)}</p>
              <p class="text-slate-300 text-xs mb-2 break-words">${this.escapeHtml(card.answer)}</p>
              ${card.category ? `<p class="text-slate-400 text-xs break-words">📌 ${this.escapeHtml(card.category)}</p>` : ''}
            </div>
            <button data-action="delete-card" data-id="${this.escapeAttr(card.id)}" aria-label="Kartı sil" class="p-1 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-border-dark">
            <span class="text-xs font-medium text-primary">${boxLabels[card.box]}</span>
            <span class="text-xs text-slate-400">${Utils.formatDate(card.createdAt)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Event listener'ları ayarla. Kart silme düğmeleri için tek bir
   * yetkilendirilmiş dinleyici kullanılır; liste yeniden çizilse de
   * dinleyici tek kalır, her eylem bir kez çalışır.
   */
  setupEventListeners() {
    const addBtn = document.getElementById('add-card-btn');
    const questionInput = document.getElementById('card-question-input');
    const answerInput = document.getElementById('card-answer-input');
    const categoryInput = document.getElementById('card-category-input');
    const deleteBtn = document.getElementById('delete-deck-btn');
    const container = document.getElementById('cards-container');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.addNewCard());
    }

    if (questionInput) {
      questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addNewCard();
      });
    }

    if (answerInput) {
      answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addNewCard();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteDeck());
    }

    if (container && !container.dataset.delegationBound) {
      container.dataset.delegationBound = 'true';
      container.addEventListener('click', (e) => {
        const target = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
        if (!target || !container.contains(target)) return;
        if (target.getAttribute('data-action') === 'delete-card') {
          const cardId = target.getAttribute('data-id');
          if (cardId) this.deleteCard(cardId);
        }
      });
    }
  }

  /**
   * Yeni kart ekle
   */
  addNewCard() {
    const questionInput = document.getElementById('card-question-input');
    const answerInput = document.getElementById('card-answer-input');
    const categoryInput = document.getElementById('card-category-input');

    const question = Utils.validateInput(questionInput.value, 2);
    const answer = Utils.validateInput(answerInput.value, 2);
    const category = categoryInput.value.trim();

    if (!question || !answer) {
      Utils.showToast('Soru ve cevap en az 2 karakter olmalı', 'error');
      return;
    }

    const card = Storage.createCard(this.deckId, question, answer, category);
    if (!card) {
      Utils.showToast('Kart kaydedilemedi; depolama hatası', 'error');
      return;
    }
    
    questionInput.value = '';
    answerInput.value = '';
    categoryInput.value = '';
    
    this.renderCards();
    try {
      this.renderDeckSubtitle();
    } catch (error) {
      void error;
    }
    Utils.showToast('Kart eklendi!', 'success');
    questionInput.focus();
  }

  /**
   * Kartı sil (Modal ile onay sor)
   */
  deleteCard(cardId) {
    let card;
    try {
      const cards = Storage.getCardsByDeck(this.deckId);
      card = cards.find(c => c.id === cardId);
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
      return;
    }
    if (!card) return;

    this.showConfirmationModal(
      'Kartı Sil',
      `"${this.escapeHtml(card.question)}" kartını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      () => {
        if (!Storage.deleteCard(cardId)) {
          Utils.showToast('Kart silinemedi; depolama hatası', 'error');
          return;
        }
        this.renderCards();
        try {
          this.renderDeckSubtitle();
        } catch (error) {
          void error;
        }
        Utils.showToast('Kart silindi', 'success');
      }
    );
  }

  /**
   * Destoyu sil (Modal ile onay sor)
   */
  deleteDeck() {
    let deck;
    let cardCount = 0;
    try {
      const decks = Storage.getDecks();
      deck = decks.find(d => d.id === this.deckId);
      cardCount = Storage.getCardsByDeck(this.deckId).length;
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
      return;
    }
    if (!deck) return;

    this.showConfirmationModal(
      `"${this.escapeHtml(deck.name)}" Destesi Sil`,
      `Bu destoyu ve içindeki ${cardCount} kartı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      () => {
        if (!Storage.deleteDeck(this.deckId)) {
          Utils.showToast('Deste silinemedi; depolama hatası', 'error');
          return;
        }
        Utils.showToast('Deste silindi', 'success');
        window.location.href = 'index.html';
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
   * HTML escape
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

// Sayfayı başlat
const deckPage = new DeckPage();
