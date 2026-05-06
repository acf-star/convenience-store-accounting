/**
 * 数据存储层 - localStorage 封装
 */
const Store = {
  KEYS: {
    TRANSACTIONS: 'csa_transactions',
    CATEGORIES: 'csa_categories',
    INVENTORY: 'csa_inventory',
    SETTINGS: 'csa_settings'
  },

  /** 获取数据 */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /** 保存数据 */
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /** 获取交易记录 */
  getTransactions() {
    return this.get(this.KEYS.TRANSACTIONS) || [];
  },

  /** 保存交易记录 */
  saveTransactions(list) {
    this.set(this.KEYS.TRANSACTIONS, list);
  },

  /** 添加交易记录 */
  addTransaction(tx) {
    const list = this.getTransactions();
    list.push(tx);
    this.saveTransactions(list);
    return tx;
  },

  /** 更新交易记录 */
  updateTransaction(id, updates) {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveTransactions(list);
      return list[idx];
    }
    return null;
  },

  /** 删除交易记录 */
  deleteTransaction(id) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  },

  /** 获取分类列表 */
  getCategories() {
    return this.get(this.KEYS.CATEGORIES) || [];
  },

  /** 保存分类列表 */
  saveCategories(list) {
    this.set(this.KEYS.CATEGORIES, list);
  },

  /** 获取库存列表 */
  getInventory() {
    return this.get(this.KEYS.INVENTORY) || [];
  },

  /** 保存库存列表 */
  saveInventory(list) {
    this.set(this.KEYS.INVENTORY, list);
  },

  /** 添加库存商品 */
  addInventoryItem(item) {
    const list = this.getInventory();
    list.push(item);
    this.saveInventory(list);
    return item;
  },

  /** 更新库存商品 */
  updateInventoryItem(id, updates) {
    const list = this.getInventory();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveInventory(list);
      return list[idx];
    }
    return null;
  },

  /** 删除库存商品 */
  deleteInventoryItem(id) {
    const list = this.getInventory().filter(i => i.id !== id);
    this.saveInventory(list);
  },

  /** 备份所有数据 */
  backup() {
    return {
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      inventory: this.getInventory(),
      exportDate: new Date().toISOString()
    };
  },

  /** 恢复数据 */
  restore(data) {
    if (data.transactions) this.saveTransactions(data.transactions);
    if (data.categories) this.saveCategories(data.categories);
    if (data.inventory) this.saveInventory(data.inventory);
  }
};
