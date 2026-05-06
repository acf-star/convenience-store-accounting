/**
 * 记账模块
 */
const Transaction = {
  currentType: 'income',

  /** 渲染记账页面 — 概览 + 最近记录 */
  render() {
    const todayTx = this.getFiltered({ dateFrom: Utils.today(), dateTo: Utils.today() });
    const todayIncome = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const todayExpense = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const todayProfit = todayIncome - todayExpense;

    return `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__label">收入</div>
          <div class="stat-card__value stat-card__value--income">¥${Utils.formatMoney(todayIncome)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">支出</div>
          <div class="stat-card__value stat-card__value--expense">¥${Utils.formatMoney(todayExpense)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">利润</div>
          <div class="stat-card__value stat-card__value--profit">¥${Utils.formatMoney(todayProfit)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card__title">交易记录</div>
        <div class="filter-bar">
          <label class="filter-label">从</label>
          <input type="date" id="filterDateFrom" value="${Utils.getMonthStart()}" onchange="Transaction.applyFilter()">
          <label class="filter-label">到</label>
          <input type="date" id="filterDateTo" value="${Utils.today()}" onchange="Transaction.applyFilter()">
          <select id="filterCategory" onchange="Transaction.applyFilter()">
            <option value="">全部</option>
            ${Category.renderSelect('')}
          </select>
        </div>
        <div id="transactionList"></div>
      </div>
    `;
  },

  /** 显示记账表单弹窗 */
  showForm() {
    this.currentType = 'income';
    const html = `
      <div class="modal-overlay" id="txFormModal">
        <div class="modal">
          <div class="modal__title">记一笔</div>
          <div class="type-switch">
            <button class="type-switch__btn type-switch__btn--income active" onclick="Transaction.setType('income')">收入</button>
            <button class="type-switch__btn type-switch__btn--expense" onclick="Transaction.setType('expense')">支出</button>
          </div>
          <div class="form-group">
            <label>金额</label>
            <div class="quick-amounts">
              ${[1, 3, 5, 10, 20, 50].map(a => `<button class="quick-amount" onclick="document.getElementById('txAmount').value=${a}">${a}</button>`).join('')}
            </div>
            <input type="number" id="txAmount" placeholder="0.00" step="0.01" min="0" autofocus>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>商品</label>
              <input type="text" id="txProduct" placeholder="可口可乐">
            </div>
            <div class="form-group">
              <label>日期</label>
              <input type="date" id="txDate" value="${Utils.today()}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select id="txCategory">${Category.renderSelect()}</select>
            </div>
            <div class="form-group">
              <label>备注</label>
              <input type="text" id="txNote" placeholder="可选">
            </div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Transaction.closeForm()">取消</button>
            <button class="btn btn--primary" onclick="Transaction.save()">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  /** 关闭记账表单 */
  closeForm() {
    document.getElementById('txFormModal')?.remove();
  },

  /** 设置收支类型 */
  setType(type) {
    this.currentType = type;
    const modal = document.getElementById('txFormModal');
    if (!modal) return;
    modal.querySelectorAll('.type-switch__btn').forEach(btn => btn.classList.remove('active'));
    modal.querySelector(`.type-switch__btn--${type}`).classList.add('active');
  },

  /** 保存交易 */
  save() {
    const amount = parseFloat(document.getElementById('txAmount').value);
    if (!amount || amount <= 0) { Notify.toast('请输入有效金额', 'error'); return; }

    const tx = {
      id: Utils.genId(),
      date: document.getElementById('txDate').value || Utils.today(),
      type: this.currentType,
      amount,
      category: document.getElementById('txCategory').value,
      productName: document.getElementById('txProduct').value.trim(),
      note: document.getElementById('txNote').value.trim(),
      inventoryId: null
    };

    Store.addTransaction(tx);
    this.closeForm();
    Notify.toast(`已记录 ${tx.type === 'income' ? '收入' : '支出'} ¥${Utils.formatMoney(amount)}`);
    this.refreshList();
    App.updateHeaderSummary();
  },

  /** 按条件筛选交易 */
  getFiltered({ dateFrom, dateTo, category, keyword } = {}) {
    let list = Store.getTransactions();
    if (dateFrom) list = list.filter(t => t.date >= dateFrom);
    if (dateTo) list = list.filter(t => t.date <= dateTo);
    if (category) list = list.filter(t => t.category === category);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(t =>
        (t.productName && t.productName.toLowerCase().includes(kw)) ||
        (t.note && t.note.toLowerCase().includes(kw))
      );
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  },

  /** 应用筛选 */
  applyFilter() {
    this.refreshList();
  },

  /** 刷新交易列表 */
  refreshList() {
    const container = document.getElementById('transactionList');
    if (!container) return;

    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo = document.getElementById('filterDateTo')?.value;
    const category = document.getElementById('filterCategory')?.value;

    const filtered = this.getFiltered({ dateFrom, dateTo, category });
    container.innerHTML = this.renderList(filtered);
  },

  /** 渲染交易列表 HTML */
  renderList(transactions) {
    if (transactions.length === 0) {
      return '<div class="empty"><div class="empty__icon">📝</div>暂无交易记录</div>';
    }

    const grouped = Utils.groupByDate(transactions);
    return grouped.map(([date, items]) => {
      const dateLabel = date === Utils.today() ? '今天' : Utils.formatDate(date);
      const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      return `
        <div class="mb-12">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:13px;font-weight:600">${dateLabel}</span>
            <span style="font-size:12px;color:var(--text-muted)">
              收 <span class="text-income">${Utils.formatMoney(dayIncome)}</span>
              支 <span class="text-expense">${Utils.formatMoney(dayExpense)}</span>
            </span>
          </div>
          <ul class="transaction-list">
            ${items.map(t => this.renderItem(t)).join('')}
          </ul>
        </div>
      `;
    }).join('');
  },

  /** 渲染单条交易 */
  renderItem(tx) {
    const cat = Category.getById(tx.category);
    const icon = cat ? cat.icon : '📦';
    const color = cat ? cat.color : '#607D8B';
    const catName = cat ? cat.name : '未分类';
    const sign = tx.type === 'income' ? '+' : '-';
    const amountClass = tx.type === 'income' ? 'transaction-item__amount--income' : 'transaction-item__amount--expense';

    return `
      <li class="transaction-item">
        <div class="transaction-item__icon" style="background:${color}20;color:${color}">${icon}</div>
        <div class="transaction-item__info">
          <div class="transaction-item__name">${tx.productName || catName}</div>
          <div class="transaction-item__meta">${catName}${tx.note ? ' · ' + tx.note : ''}</div>
        </div>
        <div class="transaction-item__amount ${amountClass}">${sign}¥${Utils.formatMoney(tx.amount)}</div>
        <div class="action-menu">
          <button class="action-menu__trigger" onclick="ActionMenu.toggle(this)">⋯</button>
          <div class="action-menu__dropdown">
            <button class="action-menu__item" onclick="ActionMenu.close();Transaction.edit('${tx.id}')">编辑</button>
            <button class="action-menu__item action-menu__item--danger" onclick="ActionMenu.close();Transaction.confirmDelete('${tx.id}')">删除</button>
          </div>
        </div>
      </li>
    `;
  },

  /** 编辑交易 */
  edit(id) {
    const tx = Store.getTransactions().find(t => t.id === id);
    if (!tx) return;

    const html = `
      <div class="modal-overlay" id="txEditModal">
        <div class="modal">
          <div class="modal__title">编辑交易</div>
          <div class="type-switch">
            <button class="type-switch__btn type-switch__btn--income ${tx.type === 'income' ? 'active' : ''}" onclick="Transaction.editType='income';this.parentElement.querySelectorAll('.type-switch__btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">收入</button>
            <button class="type-switch__btn type-switch__btn--expense ${tx.type === 'expense' ? 'active' : ''}" onclick="Transaction.editType='expense';this.parentElement.querySelectorAll('.type-switch__btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">支出</button>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>金额</label>
              <input type="number" id="editAmount" value="${tx.amount}" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label>日期</label>
              <input type="date" id="editDate" value="${tx.date}">
            </div>
          </div>
          <div class="form-group">
            <label>商品名称</label>
            <input type="text" id="editProduct" value="${tx.productName || ''}">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select id="editCategory">${Category.renderSelect(tx.category)}</select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input type="text" id="editNote" value="${tx.note || ''}">
          </div>
          <div class="modal__actions">
            <button class="btn btn--outline" onclick="Transaction.closeEditModal()">取消</button>
            <button class="btn btn--primary" onclick="Transaction.saveEdit('${id}')">保存</button>
          </div>
        </div>
      </div>
    `;
    this.editType = tx.type;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  editType: 'income',

  /** 保存编辑 */
  saveEdit(id) {
    const amount = parseFloat(document.getElementById('editAmount').value);
    if (!amount || amount <= 0) { Notify.toast('请输入有效金额', 'error'); return; }

    Store.updateTransaction(id, {
      date: document.getElementById('editDate').value,
      type: this.editType,
      amount,
      category: document.getElementById('editCategory').value,
      productName: document.getElementById('editProduct').value.trim(),
      note: document.getElementById('editNote').value.trim()
    });

    this.closeEditModal();
    Notify.toast('已更新');
    this.refreshList();
    App.updateHeaderSummary();
  },

  /** 确认删除 */
  async confirmDelete(id) {
    const ok = await Notify.confirm('删除交易', '确定要删除这笔交易记录吗？');
    if (ok) {
      Store.deleteTransaction(id);
      Notify.toast('已删除');
      this.refreshList();
      App.updateHeaderSummary();
    }
  },

  /** 关闭编辑弹窗 */
  closeEditModal() {
    document.getElementById('txEditModal')?.remove();
  }
};
