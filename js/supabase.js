// =====================================================
// supabase.js - Supabase Client Configuration
// GANTI nilai SUPABASE_URL dan SUPABASE_ANON_KEY
// dengan credentials dari project Supabase Anda
// =====================================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Inisialisasi Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// AUTH HELPERS
// =====================================================
const Auth = {
  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    const { error } = await db.auth.signOut();
    return { error };
  },

  async getUser() {
    const { data: { user } } = await db.auth.getUser();
    return user;
  },

  onAuthStateChange(callback) {
    return db.auth.onAuthStateChange(callback);
  }
};

// =====================================================
// PETTY CASH
// =====================================================
const PettyCashDB = {
  async getAll() {
    const { data, error } = await db
      .from('petty_cash')
      .select('*')
      .order('date', { ascending: false });
    return { data, error };
  },

  async insert(record) {
    const { data, error } = await db.from('petty_cash').insert([record]).select();
    return { data, error };
  },

  async delete(id) {
    const { error } = await db.from('petty_cash').delete().eq('id', id);
    return { error };
  },

  async getSummary() {
    const { data, error } = await db.from('petty_cash').select('type, amount, category, date');
    return { data, error };
  }
};

// =====================================================
// LINEN
// =====================================================
const LinenDB = {
  async getAll() {
    const { data, error } = await db
      .from('linen_items')
      .select('*')
      .order('category', { ascending: true });
    return { data, error };
  },

  async insert(record) {
    const { data, error } = await db.from('linen_items').insert([record]).select();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await db
      .from('linen_items')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  async delete(id) {
    const { error } = await db.from('linen_items').delete().eq('id', id);
    return { error };
  },

  async addHistory(record) {
    const { data, error } = await db.from('linen_history').insert([record]).select();
    return { data, error };
  },

  async getHistory(itemId) {
    const { data, error } = await db
      .from('linen_history')
      .select('*')
      .eq('linen_item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(20);
    return { data, error };
  }
};

// =====================================================
// INVENTORY
// =====================================================
const InventoryDB = {
  async getAll() {
    const { data, error } = await db
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true });
    return { data, error };
  },

  async insert(record) {
    const { data, error } = await db.from('inventory_items').insert([record]).select();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await db
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  async delete(id) {
    const { error } = await db.from('inventory_items').delete().eq('id', id);
    return { error };
  },

  async addHistory(record) {
    const { data, error } = await db.from('inventory_history').insert([record]).select();
    return { data, error };
  },

  async getHistory(itemId) {
    const { data, error } = await db
      .from('inventory_history')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(20);
    return { data, error };
  }
};

// =====================================================
// IMPROVEMENTS
// =====================================================
const ImprovementDB = {
  async getAll() {
    const { data, error } = await db
      .from('improvements')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async insert(record) {
    const { data, error } = await db.from('improvements').insert([record]).select();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await db
      .from('improvements')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },

  async delete(id) {
    const { error } = await db.from('improvements').delete().eq('id', id);
    return { error };
  }
};

// Export semua
window.QSEDb = { Auth, PettyCashDB, LinenDB, InventoryDB, ImprovementDB, db };
