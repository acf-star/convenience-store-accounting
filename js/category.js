/**
 * 分类管理模块
 */
const Category = {
  /** 预设分类 */
  defaults: [
    { id: 'cat_beverage', name: '饮料', icon: '🥤', color: '#2196F3' },
    { id: 'cat_snack', name: '零食', icon: '🍪', color: '#FF9800' },
    { id: 'cat_daily', name: '日用品', icon: '🧴', color: '#9C27B0' },
    { id: 'cat_tobacco', name: '烟草', icon: '🚬', color: '#795548' },
    { id: 'cat_fresh', name: '生鲜', icon: '🥬', color: '#4CAF50' },
    { id: 'cat_other', name: '其他', icon: '📦', color: '#607D8B' }
  ],

  /** 初始化（首次使用时写入预设分类） */
  init() {
    const existing = Store.getCategories();
    if (existing.length === 0) {
      Store.saveCategories(this.defaults);
    }
  },

  /** 获取所有分类 */
  getAll() {
    return Store.getCategories();
  },

  /** 根据 ID 获取分类 */
  getById(id) {
    return this.getAll().find(c => c.id === id);
  },

  /** 添加分类 */
  add(name, icon, color) {
    const cat = {
      id: 'cat_' + Utils.genId(),
      name,
      icon: icon || '📦',
      color: color || '#607D8B'
    };
    const list = this.getAll();
    list.push(cat);
    Store.saveCategories(list);
    return cat;
  },

  /** 更新分类 */
  update(id, updates) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      Store.saveCategories(list);
      return list[idx];
    }
    return null;
  },

  /** 删除分类 */
  delete(id) {
    const list = this.getAll().filter(c => c.id !== id);
    Store.saveCategories(list);
  },

  /** 渲染分类选择下拉框 */
  renderSelect(selectedId) {
    const cats = this.getAll();
    return cats.map(c =>
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');
  },

  /** 渲染分类管理列表 */
  renderList() {
    const cats = this.getAll();
    if (cats.length === 0) return '<div class="empty">暂无分类</div>';

    return cats.map(c => `
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
  saveNew() {
    const name = document.getElementById('catName').value.trim();
    if (!name) { Notify.toast('请输入分类名称', 'error'); return; }
    const icon = document.getElementById('catIcon').value || '📦';
    const color = document.getElementById('catColor').value;
    this.add(name, icon, color);
    this.closeModal();
    Notify.toast(`已添加分类「${name}」`);
    App.renderCurrentPage();
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
  saveEdit(id) {
    const name = document.getElementById('catName').value.trim();
    if (!name) { Notify.toast('请输入分类名称', 'error'); return; }
    this.update(id, {
      name,
      icon: document.getElementById('catIcon').value || '📦',
      color: document.getElementById('catColor').value
    });
    this.closeModal();
    Notify.toast('已更新');
    App.renderCurrentPage();
  },

  /** 确认删除 */
  async confirmDelete(id) {
    const cat = this.getById(id);
    if (!cat) return;
    const ok = await Notify.confirm('删除分类', `确定删除分类「${cat.name}」吗？`);
    if (ok) {
      this.delete(id);
      Notify.toast('已删除');
      App.renderCurrentPage();
    }
  },

  /** 关闭弹窗 */
  closeModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.remove();
  }
};
