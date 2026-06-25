const LinenModule = {
  data: [], properties: [],

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">🛏️ Inventory Linen</h1><p class="page-subtitle">Kelola stok linen per properti</p></div>
        <div class="header-actions"><button class="btn btn-primary" onclick="LinenModule.showAddForm()">+ Tambah Item Linen</button></div>
      </div>
      <div class="summary-grid" id="linen-summary"></div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Item Linen</h3>
          <div class="filter-row">
            <select class="select-sm" id="linen-filter-property" onchange="LinenModule.applyFilter()" style="min-width:220px">
              <option value="">Semua Properti</option>
            </select>
            <select class="select-sm" id="linen-filter-cat" onchange="LinenModule.applyFilter()">
              <option value="">Semua Kategori</option>
              <option>Bed Linen</option><option>Bath Linen</option><option>F&B Linen</option>
            </select>
          </div>
        </div>
        <div id="linen-table-wrap"></div>
      </div>`;
    await this.loadProperties();
    await this.loadData();
  },

  async loadProperties() {
    const { data } = await window.QSEDb.db.from('properties').select('id,name,code').order('name');
    this.properties = data||[];
    const sel = document.getElementById('linen-filter-property');
    if(sel) this.properties.forEach(p=>{
      const opt=document.createElement('option');
      opt.value=p.id; opt.textContent=`${p.code} - ${p.name}`;
      sel.appendChild(opt);
    });
  },

  async loadData() {
    const {data,error}=await window.QSEDb.LinenDB.getAll();
    if(error){App.showToast('Gagal memuat: '+error.message,'error');return;}
    this.data=data||[];
    this.renderSummary(); this.renderTable();
  },

  filterProperty: '',

  applyFilter() {
    this.filterProperty=document.getElementById('linen-filter-property')?.value||'';
    this.renderSummary(); this.renderTable();
  },

  getFiltered() {
    const cat=document.getElementById('linen-filter-cat')?.value||'';
    return this.data.filter(l=>{
      if(this.filterProperty && l.property_id!==this.filterProperty) return false;
      if(cat && l.category!==cat) return false;
      return true;
    });
  },

  renderSummary() {
    const filtered=this.getFiltered();
    const total=filtered.reduce((s,l)=>s+l.total_stock,0);
    const inUse=filtered.reduce((s,l)=>s+l.in_use,0);
    const damaged=filtered.reduce((s,l)=>s+l.damaged,0);
    const belowPAR=filtered.filter(l=>l.total_stock<l.par_level).length;
    const propName=this.filterProperty
      ?this.properties.find(p=>p.id===this.filterProperty)?.name||'Properti'
      :'Semua Properti';

    document.getElementById('linen-summary').innerHTML=[
      {icon:'🏨',label:'Filter',value:propName,color:'var(--info)',sub:`${filtered.length} jenis linen`,bg:'rgba(59,130,246,.06)'},
      {icon:'📦',label:'Total Stok',value:total.toLocaleString()+' pcs',color:'var(--t1)',sub:`${filtered.length} jenis`,bg:'rgba(59,130,246,.06)'},
      {icon:'🚨',label:'Di Bawah PAR',value:belowPAR+' item',color:belowPAR>0?'var(--warning)':'var(--success)',sub:belowPAR>0?'Perlu restock':'PAR aman',bg:belowPAR>0?'rgba(245,158,11,.06)':'rgba(34,197,94,.06)'},
      {icon:'🔴',label:'Rusak/Afkir',value:damaged+' pcs',color:damaged>0?'var(--danger)':'var(--t3)',sub:`${total?Math.round(damaged/total*100):0}% dari total`,bg:'rgba(239,68,68,.06)'},
    ].map(c=>`<div class="summary-card"><div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div><div>
      <p class="summary-label">${c.label}</p>
      <p class="summary-value" style="color:${c.color};font-size:${c.label==='Filter'?'0.85rem':'1.2rem'}">${c.value}</p>
      <p class="summary-sub">${c.sub}</p></div></div>`).join('');
  },

  renderTable() {
    const filtered=this.getFiltered();
    const wrap=document.getElementById('linen-table-wrap');
    if(!wrap) return;
    if(!filtered.length){wrap.innerHTML='<div class="empty-state"><p class="empty-icon">🛏️</p><p>Belum ada item linen untuk properti ini.</p></div>';return;}
    const condClass={Good:'badge-success',Fair:'badge-warning',Poor:'badge-danger'};
    wrap.innerHTML=`<div class="table-responsive"><table class="data-table">
      <thead><tr><th>Properti</th><th>Item</th><th>Kategori</th><th class="text-center">Total</th><th class="text-center">Pakai</th><th class="text-center">Laundry</th><th class="text-center">Gudang</th><th class="text-center">Rusak</th><th>PAR Level</th><th>Kondisi</th><th>Aksi</th></tr></thead>
      <tbody>${filtered.map(l=>{
        const prop=this.properties.find(p=>p.id===l.property_id);
        const parPct=l.par_level>0?Math.min(l.total_stock/l.par_level*100,100):100;
        const parColor=parPct>=100?'var(--success)':parPct>=70?'var(--warning)':'var(--danger)';
        return `<tr>
          <td><span class="badge badge-neutral" style="font-size:11px">${prop?prop.code:'–'}</span></td>
          <td class="fw-600">${l.name}</td>
          <td><span class="badge badge-info">${l.category}</span></td>
          <td class="text-center fw-700">${l.total_stock}</td>
          <td class="text-center">${l.in_use}</td>
          <td class="text-center">${l.in_laundry}</td>
          <td class="text-center">${l.in_storage}</td>
          <td class="text-center ${l.damaged>0?'text-danger':''}">${l.damaged}</td>
          <td><div class="par-wrap">
            <div class="par-bar-bg"><div class="par-bar" style="width:${parPct}%;background:${parColor}"></div></div>
            <span class="par-label" style="color:${parColor}">${l.total_stock}/${l.par_level}</span>
          </div></td>
          <td><span class="badge ${condClass[l.condition]||'badge-neutral'}">${l.condition}</span></td>
          <td><div class="action-btns">
            <button class="btn-icon" onclick="LinenModule.showStockForm('${l.id}','${l.name}')" title="Update Stok">📋</button>
            <button class="btn-icon" onclick="LinenModule.showHistory('${l.id}','${l.name}')" title="History">🕐</button>
            <button class="btn-icon" onclick="LinenModule.showEditForm('${l.id}')" title="Edit">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="LinenModule.deleteItem('${l.id}')" title="Hapus">🗑</button>
          </div></td>
        </tr>`;}).join('')}
      </tbody></table></div>`;
  },

  showAddForm(existing=null) {
    const isEdit=!!existing; const l=existing||{};
    App.openModal(isEdit?'Edit Item Linen':'Tambah Item Linen',`
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Properti *</label>
          <select id="lf-prop" class="form-control">
            <option value="">-- Pilih Properti --</option>
            ${this.properties.map(p=>`<option value="${p.id}" ${l.property_id===p.id?'selected':''}>${p.code} - ${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-full"><label class="form-label">Nama Item *</label><input type="text" id="lf-name" class="form-control" value="${l.name||''}" placeholder="e.g. Bath Towel"></div>
        <div class="form-group"><label class="form-label">Kategori *</label>
          <select id="lf-cat" class="form-control">${['Bed Linen','Bath Linen','F&B Linen'].map(c=>`<option ${l.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">PAR Level *</label><input type="number" id="lf-par" class="form-control" value="${l.par_level||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Total Stok</label><input type="number" id="lf-total" class="form-control" value="${l.total_stock||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Sedang Dipakai</label><input type="number" id="lf-inuse" class="form-control" value="${l.in_use||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Di Laundry</label><input type="number" id="lf-laundry" class="form-control" value="${l.in_laundry||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Di Gudang</label><input type="number" id="lf-storage" class="form-control" value="${l.in_storage||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Rusak</label><input type="number" id="lf-damaged" class="form-control" value="${l.damaged||0}" min="0"></div>
        <div class="form-group"><label class="form-label">Kondisi</label>
          <select id="lf-condition" class="form-control">${['Good','Fair','Poor'].map(c=>`<option ${l.condition===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Tanggal Opname</label><input type="date" id="lf-opname" class="form-control" value="${l.last_opname||''}"></div>
      </div>`, async()=>{
      const record={
        property_id:document.getElementById('lf-prop').value||null,
        name:document.getElementById('lf-name').value.trim(),
        category:document.getElementById('lf-cat').value,
        par_level:parseInt(document.getElementById('lf-par').value)||0,
        total_stock:parseInt(document.getElementById('lf-total').value)||0,
        in_use:parseInt(document.getElementById('lf-inuse').value)||0,
        in_laundry:parseInt(document.getElementById('lf-laundry').value)||0,
        in_storage:parseInt(document.getElementById('lf-storage').value)||0,
        damaged:parseInt(document.getElementById('lf-damaged').value)||0,
        condition:document.getElementById('lf-condition').value,
        last_opname:document.getElementById('lf-opname').value||null,
      };
      if(!record.name){App.showToast('Nama item wajib diisi!','error');return;}
      const result=isEdit?await window.QSEDb.LinenDB.update(l.id,record):await window.QSEDb.LinenDB.insert(record);
      if(result.error){App.showToast('Gagal menyimpan: '+result.error.message,'error');return;}
      App.showToast(`Item linen berhasil ${isEdit?'diperbarui':'ditambahkan'}!`,'success');
      await this.loadData();
    });
  },

  showEditForm(id){const item=this.data.find(l=>l.id===id);if(item)this.showAddForm(item);},

  showStockForm(id,name){
    App.openModal(`Update Stok: ${name}`,`
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Aksi *</label>
          <select id="sf-action" class="form-control"><option value="stock_in">Stock In</option><option value="stock_out">Stock Out</option><option value="discard">Afkir</option><option value="opname">Opname</option></select></div>
        <div class="form-group"><label class="form-label">Jumlah *</label><input type="number" id="sf-qty" class="form-control" placeholder="0" min="1"></div>
        <div class="form-group form-full"><label class="form-label">Catatan</label><input type="text" id="sf-notes" class="form-control"></div>
      </div>`, async()=>{
      const action=document.getElementById('sf-action').value;
      const qty=parseInt(document.getElementById('sf-qty').value)||0;
      const notes=document.getElementById('sf-notes').value;
      if(qty<=0){App.showToast('Jumlah harus >0','error');return;}
      const item=this.data.find(l=>l.id===id);
      let newTotal=item.total_stock;
      if(action==='stock_in') newTotal+=qty;
      else if(action==='stock_out'||action==='discard') newTotal=Math.max(0,newTotal-qty);
      await window.QSEDb.LinenDB.addHistory({linen_item_id:id,action,quantity:qty,notes});
      const {error}=await window.QSEDb.LinenDB.update(id,{total_stock:newTotal});
      if(error){App.showToast('Gagal update stok.','error');return;}
      App.showToast('Stok diperbarui!','success'); await this.loadData();
    });
  },

  async showHistory(id,name){
    const {data}=await window.QSEDb.LinenDB.getHistory(id);
    const rows=data||[];
    App.openModal(`History: ${name}`,rows.length===0?'<p class="empty-text">Belum ada history.</p>':`
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Waktu</th><th>Aksi</th><th class="text-center">Jumlah</th><th>Catatan</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td class="nowrap">${App.formatDatetime(r.created_at)}</td><td><span class="badge badge-neutral">${r.action}</span></td><td class="text-center">${r.quantity}</td><td>${r.notes||'-'}</td></tr>`).join('')}</tbody>
      </table></div>`);
  },

  async deleteItem(id){
    App.showConfirm('Yakin hapus item linen ini?',async()=>{
      const {error}=await window.QSEDb.LinenDB.delete(id);
      if(error){App.showToast('Gagal menghapus.','error');return;}
      App.showToast('Item dihapus.','success'); await this.loadData();
    });
  }
};
window.LinenModule = LinenModule;
