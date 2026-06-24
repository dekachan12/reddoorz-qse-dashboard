// dashboard.js - Home Dashboard Module

const DashboardModule = {
  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Ringkasan operasional QSE RedDoorz Area West — Medan</p>
        </div>
        <span class="date-tag">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      </div>

      <div class="summary-grid" id="summary-cards">
        ${[1,2,3,4].map(()=>`<div class="summary-card skeleton"></div>`).join('')}
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Pengeluaran Petty Cash</h3>
            <span class="card-subtitle">6 Bulan Terakhir</span>
          </div>
          <div class="chart-wrap"><canvas id="chart-petty-cash"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Status Improvement</h3>
            <span class="card-subtitle">Semua Item</span>
          </div>
          <div class="chart-wrap chart-donut"><canvas id="chart-improvement"></canvas></div>
        </div>
      </div>

      <div class="dashboard-grid-3">
        <div class="card col-span-2">
          <div class="card-header">
            <h3 class="card-title">⚠️ Alert Stok Rendah</h3>
          </div>
          <div id="low-stock-list"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Improvement Priority</h3>
          </div>
          <div id="improvement-priority-list"></div>
        </div>
      </div>`;

    await this.loadSummaryCards();
    await this.loadCharts();
    await this.loadAlerts();
  },

  async loadSummaryCards() {
    const { PettyCashDB, LinenDB, InventoryDB, ImprovementDB } = window.QSEDb;
    const [pcR, liR, invR, impR] = await Promise.all([
      PettyCashDB.getSummary(), LinenDB.getAll(), InventoryDB.getAll(), ImprovementDB.getAll()
    ]);

    let saldo = 0;
    (pcR.data||[]).forEach(t => t.type==='replenishment' ? saldo+=+t.amount : saldo-=+t.amount);

    const linens = liR.data||[];
    const invs   = invR.data||[];
    const imps   = impR.data||[];
    const linenAlerts = linens.filter(l=>l.total_stock<l.par_level).length;
    const invAlerts   = invs.filter(i=>i.current_stock<=i.min_stock).length;
    const done        = imps.filter(i=>i.status==='Completed'||i.status==='Verified').length;
    const pct         = imps.length ? Math.round(done/imps.length*100) : 0;

    const cards = [
      { icon:'💰', label:'Saldo Petty Cash', value: App.formatRupiah(saldo),
        color: saldo>=0?'var(--success)':'var(--danger)',
        sub: `${(pcR.data||[]).filter(t=>t.type==='expense').length} transaksi pengeluaran`,
        accentColor: saldo>=0?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)' },
      { icon:'🛏️', label:'Total Linen', value: linens.reduce((s,l)=>s+l.total_stock,0)+' pcs',
        color: linenAlerts>0?'var(--warning)':'var(--success)',
        sub: linenAlerts>0?`${linenAlerts} item di bawah PAR`:'Semua PAR terpenuhi',
        accentColor: linenAlerts>0?'rgba(245,158,11,.06)':'rgba(34,197,94,.06)' },
      { icon:'📦', label:'Total Inventory', value: invs.length+' item',
        color: invAlerts>0?'var(--warning)':'var(--success)',
        sub: invAlerts>0?`${invAlerts} item stok rendah`:'Semua stok aman',
        accentColor: invAlerts>0?'rgba(245,158,11,.06)':'rgba(34,197,94,.06)' },
      { icon:'📈', label:'Progress Improvement', value: pct+'%',
        color: pct>=70?'var(--success)':pct>=40?'var(--warning)':'var(--danger)',
        sub: `${done} / ${imps.length} item selesai`,
        accentColor: pct>=70?'rgba(34,197,94,.06)':'rgba(245,158,11,.06)' },
    ];

    document.getElementById('summary-cards').innerHTML = cards.map(c=>`
      <div class="summary-card" style="--card-accent:${c.accentColor}">
        <div class="summary-icon-wrap" style="background:${c.accentColor}">${c.icon}</div>
        <div>
          <p class="summary-label">${c.label}</p>
          <p class="summary-value" style="color:${c.color}">${c.value}</p>
          <p class="summary-sub">${c.sub}</p>
        </div>
      </div>`).join('');

    this._pcData = pcR.data||[];
    this._improvements = imps;
    this._linens = linens;
    this._invItems = invs;
  },

  async loadCharts() {
    const monthlyExpense = {};
    const months = [];
    for (let i=5;i>=0;i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.push({ key, label: d.toLocaleDateString('id-ID',{month:'short',year:'2-digit'}) });
      monthlyExpense[key] = 0;
    }
    (this._pcData||[]).forEach(t=>{
      if (t.type==='expense') { const k=t.date?.substring(0,7); if(k in monthlyExpense) monthlyExpense[k]+=+t.amount; }
    });

    Chart.defaults.color = '#64748B';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

    const ctx1 = document.getElementById('chart-petty-cash')?.getContext('2d');
    if (ctx1) App.charts.petty = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: months.map(m=>m.label),
        datasets: [{ label:'Pengeluaran', data: months.map(m=>monthlyExpense[m.key]),
          backgroundColor: 'rgba(227,24,55,0.65)', borderColor: '#E31837',
          borderWidth: 2, borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false } },
        scales: {
          y: { ticks:{ callback: v=>'Rp '+(v/1000).toFixed(0)+'K', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.05)' } },
          x: { ticks:{ font:{size:11} }, grid:{ display:false } }
        }
      }
    });

    const statusCount = {'Open':0,'In Progress':0,'Completed':0,'Verified':0};
    (this._improvements||[]).forEach(i=>{ if(i.status in statusCount) statusCount[i.status]++; });

    const ctx2 = document.getElementById('chart-improvement')?.getContext('2d');
    if (ctx2) App.charts.improvement = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCount),
        datasets:[{ data: Object.values(statusCount),
          backgroundColor:['#334155','#3B82F6','#22C55E','#E31837'],
          borderWidth:0, hoverOffset:8 }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'68%',
        plugins: { legend:{ position:'bottom', labels:{ color:'#64748B', padding:14, font:{size:12} } } }
      }
    });
  },

  async loadAlerts() {
    const lowLinen = (this._linens||[]).filter(l=>l.total_stock<l.par_level);
    const lowInv   = (this._invItems||[]).filter(i=>i.current_stock<=i.min_stock);
    const allAlerts = [
      ...lowLinen.map(l=>({ name:l.name, type:'Linen', current:l.total_stock+' pcs', min:'PAR: '+l.par_level, severity: l.total_stock<l.par_level*.5?'critical':'warning' })),
      ...lowInv.map(i=>({ name:i.name, type:'Inventory', current:i.current_stock+' '+i.unit, min:'Min: '+i.min_stock, severity: i.current_stock===0?'critical':'warning' }))
    ];

    document.getElementById('low-stock-list').innerHTML = allAlerts.length===0
      ? '<p class="empty-text">✅ Semua stok dalam kondisi aman.</p>'
      : `<div class="alert-list">${allAlerts.map(a=>`
          <div class="alert-item alert-${a.severity}">
            <div class="alert-dot"></div>
            <div><span class="alert-name">${a.name}</span><span class="alert-meta">${a.type} · ${a.current} · ${a.min}</span></div>
          </div>`).join('')}</div>`;

    const prioEl = document.getElementById('improvement-priority-list');
    const prioColors = { Critical:'#EF4444', High:'#F59E0B', Medium:'#3B82F6', Low:'#22C55E' };
    const imps = this._improvements||[];
    prioEl.innerHTML = `<div class="prio-list">${['Critical','High','Medium','Low'].map(p=>{
      const cnt = imps.filter(i=>i.priority===p&&i.status!=='Verified').length;
      return `<div class="prio-item">
        <span class="badge" style="background:${prioColors[p]}18;color:${prioColors[p]};border-color:${prioColors[p]}30;min-width:66px;justify-content:center">${p}</span>
        <div class="prio-bar-bg"><div class="prio-bar" style="width:${Math.min(cnt*22,100)}%;background:${prioColors[p]}"></div></div>
        <span class="prio-count">${cnt}</span>
      </div>`;}).join('')}</div>`;
  }
};
window.DashboardModule = DashboardModule;
