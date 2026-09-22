// ==========================================
// SETTINGS.JS - Ayarlar Sayfası
// ==========================================

class SettingsPage {
  constructor() {
    this.pendingImport = null;
    this.init();
  }

  init() {
    this.setupThemeListeners();
    this.setupDataManagementListeners();
    this.loadThemePreference();
  }

  /**
   * Tema seçimi event listener'larını ayarla
   */
  setupThemeListeners() {
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');

    if (lightBtn) {
      lightBtn.addEventListener('click', () => this.setTheme('light'));
    }

    if (darkBtn) {
      darkBtn.addEventListener('click', () => this.setTheme('dark'));
    }
  }

  /**
   * Tema ayarla
   */
  setTheme(theme) {
    const html = document.documentElement;
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');

    if (theme === 'light') {
      html.classList.remove('dark');
      localStorage.setItem('leitner_theme', 'light');
      if (lightBtn) lightBtn.classList.add('bg-primary', 'text-slate-900');
      if (lightBtn) lightBtn.classList.remove('bg-slate-700', 'text-slate-300');
      if (darkBtn) darkBtn.classList.remove('bg-primary', 'text-slate-900');
      if (darkBtn) darkBtn.classList.add('bg-slate-700', 'text-slate-300');
    } else {
      html.classList.add('dark');
      localStorage.setItem('leitner_theme', 'dark');
      if (darkBtn) darkBtn.classList.add('bg-primary', 'text-slate-900');
      if (darkBtn) darkBtn.classList.remove('bg-slate-700', 'text-slate-300');
      if (lightBtn) lightBtn.classList.remove('bg-primary', 'text-slate-900');
      if (lightBtn) lightBtn.classList.add('bg-slate-700', 'text-slate-300');
    }

    Utils.showToast(`Tema: ${theme === 'light' ? 'Açık' : 'Koyu'}`, 'success');
  }

  /**
   * Kaydedilmiş tema tercihini yükle
   */
  loadThemePreference() {
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('leitner_theme') || 'dark';
    } catch (error) {
      void error;
    }
    const html = document.documentElement;
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');

