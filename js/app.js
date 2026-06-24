// =====================================================
// app.js - Main Application, Router & Global Utils
// =====================================================

const App = {
  currentPage: 'dashboard',
  currentUser: null,
  charts: {},

  async init() {
    // Check auth state
    const { Auth } = window.QSEDb;
    Auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        this.currentUser = session.user;
        this.showApp();
      } else {
        this.currentUser = null;
        this.showLogin();
      }
    });

    // Check initial session
    const user = await Auth.getUser();
    if (user) {
      this.currentUser = user;
      this.showApp();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    this.setupLoginForm();
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
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = form.querySelector('button[type="submit"]');
      const errEl = document.getElementById('login-error');

      btn.disabled = true;
      btn.textContent = 'Masuk...';
      errEl.textContent = '';

      const { error } = await window.QSEDb.Auth.signIn(email, password);
      if (error) {
        errEl.textContent = 'Email atau password salah. Coba lagi.';
        btn.disabled = false;
        btn.textContent = 'Masuk';
      }
    };
  },

  setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          document.getElementById('sidebar').classList.remove('open');
          document.getElementById('sidebar-overlay').classList.remove('active');
        }
      });
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await window.QSEDb.Auth.signOut();
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

    // Update active nav
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Destroy existing charts
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};

    // Render page
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat data...</p></div>';

    const pageMap = {
      dashboard: () => window.DashboardModule?.render(),
      pettycash: () => window.PettyCashModule?.render(),
      linen: () => window.LinenModule?.render(),
      inventory: () => window.InventoryModule?.render(),
      improvement: () => window.ImprovementModule?.render(),
    };

    setTimeout(() => {
      if (pageMap[page]) pageMap[page]();
      else content.innerHTML = '<div class="empty-state"><p>Halaman tidak ditemukan.</p></div>';
    }, 100);
  },

  // ===================================================
  // GLOBAL UTILITIES
  // ===================================================
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDatetime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
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
    this.openModal('Konfirmasi', `<p style="color:var(--text-secondary);margin:0;">${message}</p>`, onConfirm);
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
