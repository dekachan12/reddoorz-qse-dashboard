const ImprovementModule = {
  data: [], properties: [],
  filterStatus:'', filterPriority:'', filterCategory:'', filterProperty:'',

  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">📈 Improvement Tracking</h1><p class="page-subtitle">Monitor program perbaikan per properti</p></div>
        <div class="header-actions"><button class="btn btn-primary" onclick="ImprovementModule.showAddForm()">+ Tambah Item</button></div>
      </div>
      <div class="summary-grid" id="imp-summary"></div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Daftar Improvement</h3>
          <div class="filter-row">
            <select class="select-sm" id="imp-filter-property" onchange="ImprovementModule.applyFilter()" style="min-width:200px">
              <option value="">Semua Properti</option>
            </select>
            <select class="select-sm" id="imp-filter-status" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Status</option>
              ${['Open','In Progress','Completed','Verified'].map(s=>`<option>${s}</option>`).join('')}
            </select>
            <select class="select-sm" id="imp-filter-priority" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Prioritas</option>
              ${['Critical','High','Medium','Low'].map(p=>`<option>${p}</option>`).join('')}
            </select>
            <select class="select-sm" id="imp-filter-cat" onchange="ImprovementModule.applyFilter()">
              <option value="">Semua Kategori</option>
              ${['Quality','Safety','Environment','Guest Satisfaction','Operational'].map(c=>`<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="imp-cards-wrap"></div>
      </div>`;
    await this.loadProperties();
    await this.loadData();
  },

  async loadProperties() {
    const { data } = await window.QSEDb.db.from('properties').select('id,name,code').order('name');
    this.properties = data||[];
    const sel = document.getElementById('imp-filter-property');
    if(sel) this.properties.forEach(p=>{
      const opt=document.createElement('option');
      opt.value=p.id; opt.textContent=`${p.code} - ${p.name}`;
      sel.appendChild(opt);
    });
  },

  async loadData() {
    const {data,error}=await window.QSEDb.ImprovementDB.getAll();
    if(error){App.showToast('Gagal memuat data: '+error.message,'error');return;}
    this.data=data||[];
    this.renderSummary(); this.renderCards();
  },

  renderSummary() {
    const filtered=this.getFiltered();
    const total=filtered.length;
    const open=filtered.filter(i=>i.status==='Open').length;
    const inProgress=filtered.filter(i=>i.status==='In Progress').length;
    const done=filtered.filter(i=>i.status==='Completed'||i.status==='Verified').length;
    const critical=filtered.filter(i=>i.priority==='Critical'&&i.status!=='Verified').length;
    const propName=this.filterProperty
      ?this.properties.find(p=>p.id===this.filterProperty)?.name||'Properti'
      :'Semua Properti';

    document.getElementById('imp-summary').innerHTML=[
      {icon:'🏨',label:'Filter',value:propName,color:'var(--info)',sub:`${total} item`,bg:'rgba(59,130,246,.06)'},
      {icon:'🔄',label:'In Progress',value:inProgress,color:'var(--info)',sub:`${open} item Open`,bg:'rgba(59,130,246,.06)'},
      {icon:'✅',label:'Selesai',value:done,color:'var(--success)',sub:`${total?Math.round(done/total*100):0}% selesai`,bg:'rgba(34,197,94,.06)'},
      {icon:'🚨',label:'Critical Open',value:critical,color:critical>0?'var(--danger)':'var(--success)',sub:critical>0?'Segera ditangani!':'Aman',bg:critical>0?'rgba(239,68,68,.06)':'rgba(34,197,94,.06)'},
    ].map(c=>`<div class="summary-card"><div class="summary-icon-wrap" style="background:${c.bg}">${c.icon}</div><div>
      <p class="summary-label">${c.label}</p>
      <p class="summary-value" style="color:${c.color};font-size:${c.label==='Filter'?'0.85rem':'1.4rem'}">${c.value}</p>
      <p class="summary-sub">${c.sub}</p></div></div>`).join('');
  },

  applyFilter() {
    this.filterProperty=document.getElementById('imp-filter-property')?.value||'';
    this.filterStatus=document.getElementById('imp-filter-status')?.value||'';
    this.filterPriority=document.getElementById('imp-filter-priority')?.value||'';
    this.filterCategory=document.getElementById('imp-filter-cat')?.value||'';
    this.renderSummary(); this.renderCards();
  },

  getFiltered() {
    return this.data.filter(i=>{
      if(this.filterProperty && i.property_id!==this.filterProperty) return false;
      if(this.filterStatus && i.status!==this.filterStatus) return false;
      if(this.filterPriority && i.priority!==this.filterPriority) return false;
      if(this.filterCategory && i.category!==this.filterCategory) return false;
      return true;
    });
  },

  renderCards() {
    const filtered=this.getFiltered();
    const wrap=document.getElementById('imp-cards-wrap');
    if(!wrap) return;
    if(!filtered.length){wrap.innerHTML='<div class="empty-state"><p class="empty-icon">📈</p><p>Tidak ada item improvement.<br>Tambahkan item pertama!</p></div>';return;}

    const prioColor={Critical:'#EF4444',High:'#F59E0B',Medium:'#3B82F6',Low:'#22C55E'};
    const statusColor={'Open':'#64748B','In Progress':'#3B82F6',Completed:'#22C55E',Verified:'#E31837'};

    wrap.innerHTML=`<div class="improvement-grid">${filtered.map(i=>{
      const prop=this.properties.find(p=>p.id===i.property_id);
      return `<div class="imp-card">
        <div class="imp-card-header">
          <div class="imp-badges">
            <span class="badge" style="background:${prioColor[i.priority]}20;color:${prioColor[i.priority]}">${i.priority}</span>
            <span class="badge" style="background:${statusColor[i.status]}20;color:${statusColor[i.status]}">${i.status}</span>
            <span class="badge badge-neutral">${i.category}</span>
          </div>
          <div class="imp-actions">
            <button class="btn-icon" onclick="ImprovementModule.showEditForm('${i.id}')">✏️</button>
            <button class="btn-icon btn-icon-danger" onclick="ImprovementModule.deleteItem('${i.id}')">🗑</button>
          </div>
        </div>
        ${prop?`<div style="margin-bottom:4px"><span class="badge badge-info" style="font-size:11px">🏨 ${prop.code} — ${prop.name}</span></div>`:''}
        <h4 class="imp-title">${i.title}</h4>
        ${i.description?`<p class="imp-desc">${i.description}</p>`:''}
        <div class="progress-wrap">
          <div class="progress-header"><span>Progress</span><span class="progress-pct">${i.progress}%</span></div>
          <div class="progress-bar-bg"><div class="progress-bar" style="width:${i.progress}%;background:${i.progress>=100?'var(--success)':i.progress>=50?'var(--info)':'var(--warning)'}"></div></div>
        </div>
        <div class="imp-meta">
          ${i.department?`<span>🏢 ${i.department}</span>`:''}
          ${i.target_date?`<span>🎯 ${App.formatDate(i.target_date)}</span>`:''}
        </div>
        ${(i.before_condition||i.after_condition)?`<div class="imp-conditions">
          ${i.before_condition?`<div class="cond-box cond-before"><span class="cond-label">Sebelum</span><p>${i.before_condition}</p></div>`:''}
          ${i.after_condition?`<div class="cond-box cond-after"><span class="cond-label">Sesudah</span><p>${i.after_condition}</p></div>`:''}
        </div>`:''}
        <div class="imp-quick-actions">
          ${['Open','In Progress','Completed','Verified'].filter(s=>s!==i.status).map(s=>
            `<button class="btn-xs" onclick="ImprovementModule.updateStatus('${i.id}','${s}')" style="background:${statusColor[s]}20;color:${statusColor[s]};border:1px solid ${statusColor[s]}40">${s}</button>`
          ).join('')}
        </div>
      </div>`;}).join('')}</div>`;
  },

  showAddForm(existing=null) {
    const isEdit=!!existing; const item=existing||{};
    App.openModal(isEdit?'Edit Improvement':'Tambah Improvement',`
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Properti *</label>
          <select id="imf-prop" class="form-control">
            <option value="">-- Pilih Properti --</option>
            ${this.properties.map(p=>`<option value="${p.id}" ${item.property_id===p.id?'selected':''}>${p.code} - ${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-full"><label class="form-label">Judul *</label>
          <input type="text" id="imf-title" class="form-control" value="${item.title||''}" placeholder="e.g. Perbaikan AC lobby"></div>
        <div class="form-group form-full"><label class="form-label">Deskripsi</label>
          <textarea id="imf-desc" class="form-control" rows="2">${item.description||''}</textarea></div>
        <div class="form-group"><label class="form-label">Kategori *</label>
          <select id="imf-cat" class="form-control">${['Quality','Safety','Environment','Guest Satisfaction','Operational'].map(c=>`<option ${item.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Prioritas *</label>
          <select id="imf-priority" class="form-control">${['Low','Medium','High','Critical'].map(p=>`<option ${item.priority===p?'selected':''}>${p}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select id="imf-status" class="form-control">${['Open','In Progress','Completed','Verified'].map(s=>`<option ${item.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Progress (%)</label>
          <input type="number" id="imf-progress" class="form-control" value="${item.progress||0}" min="0" max="100"></div>
        <div class="form-group"><label class="form-label">Departemen</label>
          <input type="text" id="imf-dept" class="form-control" value="${item.department||''}" placeholder="e.g. Housekeeping"></div>
        <div class="form-group"><label class="form-label">Target Selesai</label>
          <input type="date" id="imf-target" class="form-control" value="${item.target_date||''}"></div>
        <div class="form-group"><label class="form-label">Tanggal Mulai</label>
          <input type="date" id="imf-start" class="form-control" value="${item.start_date||''}"></div>
        <div class="form-group form-full"><label class="form-label">Kondisi Sebelum</label>
          <textarea id="imf-before" class="form-control" rows="2">${item.before_condition||''}</textarea></div>
        <div class="form-group form-full"><label class="form-label">Kondisi Sesudah</label>
          <textarea id="imf-after" class="form-control" rows="2">${item.after_condition||''}</textarea></div>
      </div>`, async()=>{
      const record={
        property_id:document.getElementById('imf-prop').value||null,
        title:document.getElementById('imf-title').value.trim(),
        description:document.getElementById('imf-desc').value,
        category:document.getElementById('imf-cat').value,
        priority:document.getElementById('imf-priority').value,
        status:document.getElementById('imf-status').value,
        progress:parseInt(document.getElementById('imf-progress').value)||0,
        department:document.getElementById('imf-dept').value,
        target_date:document.getElementById('imf-target').value||null,
        start_date:document.getElementById('imf-start').value||null,
        before_condition:document.getElementById('imf-before').value,
        after_condition:document.getElementById('imf-after').value,
      };
      if(!record.title){App.showToast('Judul wajib diisi!','error');return;}
      const result=isEdit?await window.QSEDb.ImprovementDB.update(item.id,record):await window.QSEDb.ImprovementDB.insert(record);
      if(result.error){App.showToast('Gagal menyimpan: '+result.error.message,'error');return;}
      App.showToast(`Improvement berhasil ${isEdit?'diperbarui':'ditambahkan'}!`,'success');
      await this.loadData();
    });
  },

  showEditForm(id){const item=this.data.find(i=>i.id===id);if(item)this.showAddForm(item);},

  async updateStatus(id,newStatus){
    const updates={status:newStatus};
    if(newStatus==='Completed'||newStatus==='Verified') updates.progress=100;
    const {error}=await window.QSEDb.ImprovementDB.update(id,updates);
    if(error){App.showToast('Gagal update.','error');return;}
    App.showToast(`Status → "${newStatus}"`,'success');
    await this.loadData();
  },

  async deleteItem(id){
    App.showConfirm('Yakin hapus item ini?',async()=>{
      const {error}=await window.QSEDb.ImprovementDB.delete(id);
      if(error){App.showToast('Gagal menghapus.','error');return;}
      App.showToast('Item dihapus.','success');
      await this.loadData();
    });
  }
};
window.ImprovementModule = ImprovementModule;
