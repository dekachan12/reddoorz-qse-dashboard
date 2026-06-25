const InventoryModule = {
  data: [], properties: [], filterProperty: '',

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">📦 Inventory Umum</h1><p class="page-subtitle">Kelola stok amenities dan supplies per properti</p></div>
        <div class="header-actions"><button class="btn btn-primary" onclick="InventoryModule.showAddForm()">+ Tambah Item</button></div>
      </div>
      <div class="summary-grid" id="inv-summary"></div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Inventory</h3>
          <div class="filter-row">
            <select class="select-sm" id="inv-filter-property" onchange="InventoryModule.applyFilter()" style="min-width:220px">
              <option value="">Semua Properti</option>
            </select>
            <select class="select-sm" id="inv-filter-cat" onchange="InventoryModule.applyFilter()">
              <option value="">Semua Kategori</option>
              ${['Amenities','Cleaning','Office','Equipment','F&B','Lainnya'].map(c=>`<option>${c}</option>`).join('')}
            </select>
            <select class="select-sm" id="inv-filter-status" onchange="InventoryModule.applyFilter()">
              <option value="">Semua Status</option>
              <option value="low">Stok Rendah</option>
              <option value="ok">Stok Aman</option>
            </select>
          </div>
        </div>
        <div id="inv-table-wrap"></div>
      </div>`;
    await this.loadProperties();
    await this.loadData();
  },

  async loadProperties() {
    const { data } = await window.QSEDb.db.from('properties').select('id,name,code').order('name');
    this.properties = data||[];
    const sel = document.getElementById('inv-filter-property');
    if(sel) this.properties.forEach(p=>{
      const opt=document.createElement('option');
      opt.value=p.id; opt.textContent=`${p.code} - ${p.name}`;
      sel.appendChild(opt);
    });
  },

  async loadData() {
    const {data,error}=await window.QSEDb.InventoryDB.getAll();
    if(error){App.showToast('Gagal memuat: '+error.message,'error');return;}
    this.data=data||[];
    this.renderSummary(); this.renderTable();
  },

  applyFilter() {
    this.filterProperty=document.getElementById('inv-filter-property')?.value||'';
    this.renderSummary(); this.renderTable();
  },

  getFiltered() {
    const cat=document.getElementById('inv-filter-cat')?.value||'';
    const status=document.getElementById('inv-filter-status')?.value||'';
    return this.data.filter(i=>{
      if(this.filterProperty && i.property_id!==this.filterProperty) return false;
      if(cat && i.category!==cat) return false;
      if(status==='low' && i.current_stock>i.min_stock) return false;
      if(status==='ok' && i.current_stock<=i.min_stock) return false;
      return true;
    });
  },

  renderSummary() {
    const filtered=this.getFiltered();
    const lowStock=filtered.filter(i=>i.current_stock<=i.min_stock);
    const totalValue=filtered.reduce((s,i)=>s+(i.current_stock*i.price),0);
    const propName=this.filterProperty
      ?this.properties.find(p=>p.id===this.filterProperty)?.name||'Properti'
      :'Semua Properti';

    document.getElementById('inv-summary').innerHTML=[
      {icon:'🏨',label:'Filter',value:propName,color:'var(--info)',sub:`${filtered.length} item`,bg:'rgba(59,130,246,.06)'},
      {icon:'⚠️',label:'Stok Rendah',value:lowStock.length+' item',color:lowStock.length>0?'var(--warning)':'var(--success)',sub:lowStock.length>0?'Perlu restock':'Semua aman',bg:lowStock.length>0?'rgba(245,158,11,.06)':'rgba(34,197,94,.06)'},
      {icon:'💰',label:'Nilai Inventory',value:App.formatRupiah(totalValue),color:'var(--warning)',sub:'Estimasi total aset',bg:'rgba(245,158,11,.06)'},
      {icon:'✅',label:'Stok Aman',value:(filtered.length-lowStock.length)+' item',color:'var(--success)',sub:`${filtered.length?Math.round(((filtered.length-lowStock.length)/filtered.length)*100):0}% dari total`,bg:'rgba(34,197,94,.06)'},
    ].map(c=>`<div class="summary-card"><div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div><div>
      <p class="summary-label">${c.label}</p>
      <p class="summary-value" style="color:${c.color};font-size:${c.label==='Filter'||c.label==='Nilai Inventory'?'0.85rem':'1.2rem'}">${c.value}</p>
      <p class="summary-sub">${c.sub}</p></div></div>`).join('');
  },

  renderTable() {
    const filtered=this.getFiltered();
    const wrap=document.getElementById('inv-table-wrap');
    if(!wrap) return;
    if(!filtered.length){wrap.innerHTML='<div class="empty-state"><p class="empty-icon">📦</p><p>Tidak ada item ditemukan.</p></div>';return;}
    const statusBadge=i=>i.current_stock===0?'badge-danger':i.current_stock<=i.min_stock?'badge-warning':'badge-success';
    const statusText=i=>i.current_stock===0?'Habis':i.current_stock<=i.min_stock?'Rendah':'Aman';
    wrap.innerHTML=`<div class="table-responsive"><table class="data-table">
      <thead><tr><th>Properti</th><th>Nama Item</th><th>Kategori</th><th>Satuan</th><th class="text-right">Stok</th><th class="text-right">Min</th><th class="text-right">Harga/Unit</th><th class="text-right">Nilai</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${filtered.map(i=>{
        const prop=this.properties.find(p=>p.id===i.property_id);
        const isLow=i.current_stock<=i.min_stock;
        return `<tr>
          <td><span class="badge badge-neutral" style="font-size:11px">${prop?prop.code:'–'}</span></td>
          <td class="fw-600">${i.name}</td>
          <td><span class="badge badge-neutral">${i.category}</span></td>
          <td>${i.unit}</td>
          <td class="text-right ${isLow?'text-danger fw-700':''}">${Number(i.current_stock).toLocaleString('id-ID')}</td>
          <td class="text-right text-muted">${Number(i.min_stock).toLocaleString('id-ID')}</td>
          <td class="text-right">${App.formatRupiah(i.price)}</td>
          <td class="text-right">${App.formatRupiah(i.current_stock*i.price)}</td>
          <td><span class="badge ${statusBadge(i)}">${statusText(i)}</span></td>
          <td><div class="action-btns">
            <button class="btn-icon" onclick="InventoryModule.showStockForm('${i.id}','${i.name}','in')" title="Stock In">📥</button>
            <button class="btn-icon" onclick="InventoryModule.showStockForm('${i.id}','${i.name}','out')" title="Stock Out">📤</button>
            <button class="btn-icon" onclick="InventoryModule.showHistory('${i.id}','${i.name}')" title="History">🕐</button>
            <button class="btn-icon" onclick="InventoryModule.showEditForm('${i.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="InventoryModule.deleteItem('${i.id}')" title="Hapus">🗑</button>
          </div></td>
        </tr>`;}).join('')}
      </tbody></table></div>`;
  },

  showAddForm(existing=null) {
    const isEdit=!!existing; const i=existing||{};
    App.openModal(isEdit?'Edit Item':'Tambah Item Inventory',`
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Properti *</label>
          <select id="if-prop" class="form-control">
            <option value="">-- Pilih Properti --</option>
            ${this.properties.map(p=>`<option value="${p.id}" ${i.property_id===p.id?'selected':''}>${p.code} - ${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-full"><label class="form-label">Nama Item *</label><input type="text" id="if-name" class="form-control" value="${i.name||''}" placeholder="e.g. Sabun Mandi Mini"></div>
        <div class="form-group"><label class="form-label">Kategori *</label>
          <select id="if-cat" class="form-control">${['Amenities','Cleaning','Office','Equipment','F&B','Lainnya'].map(c=>`<option ${i.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Satuan *</label><input type="text" id="if-unit" class="form-control" value="${i.unit||'pcs'}" placeholder="pcs/box/liter"></div>
        <div class="form-group"><label class="form-label">Stok Saat Ini</label><input type="number" id="if-stock" class="form-control" value="${i.current_stock||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Stok Minimum</label><input type="number" id="if-min" class="form-control" value="${i.min_stock||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Harga per Unit (Rp)</label><input type="number" id="if-price" class="form-control" value="${i.price||0}" min="0"></div>
      </div>`, async()=>{
      const record={
        property_id:document.getElementById('if-prop').value||null,
        name:document.getElementById('if-name').value.trim(),
        category:document.getElementById('if-cat').value,
        unit:document.getElementById('if-unit').value.trim()||'pcs',
        current_stock:parseFloat(document.getElementById('if-stock').value)||0,
        min_stock:parseFloat(document.getElementById('if-min').value)||0,
        price:parseFloat(document.getElementById('if-price').value)||0,
      };
      if(!record.name){App.showToast('Nama item wajib diisi!','error');return;}
      const result=isEdit?await window.QSEDb.InventoryDB.update(i.id,record):await window.QSEDb.InventoryDB.insert(record);
      if(result.error){App.showToast('Gagal menyimpan: '+result.error.message,'error');return;}
      App.showToast(`Item berhasil ${isEdit?'diperbarui':'ditambahkan'}!`,'success');
      await this.loadData();
    });
  },

  showEditForm(id){const item=this.data.find(i=>i.id===id);if(item)this.showAddForm(item);},

  showStockForm(id,name,defaultAction='in'){
    App.openModal(`Update Stok: ${name}`,`
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Aksi *</label>
          <select id="sf-action" class="form-control">
            <option value="stock_in" ${defaultAction==='in'?'selected':''}>Stock In (tambah)</option>
            <option value="stock_out" ${defaultAction==='out'?'selected':''}>Stock Out (kurangi)</option>
          </select></div>
        <div class="form-group"><label class="form-label">Jumlah *</label><input type="number" id="sf-qty" class="form-control" placeholder="0" min="0.1" step="0.1"></div>
        <div class="form-group form-full"><label class="form-label">Catatan</label><input type="text" id="sf-notes" class="form-control"></div>
      </div>`, async()=>{
      const action=document.getElementById('sf-action').value;
      const qty=parseFloat(document.getElementById('sf-qty').value)||0;
      const notes=document.getElementById('sf-notes').value;
      if(qty<=0){App.showToast('Jumlah harus >0','error');return;}
      const item=this.data.find(i=>i.id===id);
      const newStock=action==='stock_in'?item.current_stock+qty:Math.max(0,item.current_stock-qty);
      await window.QSEDb.InventoryDB.addHistory({inventory_item_id:id,action,quantity:qty,notes});
      const {error}=await window.QSEDb.InventoryDB.update(id,{current_stock:newStock});
      if(error){App.showToast('Gagal update stok.','error');return;}
      App.showToast('Stok diperbarui!','success'); await this.loadData();
    });
  },

  async showHistory(id,name){
    const {data}=await window.QSEDb.InventoryDB.getHistory(id);
    const rows=data||[];
    App.openModal(`History: ${name}`,rows.length===0?'<p class="empty-text">Belum ada history.</p>':`
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Waktu</th><th>Aksi</th><th class="text-center">Jumlah</th><th>Catatan</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td class="nowrap">${App.formatDatetime(r.created_at)}</td>
          <td><span class="badge ${r.action==='stock_in'?'badge-success':'badge-danger'}">${r.action==='stock_in'?'Stock In':'Stock Out'}</span></td>
          <td class="text-center">${r.quantity}</td><td>${r.notes||'-'}</td></tr>`).join('')}
        </tbody></table></div>`);
  },

  async deleteItem(id){
    App.showConfirm('Yakin hapus item ini?',async()=>{
      const {error}=await window.QSEDb.InventoryDB.delete(id);
      if(error){App.showToast('Gagal menghapus.','error');return;}
      App.showToast('Item dihapus.','success'); await this.loadData();
    });
  }
};
window.InventoryModule = InventoryModule;
