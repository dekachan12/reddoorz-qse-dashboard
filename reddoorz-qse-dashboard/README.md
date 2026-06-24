# 🔴 RedDoorz QSE Dashboard

Dashboard manajemen Quality, Safety & Environment untuk RedDoorz Area West.

---

## 📋 Fitur

| Modul | Fitur |
|-------|-------|
| 📊 Dashboard | Summary cards, chart pengeluaran, status improvement, alert stok rendah |
| 💰 Petty Cash | Tambah/hapus transaksi, filter, saldo real-time, export CSV |
| 🛏️ Inventory Linen | PAR level tracking, stock opname, kondisi linen, history |
| 📦 Inventory Umum | Stok in/out, alert stok rendah, nilai inventory, history |
| 📈 Improvement | Tracking progress, status kanban, before/after condition, quick-update |

---

## 🚀 Setup (Langkah demi Langkah)

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → klik **Start your project**
2. Login dengan GitHub/Email
3. Klik **New Project**
4. Isi: nama project (`reddoorz-qse`), password database, region (`Southeast Asia`)
5. Tunggu project selesai dibuat (~2 menit)

### 2. Jalankan SQL Migration

1. Di Supabase Dashboard → klik **SQL Editor** (menu kiri)
2. Klik **New query**
3. Copy seluruh isi file `sql/migration.sql`
4. Paste ke editor → klik **Run**
5. Pastikan semua query berhasil (tidak ada error merah)

### 3. Konfigurasi Supabase di Aplikasi

1. Di Supabase Dashboard → **Project Settings** → **API**
2. Copy nilai berikut:
   - **Project URL** (contoh: `https://abcxyz.supabase.co`)
   - **anon / public key** (panjang, dimulai dengan `eyJ...`)
3. Buka file `js/supabase.js`
4. Ganti baris berikut:
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```
   dengan URL dan Key milik Anda.

### 4. Buat User Login

1. Di Supabase Dashboard → **Authentication** → **Users**
2. Klik **Add user** → **Create new user**
3. Isi email dan password tim QSE
4. Klik **Create user**

### 5. Jalankan Aplikasi

**Cara 1 – VS Code Live Server (Recommended):**
- Install extension "Live Server" di VS Code
- Klik kanan `index.html` → Open with Live Server

**Cara 2 – Python (tanpa install tambahan):**
```bash
cd reddoorz-qse-dashboard
python -m http.server 8080
# Buka browser: http://localhost:8080
```

**⚠️ JANGAN buka `index.html` langsung (double-click)** — ES Modules tidak bekerja via `file://` protocol.

---

## 🌐 Deploy ke GitHub Pages

1. **Push ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RedDoorz QSE Dashboard"
   git remote add origin https://github.com/USERNAME/reddoorz-qse-dashboard.git
   git push -u origin main
   ```

2. **Aktifkan GitHub Pages:**
   - Di GitHub repo → **Settings** → **Pages**
   - Source: **Deploy from a branch** → `main` → `/root`
   - Klik **Save**
   - URL akan muncul dalam beberapa menit: `https://USERNAME.github.io/reddoorz-qse-dashboard`

---

## 🏗️ Struktur File

```
reddoorz-qse-dashboard/
├── index.html              ← Entry point utama
├── css/
│   └── styles.css          ← Semua styling
├── js/
│   ├── supabase.js         ← ⚙️ EDIT INI: Supabase config
│   ├── app.js              ← Router & global utilities
│   ├── dashboard.js        ← Modul Dashboard
│   ├── petty-cash.js       ← Modul Petty Cash
│   ├── linen.js            ← Modul Linen
│   ├── inventory.js        ← Modul Inventory Umum
│   └── improvement.js      ← Modul Improvement
├── sql/
│   └── migration.sql       ← ⚙️ Jalankan ini di Supabase
└── README.md
```

---

## ❓ Troubleshooting

| Problem | Solusi |
|---------|--------|
| Tidak bisa login | Pastikan user sudah dibuat di Supabase Auth |
| Data tidak muncul | Cek apakah SQL migration sudah dijalankan |
| Error "Invalid API key" | Periksa kembali SUPABASE_URL dan ANON_KEY di supabase.js |
| Halaman kosong | Buka via Live Server, bukan file:// |
| Chart tidak muncul | Pastikan koneksi internet (Chart.js diload dari CDN) |

---

## 👤 Tim QSE RedDoorz Area West

Dibangun untuk kebutuhan operasional Quality, Safety & Environment Management.
Dikembangkan menggunakan Vanilla JS + Supabase (PostgreSQL).
