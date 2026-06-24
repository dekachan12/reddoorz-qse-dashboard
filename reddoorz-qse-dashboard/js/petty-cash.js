const PettyCashModule = {
  data: [],
  filterCategory: '', filterType: '', filterMonth: '',

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">💰 Petty Cash</h1>
          <p class="page-subtitle">Kelola pengeluaran dan replenishment kas kecil</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="PettyCashModule.exportCSV()">⬇ Export CSV</button>
          <button class="btn btn-primary" onclick="PettyCashModule.showAddForm()">+ Tambah Transaksi</button>
        </div>
      </div>
      <div class="summary-grid" id="pc-summary-cards"></div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Riwayat Transaksi</h3>
          <div class="filter-row">
            <select class="select-sm" id="filter-type" onchange="PettyCashModule.applyFilter()">
              <option value="">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="replenishment">Replenishment</option>
            </select>
            <select class="select-sm" id="filter-category" onchange="PettyCashModule.applyFilter()">
              <option value="">Semua Kategori</option>
              ${['Perbaikan','Supplies','Transportasi','F&B','Laundry','Lainnya'].map(c=>`<option>${c}</option>`).join('')}
            </select>
            <input type="month" class="input-sm" id="filter-month" onchange="PettyCashModule.applyFilter()">
          </div>
        </div>
        <div id="pc-table-wrap"></div>
      </div>`;
    await this.loadData();
  },

  async loadData() {
    const { data, error } = await window.QSEDb.PettyCashDB.getAll();
    if (error) { App.showToast('Gagal memuat data: '+error.message,'error'); return; }
    this.data = data||[];
    this.renderSummary(); this.renderTable();
  },

  renderSummary() {
    let totalIn=0, totalOut=0; const byCategory={};
    this.data.forEach(t=>{
      if(t.type==='replenishment') totalIn+=+t.amount;
      else { totalOut+=+t.amount; byCategory[t.category]=(byCategory[t.category]||0)+ +t.amount; }
    });
    const saldo = totalIn - totalOut;
    const topCat = Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0];

    document.getElementById('pc-summary-cards').innerHTML = [
      { icon:'💵', label:'Total Masuk', value: App.formatRupiah(totalIn), color:'var(--success)', sub:'Total replenishment', bg:'rgba(34,197,94,.06)' },
      { icon:'📤', label:'Total Keluar', value: App.formatRupiah(totalOut), color:'var(--danger)', sub:`${this.data.filter(t=>t.type==='expense').length} transaksi`, bg:'rgba(239,68,68,.06)' },
      { icon:'🏦', label:'Saldo Saat Ini', value: App.formatRupiah(saldo), color: saldo>=0?'var(--success)':'var(--danger)', sub: saldo>=0?'Saldo aman':'Saldo minus!', bg: saldo>=0?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)' },
      { icon:'📊', label:'Kategori Terbesar', value: topCat?topCat[0]:'-', color:'var(--warning)', sub: topCat?App.formatRupiah(topCat[1]):'Belum ada data', bg:'rgba(245,158,11,.06)' },
    ].map(c=>`
      <div class="summary-card">
        <div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div>
        <div>
          <p class="summary-label">${c.label}</p>
          <p class="summary-value" style="color:${c.color};font-size:${c.label==='Kategori Terbesar'?'1rem':'1.2rem'}">${c.value}</p>
          <p class="summary-sub">${c.sub}</p>
        </div>
      </div>`).join('');
  },

  applyFilter() {
    this.filterType = document.getElementById('filter-type')?.value||'';
    this.filterCategory = document.getElementById('filter-category')?.value||'';
    this.filterMonth = document.getElementById('filter-month')?.value||'';
    this.renderTable();
  },

  getFiltered() {
    return this.data.filter(t=>{
      if(this.filterType && t.type!==this.filterType) return false;
      if(this.filterCategory && t.category!==this.filterCategory) return false;
      if(this.filterMonth && !t.date?.startsWith(this.filterMonth)) return false;
      return true;
    });
  },

  renderTable() {
    const filtered = this.getFiltered();
    const wrap = document.getElementById('pc-table-wrap');
    if(!wrap) return;
    if(!filtered.length) {
      wrap.innerHTML='<div class="empty-state"><p class="empty-icon">📭</p><p>Tidak ada transaksi ditemukan.</p></div>'; return;
    }
    wrap.innerHTML=`
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr>
            <th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Tipe</th>
            <th class="text-right">Jumlah</th><th>Catatan</th><th>Aksi</th>
          </tr></thead>
          <tbody>${filtered.map(t=>`
            <tr>
              <td class="nowrap">${App.formatDate(t.date)}</td>
              <td class="fw-600">${t.description}</td>
              <td><span class="badge badge-neutral">${t.category}</span></td>
              <td><span class="badge ${t.type==='replenishment'?'badge-success':'badge-danger'}">${t.type==='replenishment'?'↑ Masuk':'↓ Keluar'}</span></td>
              <td class="text-right nowrap ${t.type==='replenishment'?'text-success':'text-danger'} fw-600">
                ${t.type==='replenishment'?'+':'-'}${App.formatRupiah(t.amount)}</td>
              <td class="text-muted">${t.notes||'-'}</td>
              <td><button class="btn-icon btn-icon-danger" onclick="PettyCashModule.deleteTransaction('${t.id}')">🗑</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  showAddForm() {
    App.openModal('Tambah Transaksi',`
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Tipe *</label>
          <select id="f-type" class="form-control"><option value="expense">Pengeluaran</option><option value="replenishment">Replenishment</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal *</label>
          <input type="date" id="f-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Deskripsi *</label>
          <input type="text" id="f-desc" class="form-control" placeholder="Contoh: Pembelian sabun mandi">
        </div>
        <div class="form-group">
          <label class="form-label">Kategori *</label>
          <select id="f-cat" class="form-control">${['Perbaikan','Supplies','Transportasi','F&B','Laundry','Lainnya'].map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah (Rp) *</label>
          <input type="number" id="f-amount" class="form-control" placeholder="0" min="0">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Catatan</label>
          <textarea id="f-notes" class="form-control" rows="2" placeholder="Catatan tambahan (opsional)"></textarea>
        </div>
      </div>`, async()=>{
      const record = {
        type: document.getElementById('f-type').value,
        date: document.getElementById('f-date').value,
        description: document.getElementById('f-desc').value,
        category: document.getElementById('f-cat').value,
        amount: parseFloat(document.getElementById('f-amount').value)||0,
        notes: document.getElementById('f-notes').value,
      };
      if(!record.description||!record.date||record.amount<=0){App.showToast('Harap lengkapi semua field wajib.','error');return;}
      const {error}=await window.QSEDb.PettyCashDB.insert(record);
      if(error){App.showToast('Gagal menyimpan: '+error.message,'error');return;}
      App.showToast('Transaksi berhasil ditambahkan!','success');
      await this.loadData();
    });
  },

  async deleteTransaction(id) {
    App.showConfirm('Yakin ingin menghapus transaksi ini?', async()=>{
      const {error}=await window.QSEDb.PettyCashDB.delete(id);
      if(error){App.showToast('Gagal menghapus.','error');return;}
      App.showToast('Transaksi dihapus.','success');
      await this.loadData();
    });
  },

  exportCSV() {
    const filtered = this.getFiltered();
    const rows=[['Tanggal','Deskripsi','Kategori','Tipe','Jumlah','Catatan']];
    filtered.forEach(t=>rows.push([t.date,t.description,t.category,t.type,t.amount,t.notes||'']));
    const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    a.download=`petty-cash-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    App.showToast('CSV berhasil diexport!','success');
  }
};
window.PettyCashModule = PettyCashModule;