    if (savedTheme === 'light') {
      html.classList.remove('dark');
      if (lightBtn) lightBtn.classList.add('bg-primary', 'text-slate-900');
      if (lightBtn) lightBtn.classList.remove('bg-slate-700', 'text-slate-300');
      if (darkBtn) darkBtn.classList.remove('bg-primary', 'text-slate-900');
      if (darkBtn) darkBtn.classList.add('bg-slate-700', 'text-slate-300');
    } else {
      html.classList.add('dark');
      if (darkBtn) darkBtn.classList.add('bg-primary', 'text-slate-900');
      if (darkBtn) darkBtn.classList.remove('bg-slate-700', 'text-slate-300');
      if (lightBtn) lightBtn.classList.remove('bg-primary', 'text-slate-900');
      if (lightBtn) lightBtn.classList.add('bg-slate-700', 'text-slate-300');
    }
  }

  /**
   * Veri yönetimi event listener'larını ayarla
   */
  setupDataManagementListeners() {
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importFile = document.getElementById('import-file-input');
    const resetBtn = document.getElementById('reset-data-btn');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => importFile?.click());
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => this.importData(e));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.showResetConfirmation());
    }
  }

  /**
   * Verileri dışa aktar
   */
  exportData() {
    try {
      const data = Storage.exportData();
      const filename = `leitner-export-${new Date().toISOString().split('T')[0]}.json`;
      Utils.downloadJSON(data, filename);
      Utils.showToast('Veriler indirildi', 'success');
    } catch (error) {
      void error;
      Utils.showToast('Veriler okunamadı; kayıtlı veri bozuk olabilir', 'error');
    }
  }

  /**
   * Verileri içe aktar: önce doğrula, sonra uygulama içi modal ile onay al.
   * Onaylanmadan veya doğrulama geçmeden mevcut veri değiştirilmez.
   */
  importData(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;

    Utils.readJSONFile(file)
      .then(data => {
        let check;
        try {
          check = Storage.validateBackup(data);
        } catch (error) {
          void error;
          check = { ok: false, error: 'Yedek doğrulanamadı.' };
        }
        if (!check.ok) {
          Utils.showToast('Geçersiz yedek: ' + check.error, 'error');
          input.value = '';
          return;
        }
        this.pendingImport = {
          raw: JSON.stringify(data),
          decks: check.decks.length,
          cards: check.cards.length
        };
        this.showConfirmationModal(
          'Yedeği İçe Aktar',
          `${check.decks.length} deste ve ${check.cards.length} kart içe aktarılacak. Mevcut verileriniz değiştirilecek. Devam edilsin mi?`,
          () => this.applyPendingImport(input),
          {
            confirmLabel: 'İçe Aktar',
            onCancel: () => {
              this.pendingImport = null;
              input.value = '';
              Utils.showToast('İçe aktarma iptal edildi', 'info');
            }
          }
        );
      })
      .catch(() => {
        Utils.showToast('Dosya okunamadı. Geçerli bir JSON yedeği seçin.', 'error');
        input.value = '';
      });
  }

  /**
   * Onaylanan yedeği uygula
   */
  applyPendingImport(input) {
    const pending = this.pendingImport;
    this.pendingImport = null;
    if (input) input.value = '';
    if (!pending) {
      Utils.showToast('İçe aktarma iptal edildi', 'info');
      return;
    }

    let result;
    try {
      result = Storage.importData(pending.raw);
    } catch (error) {
      void error;
      result = { ok: false, code: 'storage-error', error: 'Depolamaya yazılamadı; mevcut veriler korundu.' };
    }

    if (result && result.ok) {
      Utils.showToast('Veriler başarıyla yüklendi!', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else if (result && result.code === 'rollback-failed') {
      Utils.showToast('Yazma başarısız oldu ve önceki veri geri yüklenemedi', 'error');
    } else if (result && result.code === 'storage-error') {
      Utils.showToast('Depolamaya yazılamadı; mevcut veriler korundu', 'error');
    } else {
      Utils.showToast('Geçersiz yedek: ' + ((result && result.error) || 'bilinmeyen hata'), 'error');
    }
  }

  /**
   * Reset onay göster
   */
  showResetConfirmation() {
    this.showConfirmationModal(
      'Tüm Verileri Sil',
      'Bu işlem tüm desteler ve kartları silecek ve geri alınamaz. Emin misiniz?',
      () => this.resetAllData()
    );
  }

  /**
   * Tüm verileri sil. Kısmi silme başarılı bildirilmez; geri alma
   * başarısızlığı ayrıca raporlanır.
   */
  resetAllData() {
    let result;
    try {
      result = Storage.clearAll();
    } catch (error) {
      void error;
      result = { ok: false, code: 'storage-error' };
    }
    if (result && result.ok) {
      Utils.showToast('Tüm veriler silindi', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else if (result && result.code === 'rollback-failed') {
      Utils.showToast('Silme yarıda kesildi ve önceki veri geri yüklenemedi', 'error');
    } else {
      Utils.showToast('Veriler silinemedi; mevcut veriler korundu', 'error');
    }
  }

  /**
   * Onay modalını göster.
   * Odak güvenli iptal düğmesine girer; Escape iptal eder; Tab diyalogda kalır.
   */
  showConfirmationModal(title, message, onConfirm, options) {
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

    if (options && options.confirmLabel) {
      newConfirmBtn.textContent = options.confirmLabel;
    }

    // Yeni event listenerları ekle
    newConfirmBtn.addEventListener('click', () => {
      onConfirm();
      this.hideConfirmationModal();
    });

    newCancelBtn.addEventListener('click', () => {
      if (options && typeof options.onCancel === 'function') {
        options.onCancel();
      }
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
}

// Sayfayı başlat
const settingsPage = new SettingsPage();
