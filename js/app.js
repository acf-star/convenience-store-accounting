/**
 * 主入口模块 - 初始化、路由、页面渲染
 */
const App = {
  currentPage: 'transaction',

  /** 初始化 */
  init() {
    Category.init();
    this.bindNav();
    this.navigate('transaction');
    this.updateHeaderSummary();
  },

  /** 绑定底部导航 */
  bindNav() {
    document.querySelectorAll('.nav__item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.page);
      });
    });
  },

  /** 导航到指定页面 */
  navigate(page) {
    this.currentPage = page;

    // 更新导航高亮
    document.querySelectorAll('.nav__item').forEach(btn => {
      btn.classList.toggle('nav__item--active', btn.dataset.page === page);
    });

    // 控制 FAB 显示
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = page === 'transaction' ? 'flex' : 'none';

    this.renderCurrentPage();
  },

  /** 渲染当前页面 */
  renderCurrentPage() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    let html = '';
    switch (this.currentPage) {
      case 'transaction':
        html = Transaction.render();
        break;
      case 'inventory':
        html = Inventory.render();
        break;
      case 'report':
        html = Report.render();
        break;
      case 'settings':
        html = this.renderSettings();
        break;
    }

    container.innerHTML = html;
    container.classList.remove('page--entering');
    void container.offsetWidth; // 触发 reflow
    container.classList.add('page--entering');

    if (this.currentPage === 'transaction') {
      Transaction.refreshList();
    }
    if (this.currentPage === 'report') {
      setTimeout(() => Report.renderCharts(), 50);
    }
  },

  /** 更新顶部概览 */
  updateHeaderSummary() {
    const todayTx = Transaction.getFiltered({ dateFrom: Utils.today(), dateTo: Utils.today() });
    const income = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const el = document.getElementById('headerSummary');
    if (el) {
      el.innerHTML = `
        <span>收 <strong>¥${Utils.formatMoney(income)}</strong></span>
        <span>支 <strong>¥${Utils.formatMoney(expense)}</strong></span>
        <span>利 <strong>¥${Utils.formatMoney(income - expense)}</strong></span>
      `;
    }
  },

  /** 渲染设置页面 */
  renderSettings() {
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="card__title" style="margin-bottom:0">分类管理</div>
          <button class="btn btn--primary btn--small" onclick="Category.showAddModal()">+ 添加</button>
        </div>
        <div id="categoryListContainer">${Category.renderList()}</div>
      </div>

      <div class="card">
        <div class="card__title">数据管理</div>
        <button class="btn btn--outline btn--block mb-8" onclick="Report.exportTransactions()">导出交易记录 (CSV)</button>
        <button class="btn btn--outline btn--block mb-8" onclick="Report.exportAll()">备份全部数据 (JSON)</button>
        <label class="btn btn--outline btn--block mb-8" style="cursor:pointer">
          导入数据 (JSON)
          <input type="file" accept=".json" style="display:none" onchange="App.importData(event)">
        </label>
        <button class="btn btn--danger btn--block" onclick="App.clearAllData()">清空所有数据</button>
      </div>
    `;
  },

  /** 导入数据 */
  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const ok = await Notify.confirm('导入数据', '导入将覆盖现有数据，确定继续吗？');
    if (!ok) { event.target.value = ''; return; }

    try {
      const data = await Utils.importFile(file);
      Store.restore(data);
      Notify.toast('数据导入成功');
      this.renderCurrentPage();
      this.updateHeaderSummary();
    } catch (e) {
      Notify.toast('导入失败: ' + e.message, 'error');
    }
    event.target.value = '';
  },

  /** 清空所有数据 */
  async clearAllData() {
    const ok1 = await Notify.confirm('清空数据', '确定要清空所有数据吗？此操作不可恢复！');
    if (!ok1) return;
    const ok2 = await Notify.confirm('再次确认', '真的要删除所有数据吗？');
    if (!ok2) return;

    localStorage.removeItem(Store.KEYS.TRANSACTIONS);
    localStorage.removeItem(Store.KEYS.CATEGORIES);
    localStorage.removeItem(Store.KEYS.INVENTORY);

    Category.init();
    this.renderCurrentPage();
    this.updateHeaderSummary();
    Notify.toast('数据已清空');
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => App.init());
