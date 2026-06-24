// =====================================================
// app.js - Main Application v2
// =====================================================

const App = {
  currentPage: 'dashboard',
  currentUser: null,
  charts: {},

  async init() {
    this.setupLoginForm();

    // Cek session yang sudah ada
    try {
      const { data: { session } } = await window.QSEDb.db.auth.getSession();
      if (session?.user) {
        this.currentUser = session.user;
        this.showApp();
      } else {
        this.showLogin();
      }
    } catch(e) {
      console.error('Init error:', e);
      this.showLogin();
    }

    // Listen perubahan auth
    window.QSEDb.db.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session);
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = session.user;
        this.showApp();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.showLogin();
      }
    });
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  },

  showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    const email = this.currentUser?.email || 'QSE User';
    document.getElementById('user-email').textContent = email;
    this.setupNavigation();
    this.setupSidebar();
    this.navigate('dashboard');
  },

  setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = form.querySelector('button[type="submit"]');
      const errEl = document.getElementById('login-error');

      if (!email || !password) {
        errEl.textContent = 'Email dan password wajib diisi.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Masuk...';
      errEl.textContent = '';

      try {
        const { data, error } = await window.QSEDb.db.auth.signInWithPassword({ email, password });
        console.log('Login result:', data, error);

        if (error) {
          errEl.textContent = 'Login gagal: ' + error.message;
          btn.disabled = false;
          btn.textContent = 'Masuk ke Dashboard';
        } else if (data?.user) {
          this.currentUser = data.user;
          this.showApp();
        }
      } catch(err) {
        console.error('Login error:', err);
        errEl.textContent = 'Terjadi kesalahan. Cek koneksi internet.';
        btn.disabled = false;
        btn.textContent = 'Masuk ke Dashboard';
      }
    };
  },

  setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
        if (window.innerWidth < 768) {
          document.getElementById('sidebar').classList.remove('open');
          document.getElementById('sidebar-overlay').classList.remove('active');
        }
      });
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await window.QSEDb.db.auth.signOut();
    });
  },

  setupSidebar() {
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    menuBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};

    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat data...</p></div>';

    const pageMap = {
      dashboard:   () => window.DashboardModule?.render(),
      pettycash:   () => window.PettyCashModule?.render(),
      linen:       () => window.LinenModule?.render(),
      inventory:   () => window.InventoryModule?.render(),
      improvement: () => window.ImprovementModule?.render(),
      properties:  () => window.PropertiesModule?.render(),
      regional:    () => window.RegionalModule?.render(),
    };

    setTimeout(() => {
      if (pageMap[page]) pageMap[page]();
      else content.innerHTML = '<div class="empty-state"><p>Halaman tidak ditemukan.</p></div>';
    }, 150);
  },

  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  },

  formatDatetime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
  },

  openModal(title, bodyHTML, onConfirm = null) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const confirmBtn = document.getElementById('modal-confirm');
    if (onConfirm) {
      confirmBtn.style.display = 'block';
      confirmBtn.onclick = () => { onConfirm(); this.closeModal(); };
    } else {
      confirmBtn.style.display = 'none';
    }
    document.getElementById('modal-overlay').classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('modal-body').innerHTML = '';
  },

  showConfirm(message, onConfirm) {
    this.openModal('Konfirmasi', `<p style="color:var(--t2);margin:0">${message}</p>`, onConfirm);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
