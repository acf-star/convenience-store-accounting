/**
 * 数据存储层 - Supabase 封装
 *
 * 所有方法均为 async，返回 Promise。
 * JS 对象用 camelCase，数据库列用 snake_case，读写时自动转换。
 */
const Store = {
  // ── 字段映射 ──────────────────────────────────────────────

  _txToDb(tx) {
    return {
      id: tx.id,
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      product_name: tx.productName || null,
      note: tx.note || null,
      recorded_by: tx.recordedBy || null
    };
  },

  _txFromDb(row) {
    return {
      id: row.id,
      date: row.date,
      type: row.type,
      amount: row.amount,
      category: row.category,
      productName: row.product_name || '',
      note: row.note || '',
      recordedBy: row.recorded_by || ''
    };
  },

  _catToDb(cat) {
    return { id: cat.id, name: cat.name, icon: cat.icon };
  },

  _catFromDb(row) {
    return { id: row.id, name: row.name, icon: row.icon };
  },

  _invToDb(item) {
    return {
      id: item.id,
      name: item.name,
      category_id: item.categoryId,
      purchase_price: item.purchasePrice,
      selling_price: item.sellingPrice,
      stock: item.stock,
      alert_threshold: item.alertThreshold
    };
  },

  _invFromDb(row) {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.category_id,
      purchasePrice: row.purchase_price,
      sellingPrice: row.sellingPrice,
      stock: row.stock,
      alertThreshold: row.alert_threshold
    };
  },

  // ── 交易记录 ──────────────────────────────────────────────

  async getTransactions() {
    const { data, error } = await SupabaseConfig.client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return data.map(r => this._txFromDb(r));
  },

  async addTransaction(tx) {
    const { data, error } = await SupabaseConfig.client
      .from('transactions')
      .insert(this._txToDb(tx))
      .select()
      .single();
    if (error) throw error;
    return this._txFromDb(data);
  },

  async updateTransaction(id, updates) {
    const dbUpdates = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
    if (updates.note !== undefined) dbUpdates.note = updates.note;
    if (updates.recordedBy !== undefined) dbUpdates.recorded_by = updates.recordedBy;

    const { data, error } = await SupabaseConfig.client
      .from('transactions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this._txFromDb(data);
  },

  async deleteTransaction(id) {
    const { error } = await SupabaseConfig.client
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── 分类 ──────────────────────────────────────────────────

  async getCategories() {
    const { data, error } = await SupabaseConfig.client
      .from('categories')
      .select('*')
      .order('id');
    if (error) throw error;
    return data.map(r => this._catFromDb(r));
  },

  async saveCategories(list) {
    // 先备份旧数据，insert 失败时可恢复
    const { data: backup } = await SupabaseConfig.client.from('categories').select('*');

    const { error: delError } = await SupabaseConfig.client.from('categories').delete().not('id', 'is', null);
    if (delError) throw delError;

    if (list.length > 0) {
      const { error } = await SupabaseConfig.client
        .from('categories')
        .insert(list.map(c => this._catToDb(c)));
      if (error) {
        // insert 失败，尝试恢复旧数据
        if (backup && backup.length > 0) {
          await SupabaseConfig.client.from('categories').insert(backup);
        }
        throw error;
      }
    }
  },

  // ── 库存 ──────────────────────────────────────────────────

  async getInventory() {
    const { data, error } = await SupabaseConfig.client
      .from('inventory')
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(r => this._invFromDb(r));
  },

  async addInventoryItem(item) {
    const { data, error } = await SupabaseConfig.client
      .from('inventory')
      .insert(this._invToDb(item))
      .select()
      .single();
    if (error) throw error;
    return this._invFromDb(data);
  },

  async updateInventoryItem(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
    if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.alertThreshold !== undefined) dbUpdates.alert_threshold = updates.alertThreshold;

    const { data, error } = await SupabaseConfig.client
      .from('inventory')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this._invFromDb(data);
  },

  async deleteInventoryItem(id) {
    const { error } = await SupabaseConfig.client
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── 备份 / 恢复 ──────────────────────────────────────────

  async backup() {
    const [transactions, categories, inventory] = await Promise.all([
      this.getTransactions(),
      this.getCategories(),
      this.getInventory()
    ]);
    return { transactions, categories, inventory, exportDate: new Date().toISOString() };
  },

  async restore(data) {
    if (data.categories) await this.saveCategories(data.categories);
    if (data.inventory) {
      await SupabaseConfig.client.from('inventory').delete().not('id', 'is', null);
      for (const item of data.inventory) {
        await this.addInventoryItem(item);
      }
    }
    if (data.transactions) {
      await SupabaseConfig.client.from('transactions').delete().not('id', 'is', null);
      for (const tx of data.transactions) {
        await this.addTransaction(tx);
      }
    }
  },

  async clearAll() {
    await SupabaseConfig.client.from('transactions').delete().not('id', 'is', null);
    await SupabaseConfig.client.from('inventory').delete().not('id', 'is', null);
    await SupabaseConfig.client.from('categories').delete().not('id', 'is', null);
  }
};
