/**
 * 库存管理模块
 */
const Inventory = {
  /** 渲染库存页面 */
  async render() {
    const items = await Store.getInventory();
    const lowStock = items.filter(i => i.stock <= i.alertThreshold);

    return `
      ${lowStock.length > 0 ? `
        <div class="card" style="border-left:3px solid var(--warning);background:var(--warning-soft)">
          <div class="card__title" style="color:var(--warning)">⚠️ 库存预警 (${lowStock.length})</div>
          ${lowStock.map(i => {
            const cat = Category.getById(i.categoryId);
            return `<div style="font-size:13px;padding:4px 0;color:var(--text-secondary)">${cat ? cat.icon : '📦'} ${i.name} - 剩余 <strong style="color:var(--text)">${i.stock}</strong></div>`;
          }).join('')}
        </div>
      ` : ''}

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="card__title" style="margin-bottom:0">商品库存</div>
          <button class="btn btn--primary btn--small" onclick="Inventory.showAddModal()">+ 添加</button>
        </div>
        <div id="inventoryList">${this.renderList(items)}</div>
      </div>
    `;
  },

  /** 渲染库存列表 */
  renderList(items) {
    if (items.length === 0) {
      return '<div class="empty"><div class="empty__icon">📦</div>暂无库存商品</div>';
    }

    return items.map(item => {
      const cat = Category.getById(item.categoryId);
      const isLow = item.stock <= item.alertThreshold;
      const badgeClass = isLow ? 'stock-item__badge--low' : 'stock-item__badge--ok';
      const badgeText = isLow ? '库存不足' : '充足';

      return `
        <div class="stock-item">
          <div class="transaction-item__icon" style="background:${cat ? cat.color : '#607D8B'}20;color:${cat ? cat.color : '#607D8B'}">
            ${cat ? cat.icon : '📦'}
          </div>
          <div class="stock-item__info">
            <div class="stock-item__name">${item.name}</div>
            <div class="stock-item__detail">
              进价 ¥${Utils.formatMoney(item.purchasePrice)} · 售价 ¥${Utils.formatMoney(item.sellingPrice)} · 库存 ${item.stock}
            </div>
          </div>
          <span class="stock-item__badge ${badgeClass}">${badgeText}</span>
          <div class="action-menu">
            <button class="action-menu__trigger" onclick="ActionMenu.toggle(this)">⋯</button>
            <div class="action-menu__dropdown">
              <button class="action-menu__item" onclick="ActionMenu.close();Inventory.showStockInModal('${item.id}')">进货</button>
              <button class="action-menu__item" onclick="ActionMenu.close();Inventory.sell('${item.id}')">销售</button>
              <button class="action-menu__item" onclick="ActionMenu.close();Inventory.showEditModal('${item.id}')">编辑</button>
              <button class="action-menu__item action-menu__item--danger" onclick="ActionMenu.close();Inventory.confirmDelete('${item.id}')">删除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /** 显示添加商品弹窗 */
  showAddModal() {
    const html = `
      <div class="modal-overlay" id="invModal">
        <div class="modal">
          <div class="modal__title">添加商品</div>
          <div class="form-group">
            <label>商品名称</label>
            <input type="text" id="invName" placeholder="如：可口可乐 500ml">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select id="invCategory">${Category.renderSelect()}</select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>进价</label>
              <input type="number" id="invPurchase" placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label>售价</label>
              <input type="number" id="invSelling" placeholder="0.00" step="0.01" min="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>初始库存</label>
              <input type="number" id="invStock" value="0" min="0">
            </div>
            <div class="form-group">
              <label>预警阈值</label>
              <input type="number" id="invThreshold" value="5" min="0">
            </div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Inventory.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Inventory.saveNew()">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 保存新商品 */
  async saveNew() {
    const name = document.getElementById('invName').value.trim();
    if (!name) { Notify.toast('请输入商品名称', 'error'); return; }

    const purchasePrice = parseFloat(document.getElementById('invPurchase').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('invSelling').value) || 0;
    const stock = parseInt(document.getElementById('invStock').value) || 0;

    await Store.addInventoryItem({
      id: Utils.genId(),
      name,
      categoryId: document.getElementById('invCategory').value,
      purchasePrice,
      sellingPrice,
      stock,
      alertThreshold: parseInt(document.getElementById('invThreshold').value) || 5
    });

    this.closeModal();
    Notify.toast(`已添加 ${name}`);
    await App.renderCurrentPage();
  },

  /** 显示进货弹窗 */
  async showStockInModal(id) {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;

    const html = `
      <div class="modal-overlay" id="invModal">
        <div class="modal">
          <div class="modal__title">进货 - ${item.name}</div>
          <div class="form-group">
            <label>进货数量</label>
            <input type="number" id="stockInQty" value="1" min="1">
          </div>
          <div class="form-group">
            <label>进货单价（当前进价 ¥${Utils.formatMoney(item.purchasePrice)}）</label>
            <input type="number" id="stockInPrice" value="${item.purchasePrice}" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>日期</label>
            <input type="date" id="stockInDate" value="${Utils.today()}">
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Inventory.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Inventory.confirmStockIn('${id}')">确认进货</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 确认进货 */
  async confirmStockIn(id) {
    const confirmBtn = document.querySelector('#invModal .btn--primary');
    if (confirmBtn?.disabled) return;
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '处理中...'; }

    try {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;

    const qty = parseInt(document.getElementById('stockInQty').value) || 0;
    const price = parseFloat(document.getElementById('stockInPrice').value) || 0;
    const date = document.getElementById('stockInDate').value || Utils.today();

    if (qty <= 0) { Notify.toast('请输入有效数量', 'error'); if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '确认进货'; } return; }

    await Store.updateInventoryItem(id, { stock: item.stock + qty, purchasePrice: price });

    await Store.addTransaction({
      id: Utils.genId(),
      date,
      type: 'expense',
      amount: qty * price,
      category: item.categoryId,
      productName: `进货: ${item.name} x${qty}`,
      note: `进货 ${qty} 件，单价 ¥${Utils.formatMoney(price)}`,
      recordedBy: SupabaseConfig.getCurrentUser()
    });

    this.closeModal();
    Notify.toast(`已进货 ${item.name} x${qty}`);
    await App.renderCurrentPage();
    await App.updateHeaderSummary();
    } catch (e) {
      Notify.toast('进货失败: ' + e.message, 'error');
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '确认进货'; }
    }
  },

  /** 销售 */
  async sell(id) {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;

    if (item.stock <= 0) { Notify.toast('库存不足', 'error'); return; }

    const html = `
      <div class="modal-overlay" id="invModal">
        <div class="modal">
          <div class="modal__title">销售 - ${item.name}</div>
          <div class="form-group">
            <label>销售数量（库存: ${item.stock}）</label>
            <input type="number" id="sellQty" value="1" min="1" max="${item.stock}">
          </div>
          <div class="form-group">
            <label>销售单价（当前售价 ¥${Utils.formatMoney(item.sellingPrice)}）</label>
            <input type="number" id="sellPrice" value="${item.sellingPrice}" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>日期</label>
            <input type="date" id="sellDate" value="${Utils.today()}">
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Inventory.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Inventory.confirmSell('${id}')">确认销售</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 确认销售 */
  async confirmSell(id) {
    const confirmBtn = document.querySelector('#invModal .btn--primary');
    if (confirmBtn?.disabled) return;
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '处理中...'; }

    try {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;

    const qty = parseInt(document.getElementById('sellQty').value) || 0;
    const price = parseFloat(document.getElementById('sellPrice').value) || 0;
    const date = document.getElementById('sellDate').value || Utils.today();

    if (qty <= 0 || qty > item.stock) { Notify.toast('请输入有效数量', 'error'); if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '确认销售'; } return; }

    await Store.updateInventoryItem(id, { stock: item.stock - qty, sellingPrice: price });

    await Store.addTransaction({
      id: Utils.genId(),
      date,
      type: 'income',
      amount: qty * price,
      category: item.categoryId,
      productName: `销售: ${item.name} x${qty}`,
      note: `销售 ${qty} 件，单价 ¥${Utils.formatMoney(price)}`,
      recordedBy: SupabaseConfig.getCurrentUser()
    });

    this.closeModal();
    Notify.toast(`已销售 ${item.name} x${qty}`);
    await App.renderCurrentPage();
    await App.updateHeaderSummary();
    } catch (e) {
      Notify.toast('销售失败: ' + e.message, 'error');
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '确认销售'; }
    }
  },

  /** 显示编辑弹窗 */
  async showEditModal(id) {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;

    const html = `
      <div class="modal-overlay" id="invModal">
        <div class="modal">
          <div class="modal__title">编辑商品</div>
          <div class="form-group">
            <label>商品名称</label>
            <input type="text" id="invName" value="${item.name}">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select id="invCategory">${Category.renderSelect(item.categoryId)}</select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>进价</label>
              <input type="number" id="invPurchase" value="${item.purchasePrice}" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label>售价</label>
              <input type="number" id="invSelling" value="${item.sellingPrice}" step="0.01" min="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>当前库存</label>
              <input type="number" id="invStock" value="${item.stock}" min="0">
            </div>
            <div class="form-group">
              <label>预警阈值</label>
              <input type="number" id="invThreshold" value="${item.alertThreshold}" min="0">
            </div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Inventory.closeModal()">取消</button>
            <button class="btn btn--primary" onclick="Inventory.saveEdit('${id}')">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 保存编辑 */
  async saveEdit(id) {
    const name = document.getElementById('invName').value.trim();
    if (!name) { Notify.toast('请输入商品名称', 'error'); return; }

    await Store.updateInventoryItem(id, {
      name,
      categoryId: document.getElementById('invCategory').value,
      purchasePrice: parseFloat(document.getElementById('invPurchase').value) || 0,
      sellingPrice: parseFloat(document.getElementById('invSelling').value) || 0,
      stock: parseInt(document.getElementById('invStock').value) || 0,
      alertThreshold: parseInt(document.getElementById('invThreshold').value) || 5
    });

    this.closeModal();
    Notify.toast('已更新');
    await App.renderCurrentPage();
  },

  /** 确认删除 */
  async confirmDelete(id) {
    const list = await Store.getInventory();
    const item = list.find(i => i.id === id);
    if (!item) return;
    const ok = await Notify.confirm('删除商品', `确定删除商品「${item.name}」吗？`);
    if (ok) {
      await Store.deleteInventoryItem(id);
      Notify.toast('已删除');
      await App.renderCurrentPage();
    }
  },

  /** 关闭弹窗 */
  closeModal() {
    document.getElementById('invModal')?.remove();
  }
};
