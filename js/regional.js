// =====================================================
// regional.js - Regional Dashboard Module
// =====================================================

const RegionalModule = {
  async render() {
    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">🗺️ Dashboard Regional</h1>
          <p class="page-subtitle">Rekap seluruh properti RedDoorz Indonesia</p>
        </div>
        <div class="header-actions">
          <select class="select-sm" id="reg-filter" onchange="RegionalModule.applyFilter()">
            <option value="">Semua Region</option>
            ${['Sumatera','Jawa','Kalimantan','Sulawesi','Bali & Nusa Tenggara','Papua & Maluku'].map(r=>`<option>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="summary-grid" id="reg-summary"></div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Properti per Region</h3></div>
          <div class="chart-wrap"><canvas id="chart-region"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Distribusi Brand</h3></div>
          <div class="chart-wrap chart-donut"><canvas id="chart-brand"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Rekap per Kota</h3></div>
        <div id="city-table-wrap"></div>
      </div>`;
    await this.loadData();
  },

  async loadData() {
    const props = window.QSEDb._properties;
    if (!props) {
      const { data } = await window.QSEDb.db.from('properties').select('*');
      window.QSEDb._properties = data || [];
    }
    this.props = window.QSEDb._properties || [];
    this.renderAll();
  },

  applyFilter() {
    const region = document.getElementById('reg-filter')?.value || '';
    this.filtered = region ? this.props.filter(p => p.region === region) : this.props;
    this.renderSummary();
    this.renderCityTable();
  },

  renderAll() {
    this.filtered = this.props;
    this.renderSummary();
    this.renderCharts();
    this.renderCityTable();
  },

  renderSummary() {
    const data = this.filtered || this.props;
    const active = data.filter(p => p.status === 'Active').length;
    const regions = [...new Set(data.map(p => p.region))].length;
    const cities  = [...new Set(data.map(p => p.city))].length;
    const rooms   = data.reduce((s, p) => s + (p.total_rooms || 0), 0);

    document.getElementById('reg-summary').innerHTML = [
      { icon:'🏨', label:'Total Properti', value: data.length, color:'var(--t1)', sub:`${active} aktif`, bg:'rgba(59,130,246,.06)' },
      { icon:'🗺️', label:'Region', value: regions, color:'var(--info)', sub:'Area aktif', bg:'rgba(59,130,246,.06)' },
      { icon:'🏙️', label:'Kota', value: cities, color:'var(--success)', sub:'Kota terjangkau', bg:'rgba(34,197,94,.06)' },
      { icon:'🛏️', label:'Total Kamar', value: rooms.toLocaleString(), color:'var(--warning)', sub:'Seluruh properti', bg:'rgba(245,158,11,.06)' },
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

  renderCharts() {
    Chart.defaults.color = '#64748B';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

    // Region chart
    const regions = ['Sumatera','Jawa','Kalimantan','Sulawesi','Bali & Nusa Tenggara','Papua & Maluku'];
    const regionCount = regions.map(r => this.props.filter(p => p.region === r).length);
    const ctx1 = document.getElementById('chart-region')?.getContext('2d');
    if (ctx1) App.charts.region = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: regions.map(r => r.split(' ')[0]),
        datasets: [{ label:'Properti', data: regionCount,
          backgroundColor: ['rgba(227,24,55,.7)','rgba(59,130,246,.7)','rgba(34,197,94,.7)','rgba(245,158,11,.7)','rgba(168,85,247,.7)','rgba(20,184,166,.7)'],
          borderRadius: 6, borderWidth: 0 }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ y:{ ticks:{ stepSize:1 }, grid:{ color:'rgba(255,255,255,0.05)' } }, x:{ grid:{ display:false } } }
      }
    });

    // Brand donut
    const brands = ['RedDoorz','Sans Hotel','Urbanview','Lavana','Sunerra'];
    const brandCount = brands.map(b => this.props.filter(p => p.brand === b).length);
    const ctx2 = document.getElementById('chart-brand')?.getContext('2d');
    if (ctx2) App.charts.brand = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: brands,
        datasets:[{ data: brandCount,
          backgroundColor:['#E31837','#3B82F6','#8B5CF6','#F59E0B','#10B981'],
          borderWidth:0, hoverOffset:8 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins:{ legend:{ position:'bottom', labels:{ color:'#64748B', padding:12, font:{size:12} } } }
      }
    });
  },

  renderCityTable() {
    const data = this.filtered || this.props;
    const cityMap = {};
    data.forEach(p => {
      if (!cityMap[p.city]) cityMap[p.city] = { city:p.city, province:p.province, region:p.region, count:0, rooms:0, brands:new Set() };
      cityMap[p.city].count++;
      cityMap[p.city].rooms += p.total_rooms || 0;
      cityMap[p.city].brands.add(p.brand);
    });
    const cities = Object.values(cityMap).sort((a,b) => b.count - a.count);
    const wrap = document.getElementById('city-table-wrap');
    if (!wrap) return;
    if (!cities.length) { wrap.innerHTML='<div class="empty-state"><p>Tidak ada data.</p></div>'; return; }
    wrap.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Kota</th><th>Provinsi</th><th>Region</th><th class="text-center">Properti</th><th class="text-center">Total Kamar</th><th>Brand</th></tr></thead>
          <tbody>${cities.map(c=>`
            <tr>
              <td class="fw-600">${c.city}</td>
              <td>${c.province}</td>
              <td><span class="badge badge-neutral">${c.region}</span></td>
              <td class="text-center fw-700">${c.count}</td>
              <td class="text-center">${c.rooms}</td>
              <td>${[...c.brands].map(b=>`<span class="badge badge-neutral" style="margin:1px">${b}</span>`).join('')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
};
window.RegionalModule = RegionalModule;
