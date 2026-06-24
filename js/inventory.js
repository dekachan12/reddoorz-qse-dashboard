// =====================================================
// inventory.js - General Inventory Module
// =====================================================

const InventoryModule = {
  data: [],

  properties: [],

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">📦 Inventory Umum</h1>
          <p class="page-subtitle">Kelola stok amenities, cleaning supplies, dan perlengkapan operasional</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="InventoryModule.showAddForm()">+ Tambah Item</button>
        </div>
      </div>

      <div class="summary-grid" id="inv-summary"></div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Inventory</h3>
          <div class="filter-row">
            <select class="select-sm" id="inv-filter-cat" onchange="InventoryModule.renderTable()">
              <option value="">Semua Kategori</option>
              ${['Amenities','Cleaning','Office','Equipment','F&B','Lainnya'].map(c=>`<option value="${c}">${c}</option>`).join('')}
            </select>
            <select class="select-sm" id="inv-filter-status" onchange="InventoryModule.renderTable()">
              <option value="">Semua Status</option>
              <option value="low">Stok Rendah</option>
              <option value="ok">Stok Aman</option>
            </select>
          </div>
        </div>
        <div id="inv-table-wrap"></div>
      </div>
    `;
    await this.loadData();
  },

  async loadData() {
    const { data, error } = await window.QSEDb.InventoryDB.getAll();
    if (error) { App.showToast('Gagal memuat data: ' + error.message, 'error'); return; }
    this.data = data || [];
    this.renderSummary();
    this.renderTable();
  },

  renderSummary() {
    const totalItems = this.data.length;
    const lowStock = this.data.filter(i => i.current_stock <= i.min_stock);
    const totalValue = this.data.reduce((s, i) => s + (i.current_stock * i.price), 0);
    const outOfStock = this.data.filter(i => i.current_stock === 0).length;

    document.getElementById('inv-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-icon-wrap">📦</div>
        <div>
          <p class="summary-label">Total Item</p>
          <p class="summary-value">${totalItems} item</p>
          <p class="summary-sub">Semua kategori</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">⚠️</div>
        <div>
          <p class="summary-label">Stok Rendah</p>
          <p class="summary-value" style="color:${lowStock.length>0?'var(--warning)':'var(--success)'}">${lowStock.length} item</p>
          <p class="summary-sub">${outOfStock > 0 ? `${outOfStock} item habis!` : 'Tidak ada yang habis'}</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">💰</div>
        <div>
          <p class="summary-label">Nilai Inventory</p>
          <p class="summary-value" style="font-size:1rem">${App.formatRupiah(totalValue)}</p>
          <p class="summary-sub">Estimasi total aset</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon-wrap">✅</div>
        <div>
          <p class="summary-label">Stok Aman</p>
          <p class="summary-value" style="color:var(--success)">${totalItems - lowStock.length} item</p>
          <p class="summary-sub">${totalItems ? Math.round(((totalItems-lowStock.length)/totalItems)*100) : 0}% dari total</p>
        </div>
      </div>
    `;
  },

  renderTable() {
    const cat = document.getElementById('inv-filter-cat')?.value || '';
    const status = document.getElementById('inv-filter-status')?.value || '';
    let filtered = this.data;
    if (cat) filtered = filtered.filter(i => i.category === cat);
    if (status === 'low') filtered = filtered.filter(i => i.current_stock <= i.min_stock);
    if (status === 'ok') filtered = filtered.filter(i => i.current_stock > i.min_stock);

    const wrap = document.getElementById('inv-table-wrap');
    if (!wrap) return;

    if (filtered.length === 0) {
      wrap.innerHTML = '<div class="empty-state"><p class="empty-icon">📦</p><p>Tidak ada item ditemukan.</p></div>';
      return;
    }

    wrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Item</th>
              <th>Kategori</th>
              <th>Satuan</th>
              <th class="text-right">Stok Saat Ini</th>
              <th class="text-right">Stok Min</th>
              <th class="text-right">Harga/Unit</th>
              <th class="text-right">Nilai</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(i => {
              const isLow = i.current_stock <= i.min_stock;
              const isEmpty = i.current_stock === 0;
              const statusBadge = isEmpty ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success';
              const statusText = isEmpty ? 'Habis' : isLow ? 'Rendah' : 'Aman';
              return `
                <tr>
                  <td class="font-medium">${i.name}</td>
                  <td><span class="badge badge-neutral">${i.category}</span></td>
                  <td>${i.unit}</td>
                  <td class="text-right ${isLow?'text-danger font-bold':''}">${Number(i.current_stock).toLocaleString('id-ID')}</td>
                  <td class="text-right text-muted">${Number(i.min_stock).toLocaleString('id-ID')}</td>
                  <td class="text-right">${App.formatRupiah(i.price)}</td>
                  <td class="text-right">${App.formatRupiah(i.current_stock * i.price)}</td>
                  <td><span class="badge ${statusBadge}">${statusText}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon" onclick="InventoryModule.showStockForm('${i.id}','${i.name}','in')" title="Stock In">📥</button>
                      <button class="btn-icon" onclick="InventoryModule.showStockForm('${i.id}','${i.name}','out')" title="Stock Out">📤</button>
                      <button class="btn-icon" onclick="InventoryModule.showHistory('${i.id}','${i.name}')" title="History">🕐</button>
                      <button class="btn-icon" onclick="InventoryModule.showEditForm('${i.id}')" title="Edit">✏️</button>
                      <button class="btn-icon btn-icon-danger" onclick="InventoryModule.deleteItem('${i.id}')" title="Hapus">🗑</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  showAddForm(existing = null) {
    const isEdit = !!existing;
    const i = existing || {};
    App.openModal(isEdit ? 'Edit Item' : 'Tambah Item Inventory', `
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Nama Item *</label>
          <input type="text" id="if-name" class="form-control" placeholder="e.g. Sabun Mandi Mini" value="${i.name||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Kategori *</label>
          <select id="if-cat" class="form-control">
            ${['Amenities','Cleaning','Office','Equipment','F&B','Lainnya'].map(c=>`<option value="${c}" ${i.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Satuan *</label>
          <input type="text" id="if-unit" class="form-control" placeholder="pcs / box / liter / kg" value="${i.unit||'pcs'}">
        </div>
        <div class="form-group">
          <label class="form-label">Stok Saat Ini</label>
          <input type="number" id="if-stock" class="form-control" value="${i.current_stock||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Stok Minimum</label>
          <input type="number" id="if-min" class="form-control" value="${i.min_stock||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Harga per Unit (Rp)</label>
          <input type="number" id="if-price" class="form-control" value="${i.price||0}" min="0">
        </div>
      </div>
    `, async () => {
      const record = {
        name: document.getElementById('if-name').value.trim(),
        category: document.getElementById('if-cat').value,
        unit: document.getElementById('if-unit').value.trim() || 'pcs',
        current_stock: parseFloat(document.getElementById('if-stock').value) || 0,
        min_stock: parseFloat(document.getElementById('if-min').value) || 0,
        price: parseFloat(document.getElementById('if-price').value) || 0,
      };
      if (!record.name) { App.showToast('Nama item wajib diisi!', 'error'); return; }
      let result;
      if (isEdit) result = await window.QSEDb.InventoryDB.update(i.id, record);
      else result = await window.QSEDb.InventoryDB.insert(record);
      if (result.error) { App.showToast('Gagal menyimpan: ' + result.error.message, 'error'); return; }
      App.showToast(`Item berhasil ${isEdit?'diperbarui':'ditambahkan'}!`, 'success');
      await this.loadData();
    });
  },

  showEditForm(id) {
    const item = this.data.find(i => i.id === id);
    if (item) this.showAddForm(item);
  },

  showStockForm(id, name, defaultAction = 'in') {
    App.openModal(`Update Stok: ${name}`, `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Aksi *</label>
          <select id="sf-action" class="form-control">
            <option value="stock_in" ${defaultAction==='in'?'selected':''}>Stock In (tambah)</option>
            <option value="stock_out" ${defaultAction==='out'?'selected':''}>Stock Out (kurangi)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah *</label>
          <input type="number" id="sf-qty" class="form-control" placeholder="0" min="0.1" step="0.1">
        </div>
        <div class="form-group form-full">
          <label class="form-label">Catatan</label>
          <input type="text" id="sf-notes" class="form-control" placeholder="Catatan opsional">
        </div>
      </div>
    `, async () => {
      const action = document.getElementById('sf-action').value;
      const qty = parseFloat(document.getElementById('sf-qty').value) || 0;
      const notes = document.getElementById('sf-notes').value;
      if (qty <= 0) { App.showToast('Jumlah harus lebih dari 0.', 'error'); return; }

      const item = this.data.find(i => i.id === id);
      let newStock = item.current_stock;
      if (action === 'stock_in') newStock += qty;
      else newStock = Math.max(0, newStock - qty);

      await window.QSEDb.InventoryDB.addHistory({ inventory_item_id: id, action, quantity: qty, notes });
      const { error } = await window.QSEDb.InventoryDB.update(id, { current_stock: newStock });
      if (error) { App.showToast('Gagal update stok.', 'error'); return; }
      App.showToast('Stok berhasil diperbarui!', 'success');
      await this.loadData();
    });
  },

  async showHistory(id, name) {
    const { data } = await window.QSEDb.InventoryDB.getHistory(id);
    const rows = data || [];
    App.openModal(`History: ${name}`, `
      ${rows.length === 0 ? '<p class="empty-text">Belum ada history.</p>' : `
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Waktu</th><th>Aksi</th><th>Jumlah</th><th>Catatan</th></tr></thead>
          <tbody>${rows.map(r=>`
            <tr>
              <td class="nowrap">${App.formatDatetime(r.created_at)}</td>
              <td><span class="badge ${r.action==='stock_in'?'badge-success':'badge-danger'}">${r.action==='stock_in'?'Stock In':'Stock Out'}</span></td>
              <td class="text-center">${r.quantity}</td>
              <td>${r.notes||'-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    `);
  },

  async deleteItem(id) {
    App.showConfirm('Yakin ingin menghapus item ini? History akan ikut terhapus.', async () => {
      const { error } = await window.QSEDb.InventoryDB.delete(id);
      if (error) { App.showToast('Gagal menghapus.', 'error'); return; }
      App.showToast('Item dihapus.', 'success');
      await this.loadData();
    });
  }
};

window.InventoryModule = InventoryModule;
