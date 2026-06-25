// =====================================================
// inspection.js - Modul Inspeksi & Checklist
// =====================================================

const InspectionModule = {
  data: [], properties: [],

  CHECKLIST_TEMPLATE: [
    { category: 'Kamar Tidur', items: ['Kebersihan lantai', 'Kebersihan tempat tidur & linen', 'Kondisi AC berfungsi', 'Kondisi TV berfungsi', 'Pencahayaan cukup', 'Tidak ada bau tidak sedap', 'Amenities tersedia lengkap', 'Kunci pintu berfungsi'] },
    { category: 'Kamar Mandi', items: ['Kebersihan toilet', 'Kebersihan lantai & dinding', 'Air panas tersedia', 'Shower/bath berfungsi', 'Sabun & shampoo tersedia', 'Handuk bersih & lengkap', 'Tidak ada kebocoran', 'Exhaust fan berfungsi'] },
    { category: 'Lobby & Area Umum', items: ['Kebersihan lobby', 'Pencahayaan area umum', 'AC lobby berfungsi', 'Resepsionis responsif', 'Signage terpasang dengan baik', 'Kursi & meja bersih', 'Tanaman/dekorasi terawat'] },
    { category: 'Keselamatan (Safety)', items: ['APAR tersedia & tidak kadaluarsa', 'Jalur evakuasi jelas', 'Hydrant berfungsi', 'Smoke detector terpasang', 'Kotak P3K tersedia', 'CCTV berfungsi', 'Pintu darurat tidak terhalang'] },
    { category: 'Operasional', items: ['SOP terpampang', 'Buku tamu tersedia', 'Wifi berfungsi', 'Parkir tertata rapi', 'Seragam staf rapi', 'Log book terisi'] },
  ],

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">📋 Inspeksi Properti</h1><p class="page-subtitle">Checklist comply/non-comply per properti</p></div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="InspectionModule.showHistory()">📜 Riwayat</button>
          <button class="btn btn-primary" onclick="InspectionModule.showNewForm()">+ Mulai Inspeksi</button>
        </div>
      </div>

      <div class="summary-grid" id="insp-summary"></div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Riwayat Inspeksi</h3>
          <div class="filter-row">
            <select class="select-sm" id="insp-filter-prop" onchange="InspectionModule.applyFilter()" style="min-width:220px">
              <option value="">Semua Properti</option>
            </select>
            <select class="select-sm" id="insp-filter-status" onchange="InspectionModule.applyFilter()">
              <option value="">Semua Status</option>
              ${['Draft','Submitted','Reviewed','Closed'].map(s=>`<option>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="insp-table-wrap"></div>
      </div>`;

    await this.loadProperties();
    await this.loadData();
  },

  async loadProperties() {
    const { data } = await window.QSEDb.db.from('properties').select('id,name,code,city').order('name');
    this.properties = data||[];
    const sel = document.getElementById('insp-filter-prop');
    if(sel) this.properties.forEach(p=>{
      const opt=document.createElement('option');
      opt.value=p.id; opt.textContent=`${p.code} - ${p.name}`;
      sel.appendChild(opt);
    });
  },

  async loadData() {
    const { data, error } = await window.QSEDb.db
      .from('inspections')
      .select('*, properties(name,code,city)')
      .order('inspection_date', { ascending: false });
    if(error){ App.showToast('Gagal memuat inspeksi: '+error.message,'error'); return; }
    this.data = data||[];
    this.renderSummary();
    this.renderTable();
  },

  renderSummary() {
    const total = this.data.length;
    const submitted = this.data.filter(i=>i.status==='Submitted'||i.status==='Reviewed').length;
    const closed = this.data.filter(i=>i.status==='Closed').length;
    const avgScore = total ? Math.round(this.data.filter(i=>i.overall_score).reduce((s,i)=>s+ +i.overall_score,0) / this.data.filter(i=>i.overall_score).length) : 0;

    document.getElementById('insp-summary').innerHTML=[
      {icon:'📋',label:'Total Inspeksi',value:total,color:'var(--t1)',sub:'Semua properti',bg:'rgba(59,130,246,.06)'},
      {icon:'⏳',label:'Menunggu Review',value:submitted,color:'var(--warning)',sub:'Perlu ditinjau',bg:'rgba(245,158,11,.06)'},
      {icon:'✅',label:'Selesai',value:closed,color:'var(--success)',sub:'Inspeksi closed',bg:'rgba(34,197,94,.06)'},
      {icon:'⭐',label:'Rata-rata Skor',value:avgScore+'%',color:avgScore>=80?'var(--success)':avgScore>=60?'var(--warning)':'var(--danger)',sub:'Semua inspeksi',bg:'rgba(59,130,246,.06)'},
    ].map(c=>`<div class="summary-card"><div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div><div>
      <p class="summary-label">${c.label}</p><p class="summary-value" style="color:${c.color}">${c.value}</p>
      <p class="summary-sub">${c.sub}</p></div></div>`).join('');
  },

  filterProp: '', filterStatus: '',

  applyFilter() {
    this.filterProp = document.getElementById('insp-filter-prop')?.value||'';
    this.filterStatus = document.getElementById('insp-filter-status')?.value||'';
    this.renderTable();
  },

  renderTable() {
    const filtered = this.data.filter(i=>{
      if(this.filterProp && i.property_id!==this.filterProp) return false;
      if(this.filterStatus && i.status!==this.filterStatus) return false;
      return true;
    });
    const wrap = document.getElementById('insp-table-wrap');
    if(!wrap) return;
    if(!filtered.length){ wrap.innerHTML='<div class="empty-state"><p class="empty-icon">📋</p><p>Belum ada inspeksi.<br>Klik "+ Mulai Inspeksi" untuk memulai.</p></div>'; return; }

    const statusClass = {Draft:'badge-neutral','Submitted':'badge-warning','Reviewed':'badge-info','Closed':'badge-success'};
    const scoreColor = s => !s?'var(--t3)':s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';

    wrap.innerHTML=`<div class="table-responsive"><table class="data-table">
      <thead><tr><th>Tanggal</th><th>Properti</th><th>Kota</th><th>Inspektor</th><th class="text-center">Skor</th><th>Status</th><th>Catatan</th><th>Aksi</th></tr></thead>
      <tbody>${filtered.map(i=>`
        <tr>
          <td class="nowrap">${App.formatDate(i.inspection_date)}</td>
          <td class="fw-600">${i.properties?.name||'-'}</td>
          <td>${i.properties?.city||'-'}</td>
          <td>${i.inspector_name}</td>
          <td class="text-center">
            ${i.overall_score
              ? `<span class="fw-700" style="color:${scoreColor(i.overall_score)}">${i.overall_score}%</span>`
              : '<span class="text-muted">–</span>'}
          </td>
          <td><span class="badge ${statusClass[i.status]||'badge-neutral'}">${i.status}</span></td>
          <td class="text-muted">${i.notes||'-'}</td>
          <td><div class="action-btns">
            <button class="btn-icon" onclick="InspectionModule.viewDetail('${i.id}')" title="Detail">👁</button>
            <button class="btn-icon" onclick="InspectionModule.updateStatus('${i.id}','${i.status}')" title="Update Status">🔄</button>
            <button class="btn-icon btn-icon-danger" onclick="InspectionModule.deleteInspection('${i.id}')" title="Hapus">🗑</button>
          </div></td>
        </tr>`).join('')}
      </tbody></table></div>`;
  },

  showNewForm() {
    // Step 1: Pilih properti & info dasar
    App.openModal('Mulai Inspeksi Baru', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Properti *</label>
          <select id="ni-prop" class="form-control">
            <option value="">-- Pilih Properti --</option>
            ${this.properties.map(p=>`<option value="${p.id}">${p.code} - ${p.name} (${p.city})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal Inspeksi *</label>
          <input type="date" id="ni-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Inspektor *</label>
          <input type="text" id="ni-inspector" class="form-control" placeholder="Nama inspektor" value="${App.currentUser?.email?.split('@')[0]||''}">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Catatan Umum</label>
          <textarea id="ni-notes" class="form-control" rows="2" placeholder="Catatan kondisi umum properti..."></textarea>
        </div>
      </div>
      <p style="color:var(--t3);font-size:12px;margin-top:8px">* Setelah klik Simpan, form checklist akan terbuka</p>
    `, async () => {
      const prop_id = document.getElementById('ni-prop').value;
      const date = document.getElementById('ni-date').value;
      const inspector = document.getElementById('ni-inspector').value.trim();
      const notes = document.getElementById('ni-notes').value;
      if(!prop_id||!date||!inspector){ App.showToast('Properti, tanggal, dan inspektor wajib diisi!','error'); return; }

      const { data, error } = await window.QSEDb.db.from('inspections').insert([{
        property_id: prop_id,
        inspection_date: date,
        inspector_name: inspector,
        notes: notes,
        status: 'Draft'
      }]).select();

      if(error){ App.showToast('Gagal membuat inspeksi: '+error.message,'error'); return; }
      App.showToast('Inspeksi dibuat! Isi checklist sekarang.','success');
      await this.loadData();
      setTimeout(() => this.showChecklist(data[0].id), 500);
    });
  },

  async showChecklist(inspectionId) {
    const insp = this.data.find(i=>i.id===inspectionId);

    // Load existing checklist items
    const { data: existing } = await window.QSEDb.db
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', inspectionId);

    const existingMap = {};
    (existing||[]).forEach(e => { existingMap[e.item] = e; });

    let html = '<div style="max-height:500px;overflow-y:auto">';
    this.CHECKLIST_TEMPLATE.forEach(cat => {
      html += `<div class="checklist-category">
        <h4 class="checklist-cat-title">📌 ${cat.category}</h4>
        <div class="checklist-items">`;
      cat.items.forEach(item => {
        const ex = existingMap[item];
        html += `<div class="checklist-row">
          <span class="checklist-item-name">${item}</span>
          <div class="checklist-options">
            <label class="checklist-radio comply">
              <input type="radio" name="item_${item.replace(/\s/g,'_')}" value="Comply" ${ex?.status==='Comply'?'checked':''}>
              <span>✅ Comply</span>
            </label>
            <label class="checklist-radio non-comply">
              <input type="radio" name="item_${item.replace(/\s/g,'_')}" value="Non-Comply" ${ex?.status==='Non-Comply'?'checked':''}>
              <span>❌ Non-Comply</span>
            </label>
            <label class="checklist-radio na">
              <input type="radio" name="item_${item.replace(/\s/g,'_')}" value="N/A" ${ex?.status==='N/A'?'checked':''}>
              <span>N/A</span>
            </label>
          </div>
        </div>`;
      });
      html += '</div></div>';
    });
    html += '</div>';

    App.openModal(`📋 Checklist Inspeksi`, html, async () => {
      const items = [];
      let comply=0, nonComply=0, na=0;

      this.CHECKLIST_TEMPLATE.forEach(cat => {
        cat.items.forEach(item => {
          const key = `item_${item.replace(/\s/g,'_')}`;
          const val = document.querySelector(`input[name="${key}"]:checked`)?.value;
          if(val) {
            items.push({ inspection_id: inspectionId, category: cat.category, item, status: val, notes: '' });
            if(val==='Comply') comply++;
            else if(val==='Non-Comply') nonComply++;
            else na++;
          }
        });
      });

      const total = comply + nonComply;
      const score = total > 0 ? Math.round((comply/total)*100) : 0;

      // Upsert checklist items
      if(items.length > 0) {
        await window.QSEDb.db.from('inspection_items').delete().eq('inspection_id', inspectionId);
        await window.QSEDb.db.from('inspection_items').insert(items);
      }

      // Update skor & status
      await window.QSEDb.db.from('inspections').update({
        overall_score: score,
        status: 'Submitted'
      }).eq('id', inspectionId);

      App.showToast(`Inspeksi tersimpan! Skor: ${score}% (${comply} Comply, ${nonComply} Non-Comply)`, 'success');
      await this.loadData();
    });
  },

  async viewDetail(id) {
    const { data: items } = await window.QSEDb.db
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', id)
      .order('category');

    const insp = this.data.find(i=>i.id===id);
    const byCategory = {};
    (items||[]).forEach(i => {
      if(!byCategory[i.category]) byCategory[i.category]=[];
      byCategory[i.category].push(i);
    });

    const scoreColor = s => s>=80?'var(--success)':s>=60?'var(--warning)':'var(--danger)';
    let html = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div class="summary-card" style="flex:1;min-width:120px">
          <div class="summary-icon-wrap" style="background:rgba(59,130,246,.06)">⭐</div>
          <div><p class="summary-label">Skor</p>
          <p class="summary-value" style="color:${scoreColor(insp?.overall_score||0)}">${insp?.overall_score||0}%</p></div>
        </div>
        <div class="summary-card" style="flex:1;min-width:120px">
          <div class="summary-icon-wrap" style="background:rgba(34,197,94,.06)">✅</div>
          <div><p class="summary-label">Comply</p>
          <p class="summary-value" style="color:var(--success)">${(items||[]).filter(i=>i.status==='Comply').length}</p></div>
        </div>
        <div class="summary-card" style="flex:1;min-width:120px">
          <div class="summary-icon-wrap" style="background:rgba(239,68,68,.06)">❌</div>
          <div><p class="summary-label">Non-Comply</p>
          <p class="summary-value" style="color:var(--danger)">${(items||[]).filter(i=>i.status==='Non-Comply').length}</p></div>
        </div>
      </div>
      <div style="max-height:400px;overflow-y:auto">`;

    Object.entries(byCategory).forEach(([cat, catItems]) => {
      html += `<div class="checklist-category">
        <h4 class="checklist-cat-title">📌 ${cat}</h4>
        <div class="checklist-items">
          ${catItems.map(i=>`
            <div class="checklist-row">
              <span class="checklist-item-name">${i.item}</span>
              <span class="badge ${i.status==='Comply'?'badge-success':i.status==='Non-Comply'?'badge-danger':'badge-neutral'}">${i.status}</span>
            </div>`).join('')}
        </div>
      </div>`;
    });

    html += '</div>';
    App.openModal(`Detail Inspeksi — ${insp?.properties?.name||''}`, html);
  },

  async updateStatus(id, currentStatus) {
    const statusFlow = { Draft:'Submitted', Submitted:'Reviewed', Reviewed:'Closed', Closed:'Closed' };
    const nextStatus = statusFlow[currentStatus];
    if(currentStatus==='Closed'){ App.showToast('Inspeksi sudah closed.','info'); return; }
    App.showConfirm(`Update status dari "${currentStatus}" → "${nextStatus}"?`, async()=>{
      const { error } = await window.QSEDb.db.from('inspections').update({ status: nextStatus }).eq('id', id);
      if(error){ App.showToast('Gagal update status.','error'); return; }
      App.showToast(`Status → "${nextStatus}"`, 'success');
      await this.loadData();
    });
  },

  async deleteInspection(id) {
    App.showConfirm('Yakin hapus inspeksi ini? Semua checklist akan ikut terhapus.', async()=>{
      await window.QSEDb.db.from('inspection_items').delete().eq('inspection_id', id);
      const { error } = await window.QSEDb.db.from('inspections').delete().eq('id', id);
      if(error){ App.showToast('Gagal menghapus.','error'); return; }
      App.showToast('Inspeksi dihapus.','success');
      await this.loadData();
    });
  }
};
window.InspectionModule = InspectionModule;
