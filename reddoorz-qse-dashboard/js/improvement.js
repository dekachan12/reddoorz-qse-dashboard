// =====================================================
// improvement.js - Improvement Tracking Module
// =====================================================

const ImprovementModule = {
  data: [],
  filterStatus: '',
  filterPriority: '',
  filterCategory: '',

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">📈 Improvement Tracking</h1>
          <p class="page-subtitle">Monitor dan kelola program perbaikan properti QSE</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="ImprovementModule.showAddForm()">+ Tambah Item</button>
        </div>
      </div>

      <div class="summary-grid" id="imp-summary"></div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Improvement</h3>
          <div class="filter-row">
            <select class="select-sm" id="imp-filter-status" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Status</option>
              ${['Open','In Progress','Completed','Verified'].map(s=>`<option value="${s}">${s}</option>`).join('')}
            </select>
            <select class="select-sm" id="imp-filter-priority" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Prioritas</option>
              ${['Critical','High','Medium','Low'].map(p=>`<option value="${p}">${p}</option>`).join('')}
            </select>
            <select class="select-sm" id="imp-filter-cat" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Kategori</option>
              ${['Quality','Safety','Environment','Guest Satisfaction','Operational'].map(c=>`<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="imp-cards-wrap"></div>
      </div>
    `;
    await this.loadData();
  },

  async loadData() {
    const { data, error } = await window.QSEDb.ImprovementDB.getAll();
    if (error) { App.showToast('Gagal memuat data: ' + error.message, 'error'); return; }
    this.data = data || [];
    this.renderSummary();
    this.renderCards();
  },

  renderSummary() {
    const total = this.data.length;
    const open = this.data.filter(i => i.status === 'Open').length;
    const inProgress = this.data.filter(i => i.status === 'In Progress').length;
    const done = this.data.filter(i => i.status === 'Completed' || i.status === 'Verified').length;
    const critical = this.data.filter(i => i.priority === 'Critical' && i.status !== 'Verified').length;

    document.getElementById('imp-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-icon-wrap">📋</div>
        <div>
          <p class="summary-label">Total Item</p>
          <p class="summary-value">${total}</p>
          <p class="summary-sub">Semua improvement</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">🔄</div>
        <div>
          <p class="summary-label">In Progress</p>
          <p class="summary-value" style="color:var(--info)">${inProgress}</p>
          <p class="summary-sub">${open} item masih Open</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">✅</div>
        <div>
          <p class="summary-label">Selesai</p>
          <p class="summary-value" style="color:var(--success)">${done}</p>
          <p class="summary-sub">${total ? Math.round(done/total*100) : 0}% completion rate</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">🚨</div>
        <div>
          <p class="summary-label">Critical Open</p>
          <p class="summary-value" style="color:${critical>0?'var(--danger)':'var(--success)'}">${critical}</p>
          <p class="summary-sub">${critical > 0 ? 'Perlu perhatian segera!' : 'Tidak ada critical open'}</p>
        </div>
      </div>
    `;
  },

  applyFilter() {
    this.filterStatus = document.getElementById('imp-filter-status')?.value || '';
    this.filterPriority = document.getElementById('imp-filter-priority')?.value || '';
    this.filterCategory = document.getElementById('imp-filter-cat')?.value || '';
    this.renderCards();
  },

  getFiltered() {
    return this.data.filter(i => {
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      if (this.filterPriority && i.priority !== this.filterPriority) return false;
      if (this.filterCategory && i.category !== this.filterCategory) return false;
      return true;
    });
  },

  renderCards() {
    const filtered = this.getFiltered();
    const wrap = document.getElementById('imp-cards-wrap');
    if (!wrap) return;

    if (filtered.length === 0) {
      wrap.innerHTML = '<div class="empty-state"><p class="empty-icon">📈</p><p>Tidak ada item improvement ditemukan.<br>Tambahkan item pertama!</p></div>';
      return;
    }

    const priorityColor = { Critical: '#E31837', High: '#F59E0B', Medium: '#3B82F6', Low: '#10B981' };
    const statusColor = { Open: '#64748B', 'In Progress': '#3B82F6', Completed: '#10B981', Verified: '#E31837' };

    wrap.innerHTML = `<div class="improvement-grid">${filtered.map(i => `
      <div class="imp-card">
        <div class="imp-card-header">
          <div class="imp-badges">
            <span class="badge" style="background:${priorityColor[i.priority]}20;color:${priorityColor[i.priority]}">${i.priority}</span>
            <span class="badge" style="background:${statusColor[i.status]}20;color:${statusColor[i.status]}">${i.status}</span>
            <span class="badge badge-neutral">${i.category}</span>
          </div>
          <div class="imp-actions">
            <button class="btn-icon" onclick="ImprovementModule.showEditForm('${i.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="ImprovementModule.deleteItem('${i.id}')" title="Hapus">🗑</button>
          </div>
        </div>
        <h4 class="imp-title">${i.title}</h4>
        ${i.description ? `<p class="imp-desc">${i.description}</p>` : ''}
        <div class="progress-wrap">
          <div class="progress-header">
            <span>Progress</span>
            <span class="progress-pct">${i.progress}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar" style="width:${i.progress}%;background:${i.progress>=100?'var(--success)':i.progress>=50?'var(--info)':'var(--warning)'}"></div>
          </div>
        </div>
        <div class="imp-meta">
          ${i.department ? `<span>🏨 ${i.department}</span>` : ''}
          ${i.target_date ? `<span>🎯 Target: ${App.formatDate(i.target_date)}</span>` : ''}
          ${i.start_date ? `<span>📅 Mulai: ${App.formatDate(i.start_date)}</span>` : ''}
        </div>
        ${(i.before_condition || i.after_condition) ? `
          <div class="imp-conditions">
            ${i.before_condition ? `<div class="cond-box cond-before"><span class="cond-label">Sebelum</span><p>${i.before_condition}</p></div>` : ''}
            ${i.after_condition ? `<div class="cond-box cond-after"><span class="cond-label">Sesudah</span><p>${i.after_condition}</p></div>` : ''}
          </div>` : ''}
        <div class="imp-quick-actions">
          ${['Open','In Progress','Completed','Verified'].filter(s => s !== i.status).map(s =>
            `<button class="btn-xs" onclick="ImprovementModule.updateStatus('${i.id}','${s}')" style="background:${statusColor[s]}20;color:${statusColor[s]};border:1px solid ${statusColor[s]}40">${s}</button>`
          ).join('')}
        </div>
      </div>
    `).join('')}</div>`;
  },

  showAddForm(existing = null) {
    const isEdit = !!existing;
    const item = existing || {};
    App.openModal(isEdit ? 'Edit Improvement' : 'Tambah Improvement', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Judul *</label>
          <input type="text" id="imf-title" class="form-control" placeholder="e.g. Perbaikan pencahayaan lobby" value="${item.title||''}">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Deskripsi</label>
          <textarea id="imf-desc" class="form-control" rows="2">${item.description||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori *</label>
          <select id="imf-cat" class="form-control">
            ${['Quality','Safety','Environment','Guest Satisfaction','Operational'].map(c=>`<option value="${c}" ${item.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prioritas *</label>
          <select id="imf-priority" class="form-control">
            ${['Low','Medium','High','Critical'].map(p=>`<option value="${p}" ${item.priority===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="imf-status" class="form-control">
            ${['Open','In Progress','Completed','Verified'].map(s=>`<option value="${s}" ${item.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Progress (%)</label>
          <input type="number" id="imf-progress" class="form-control" value="${item.progress||0}" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">Departemen / Area</label>
          <input type="text" id="imf-dept" class="form-control" placeholder="e.g. Housekeeping" value="${item.department||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal Mulai</label>
          <input type="date" id="imf-start" class="form-control" value="${item.start_date||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Target Selesai</label>
          <input type="date" id="imf-target" class="form-control" value="${item.target_date||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal Selesai Aktual</label>
          <input type="date" id="imf-done" class="form-control" value="${item.completed_date||''}">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Kondisi Sebelum</label>
          <textarea id="imf-before" class="form-control" rows="2" placeholder="Deskripsikan kondisi sebelum perbaikan">${item.before_condition||''}</textarea>
        </div>
        <div class="form-group form-full">
          <label class="form-label">Kondisi Sesudah</label>
          <textarea id="imf-after" class="form-control" rows="2" placeholder="Deskripsikan kondisi sesudah perbaikan">${item.after_condition||''}</textarea>
        </div>
      </div>
    `, async () => {
      const record = {
        title: document.getElementById('imf-title').value.trim(),
        description: document.getElementById('imf-desc').value,
        category: document.getElementById('imf-cat').value,
        priority: document.getElementById('imf-priority').value,
        status: document.getElementById('imf-status').value,
        progress: parseInt(document.getElementById('imf-progress').value) || 0,
        department: document.getElementById('imf-dept').value,
        start_date: document.getElementById('imf-start').value || null,
        target_date: document.getElementById('imf-target').value || null,
        completed_date: document.getElementById('imf-done').value || null,
        before_condition: document.getElementById('imf-before').value,
        after_condition: document.getElementById('imf-after').value,
      };
      if (!record.title) { App.showToast('Judul wajib diisi!', 'error'); return; }
      let result;
      if (isEdit) result = await window.QSEDb.ImprovementDB.update(item.id, record);
      else result = await window.QSEDb.ImprovementDB.insert(record);
      if (result.error) { App.showToast('Gagal menyimpan: ' + result.error.message, 'error'); return; }
      App.showToast(`Improvement berhasil ${isEdit?'diperbarui':'ditambahkan'}!`, 'success');
      await this.loadData();
    });
  },

  showEditForm(id) {
    const item = this.data.find(i => i.id === id);
    if (item) this.showAddForm(item);
  },

  async updateStatus(id, newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'Completed' || newStatus === 'Verified') updates.progress = 100;
    if (newStatus === 'In Progress' && !this.data.find(i=>i.id===id)?.start_date) updates.start_date = new Date().toISOString().split('T')[0];
    const { error } = await window.QSEDb.ImprovementDB.update(id, updates);
    if (error) { App.showToast('Gagal update status.', 'error'); return; }
    App.showToast(`Status diperbarui ke "${newStatus}"`, 'success');
    await this.loadData();
  },

  async deleteItem(id) {
    App.showConfirm('Yakin ingin menghapus item improvement ini?', async () => {
      const { error } = await window.QSEDb.ImprovementDB.delete(id);
      if (error) { App.showToast('Gagal menghapus.', 'error'); return; }
      App.showToast('Item dihapus.', 'success');
      await this.loadData();
    });
  }
};

window.ImprovementModule = ImprovementModule;
