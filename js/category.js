/**
 * 分类管理模块
 *
 * 使用缓存机制：数据从 Supabase 加载后缓存在内存，
 * 渲染时同步读取缓存，增删改后自动刷新缓存。
 */
const Category = {
  _cache: [],

  /** 预设分类 */
  defaults: [
    { id: 'cat_beverage', name: '饮料', icon: '🥤', color: '#2196F3' },
    { id: 'cat_snack', name: '零食', icon: '🍪', color: '#FF9800' },
    { id: 'cat_daily', name: '日用品', icon: '🧴', color: '#9C27B0' },
    { id: 'cat_tobacco', name: '烟草', icon: '🚬', color: '#795548' },
    { id: 'cat_fresh', name: '生鲜', icon: '🥬', color: '#4CAF50' },
    { id: 'cat_other', name: '其他', icon: '📦', color: '#607D8B' }
  ],

  /** 从数据库加载到缓存 */
  async loadFromDB() {
    this._cache = await Store.getCategories();
  },

  /** 初始化（首次使用时写入预设分类） */
  async init() {
    await this.loadFromDB();
    if (this._cache.length === 0) {
      await Store.saveCategories(this.defaults);
      await this.loadFromDB();
    }
  },

  /** 获取所有分类（同步，从缓存读取） */
  getAll() {
    return this._cache;
  },

  /** 根据 ID 获取分类（同步，从缓存读取） */
  getById(id) {
    return this._cache.find(c => c.id === id);
  },

  /** 添加分类 */
  async add(name, icon, color) {
    const cat = {
      id: 'cat_' + Utils.genId(),
      name,
      icon: icon || '📦',
      color: color || '#607D8B'
    };
    await Store.saveCategories([...this._cache, cat]);
    await this.loadFromDB();
    return cat;
  },

  /** 更新分类 */
  async update(id, updates) {
    const list = this._cache.map(c => c.id === id ? { ...c, ...updates } : c);
    await Store.saveCategories(list);
    await this.loadFromDB();
  },

  /** 删除分类 */
  async delete(id) {
    if (this._cache.length <= 1) {
      throw new Error('至少保留一个分类');
    }

    const transactions = await Store.getTransactions();
    const inventory = await Store.getInventory();
    const usedByTx = transactions.some(t => t.category === id);
    const usedByInv = inventory.some(i => i.categoryId === id);
    if (usedByTx || usedByInv) {
      throw new Error('该分类正在被交易或库存记录引用，无法删除');
    }

    const list = this._cache.filter(c => c.id !== id);
    await Store.saveCategories(list);
    await this.loadFromDB();
  },

  /** 渲染分类选择下拉框（同步） */
  renderSelect(selectedId) {
    return this._cache.map(c =>
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');
  },

  /** 渲染分类管理列表（同步） */
  renderList() {
    if (this._cache.length === 0) return '<div class="empty">暂无分类</div>';

    return this._cache.map(c => `
      <div class="stock-item" data-id="${c.id}">
        <div class="transaction-item__icon" style="background:${c.color}20;color:${c.color}">${c.icon}</div>
        <div class="stock-item__info">
          <div class="stock-item__name">${c.name}</div>
        </div>
        <div class="stock-item__actions">
          <button class="btn btn--small btn--outline" onclick="Category.showEditModal('${c.id}')">编辑</button>
          <button class="btn btn--small btn--danger" onclick="Category.confirmDelete('${c.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },

  /** 显示添加弹窗 */
  showAddModal() {
    const html = `
      <div class="modal-overlay" id="categoryModal">
        <div class="modal">
          <div class="modal__title">添加分类</div>
          <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="catName" placeholder="如：饮料">
          </div>
          <div class="form-group">
            <label>图标（emoji）</label>
            <input type="text" id="catIcon" placeholder="如：🥤" value="📦">
          </div>
          <div class="form-group">
            <label>颜色</label>
            <input type="color" id="catColor" value="#607D8B">
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Category.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Category.saveNew()">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 保存新分类 */
  async saveNew() {
    const name = document.getElementById('catName').value.trim();
    if (!name) { Notify.toast('请输入分类名称', 'error'); return; }
    const icon = document.getElementById('catIcon').value || '📦';
    const color = document.getElementById('catColor').value;
    await this.add(name, icon, color);
    this.closeModal();
    Notify.toast(`已添加分类「${name}」`);
    await App.renderCurrentPage();
  },

  /** 显示编辑弹窗 */
  showEditModal(id) {
    const cat = this.getById(id);
    if (!cat) return;
    const html = `
      <div class="modal-overlay" id="categoryModal">
        <div class="modal">
          <div class="modal__title">编辑分类</div>
          <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="catName" value="${cat.name}">
          </div>
          <div class="form-group">
            <label>图标（emoji）</label>
            <input type="text" id="catIcon" value="${cat.icon}">
          </div>
          <div class="form-group">
            <label>颜色</label>
            <input type="color" id="catColor" value="${cat.color}">
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Category.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Category.saveEdit('${id}')">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 保存编辑 */
  async saveEdit(id) {
    const name = document.getElementById('catName').value.trim();
    if (!name) { Notify.toast('请输入分类名称', 'error'); return; }
    await this.update(id, {
      name,
      icon: document.getElementById('catIcon').value || '📦',
      color: document.getElementById('catColor').value
    });
    this.closeModal();
    Notify.toast('已更新');
    await App.renderCurrentPage();
  },

  /** 确认删除 */
  async confirmDelete(id) {
    const cat = this.getById(id);
    if (!cat) return;
    const ok = await Notify.confirm('删除分类', `确定删除分类「${cat.name}」吗？`);
    if (ok) {
      try {
        await this.delete(id);
        Notify.toast('已删除');
        await App.renderCurrentPage();
      } catch (e) {
        Notify.toast(e.message, 'error');
      }
    }
  },

  /** 关闭弹窗 */
  closeModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.remove();
  }
};
