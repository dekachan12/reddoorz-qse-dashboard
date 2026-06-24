// =====================================================
// properties.js - Property Management Module
// =====================================================

const PropertiesModule = {
  data: [],

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">🏨 Manajemen Properti</h1>
          <p class="page-subtitle">Kelola 127 properti RedDoorz seluruh Indonesia</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="PropertiesModule.exportCSV()">⬇ Export</button>
          <button class="btn btn-primary" onclick="PropertiesModule.showAddForm()">+ Tambah Properti</button>
        </div>
      </div>

      <div class="summary-grid" id="prop-summary"></div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Properti</h3>
          <div class="filter-row">
            <select class="select-sm" id="prop-filter-region" onchange="PropertiesModule.renderTable()">
              <option value="">Semua Region</option>
              ${['Sumatera','Jawa','Kalimantan','Sulawesi','Bali & Nusa Tenggara','Papua & Maluku'].map(r=>`<option>${r}</option>`).join('')}
            </select>
            <select class="select-sm" id="prop-filter-brand" onchange="PropertiesModule.renderTable()">
              <option value="">Semua Brand</option>
              ${['RedDoorz','Sans Hotel','Urbanview','Lavana','Sunerra'].map(b=>`<option>${b}</option>`).join('')}
            </select>
            <select class="select-sm" id="prop-filter-status" onchange="PropertiesModule.renderTable()">
              <option value="">Semua Status</option>
              <option>Active</option><option>Inactive</option><option>Renovation</option>
            </select>
            <input type="text" class="input-sm" id="prop-search" placeholder="Cari nama/kota..." oninput="PropertiesModule.renderTable()" style="width:160px">
          </div>
        </div>
        <div id="prop-table-wrap"></div>
      </div>`;
    await this.loadData();
  },

  async loadData() {
    const { data, error } = await window.QSEDb.db.from('properties').select('*').order('region').order('city').order('name');
    if (error) { App.showToast('Gagal memuat properti: ' + error.message, 'error'); return; }
    this.data = data || [];
    window.QSEDb._properties = this.data; // cache global
    this.renderSummary();
    this.renderTable();
  },

  renderSummary() {
    const total = this.data.length;
    const active = this.data.filter(p => p.status === 'Active').length;
    const brands = [...new Set(this.data.map(p => p.brand))].length;
    const cities = [...new Set(this.data.map(p => p.city))].length;
    const totalRooms = this.data.reduce((s, p) => s + (p.total_rooms || 0), 0);

    document.getElementById('prop-summary').innerHTML = [
      { icon:'🏨', label:'Total Properti', value: total, color:'var(--t1)', sub:`${active} aktif`, bg:'rgba(59,130,246,.06)' },
      { icon:'🏙️', label:'Kota', value: cities+' kota', color:'var(--info)', sub:'Seluruh Indonesia', bg:'rgba(59,130,246,.06)' },
      { icon:'🛏️', label:'Total Kamar', value: totalRooms.toLocaleString(), color:'var(--success)', sub:'Semua properti', bg:'rgba(34,197,94,.06)' },
      { icon:'🔴', label:'Renovasi/Inactive', value: total-active, color: total-active>0?'var(--warning)':'var(--success)', sub:`${brands} brand`, bg:'rgba(245,158,11,.06)' },
    ].map(c=>`
      <div class="summary-card">
        <div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div>
        <div>
          <p class="summary-label">${c.label}</p>
          <p class="summary-value" style="color:${c.color}">${c.value}</p>
          <p class="summary-sub">${c.sub}</p>
        </div>
      </div>`).join('');
  },

  getFiltered() {
    const region = document.getElementById('prop-filter-region')?.value || '';
    const brand  = document.getElementById('prop-filter-brand')?.value || '';
    const status = document.getElementById('prop-filter-status')?.value || '';
    const search = document.getElementById('prop-search')?.value?.toLowerCase() || '';
    return this.data.filter(p => {
      if (region && p.region !== region) return false;
      if (brand  && p.brand  !== brand)  return false;
      if (status && p.status !== status) return false;
      if (search && !p.name.toLowerCase().includes(search) && !p.city.toLowerCase().includes(search) && !p.code.toLowerCase().includes(search)) return false;
      return true;
    });
  },

  renderTable() {
    const filtered = this.getFiltered();
    const wrap = document.getElementById('prop-table-wrap');
    if (!wrap) return;
    if (!filtered.length) { wrap.innerHTML = '<div class="empty-state"><p class="empty-icon">🏨</p><p>Tidak ada properti ditemukan.</p></div>'; return; }

    const statusClass = { Active:'badge-success', Inactive:'badge-danger', Renovation:'badge-warning' };
    const brandClass  = { RedDoorz:'badge-red', 'Sans Hotel':'badge-info', 'Zo Rooms':'badge-neutral', 'Nite Jolie':'badge-neutral' };

    wrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr>
            <th>Kode</th><th>Nama Properti</th><th>Brand</th>
            <th>Kota</th><th>Region</th><th>PIC</th>
            <th class="text-center">Kamar</th><th>Status</th><th>Aksi</th>
          </tr></thead>
          <tbody>${filtered.map(p=>`
            <tr>
              <td class="text-muted nowrap">${p.code}</td>
              <td class="fw-600">${p.name}</td>
              <td><span class="badge ${brandClass[p.brand]||'badge-neutral'}">${p.brand}</span></td>
              <td>${p.city}</td>
              <td><span class="badge badge-neutral">${p.region}</span></td>
              <td>${p.pic_name||'-'}</td>
              <td class="text-center">${p.total_rooms||0}</td>
              <td><span class="badge ${statusClass[p.status]||'badge-neutral'}">${p.status}</span></td>
              <td><div class="action-btns">
                <button class="btn-icon" onclick="PropertiesModule.showEditForm('${p.id}')" title="Edit">✏️</button>
                <button class="btn-icon btn-icon-danger" onclick="PropertiesModule.deleteProperty('${p.id}')" title="Hapus">🗑</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  showAddForm(existing = null) {
    const isEdit = !!existing; const p = existing || {};
    App.openModal(isEdit ? 'Edit Properti' : 'Tambah Properti', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Kode Properti *</label><input type="text" id="pf-code" class="form-control" placeholder="RDZ-MDN-001" value="${p.code||''}"></div>
        <div class="form-group"><label class="form-label">Brand *</label>
          <select id="pf-brand" class="form-control">${['RedDoorz','Sans Hotel','Urbanview','Lavana','Sunerra'].map(b=>`<option ${p.brand===b?'selected':''}>${b}</option>`).join('')}</select></div>
        <div class="form-group form-full"><label class="form-label">Nama Properti *</label><input type="text" id="pf-name" class="form-control" placeholder="e.g. RedDoorz Medan Petisah" value="${p.name||''}"></div>
        <div class="form-group"><label class="form-label">Kota *</label><input type="text" id="pf-city" class="form-control" placeholder="Medan" value="${p.city||''}"></div>
        <div class="form-group"><label class="form-label">Provinsi *</label><input type="text" id="pf-province" class="form-control" placeholder="Sumatera Utara" value="${p.province||''}"></div>
        <div class="form-group"><label class="form-label">Region *</label>
          <select id="pf-region" class="form-control">${['Sumatera','Jawa','Kalimantan','Sulawesi','Bali & Nusa Tenggara','Papua & Maluku'].map(r=>`<option ${p.region===r?'selected':''}>${r}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Total Kamar</label><input type="number" id="pf-rooms" class="form-control" value="${p.total_rooms||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Nama PIC</label><input type="text" id="pf-pic" class="form-control" value="${p.pic_name||''}"></div>
        <div class="form-group"><label class="form-label">No HP PIC</label><input type="text" id="pf-phone" class="form-control" value="${p.pic_phone||''}"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select id="pf-status" class="form-control">${['Active','Inactive','Renovation'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group form-full"><label class="form-label">Alamat</label><textarea id="pf-address" class="form-control" rows="2">${p.address||''}</textarea></div>
      </div>`, async () => {
      const record = {
        code: document.getElementById('pf-code').value.trim().toUpperCase(),
        brand: document.getElementById('pf-brand').value,
        name: document.getElementById('pf-name').value.trim(),
        city: document.getElementById('pf-city').value.trim(),
        province: document.getElementById('pf-province').value.trim(),
        region: document.getElementById('pf-region').value,
        total_rooms: parseInt(document.getElementById('pf-rooms').value)||0,
        pic_name: document.getElementById('pf-pic').value.trim(),
        pic_phone: document.getElementById('pf-phone').value.trim(),
        status: document.getElementById('pf-status').value,
        address: document.getElementById('pf-address').value.trim(),
      };
      if (!record.code || !record.name || !record.city) { App.showToast('Kode, nama, dan kota wajib diisi!', 'error'); return; }
      const result = isEdit
        ? await window.QSEDb.db.from('properties').update(record).eq('id', p.id).select()
        : await window.QSEDb.db.from('properties').insert([record]).select();
      if (result.error) { App.showToast('Gagal menyimpan: ' + result.error.message, 'error'); return; }
      App.showToast(`Properti berhasil ${isEdit?'diperbarui':'ditambahkan'}!`, 'success');
      await this.loadData();
    });
  },

  showEditForm(id) { const p = this.data.find(x => x.id === id); if (p) this.showAddForm(p); },

  async deleteProperty(id) {
    App.showConfirm('Yakin hapus properti ini? Data terkait tidak akan terhapus.', async () => {
      const { error } = await window.QSEDb.db.from('properties').delete().eq('id', id);
      if (error) { App.showToast('Gagal menghapus: ' + error.message, 'error'); return; }
      App.showToast('Properti dihapus.', 'success');
      await this.loadData();
    });
  },

  exportCSV() {
    const rows = [['Kode','Nama','Brand','Kota','Provinsi','Region','PIC','Kamar','Status']];
    this.data.forEach(p => rows.push([p.code,p.name,p.brand,p.city,p.province,p.region,p.pic_name||'',p.total_rooms||0,p.status]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `properties-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    App.showToast('Export berhasil!', 'success');
  }
};
window.PropertiesModule = PropertiesModule;
