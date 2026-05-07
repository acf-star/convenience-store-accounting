/**
 * 主入口模块 - 初始化、路由、页面渲染
 */
const App = {
  currentPage: 'transaction',

  /** 初始化 */
  async init() {
    if (SupabaseConfig.SUPABASE_URL.includes('YOUR_PROJECT')) {
      document.body.innerHTML = `
        <div class="login-page">
          <div class="login-card">
            <div class="login-card__title">🏪 便利店记账</div>
            <div style="color:var(--warning);font-size:14px;text-align:center;margin:16px 0">
              请先配置 Supabase<br>
              <span style="font-size:12px;color:var(--text-muted)">编辑 js/supabase-config.js，填入你的项目 URL 和 Key</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    try {
      SupabaseConfig.init();

      const session = await SupabaseConfig.getSession();
      if (!session) {
        this.showLogin();
        return;
      }

      await this.startApp();
    } catch (e) {
      document.body.innerHTML = `
        <div class="login-page">
          <div class="login-card">
            <div class="login-card__title">🏪 便利店记账</div>
            <div style="color:var(--expense);font-size:14px;text-align:center;margin:16px 0">
              初始化失败：${e.message}
            </div>
          </div>
        </div>
      `;
    }
  },

  /** 显示登录页 */
  showLogin() {
    document.body.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-card__title">🏪 便利店记账</div>
          <div class="login-card__subtitle">多人共享记账系统</div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" id="loginEmail" placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" id="loginPassword" placeholder="密码">
          </div>
          <div id="loginError" style="color:var(--expense);font-size:13px;min-height:20px;margin-bottom:8px"></div>
          <button class="btn btn--primary btn--block" onclick="App.doLogin()">登录</button>
        </div>
      </div>
    `;
  },

  /** 执行登录 */
  async doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
      errorEl.textContent = '请输入邮箱和密码';
      return;
    }

    try {
      errorEl.textContent = '';
      await SupabaseConfig.login(email, password);
      await this.startApp();
    } catch (e) {
      errorEl.textContent = e.message || '登录失败';
    }
  },

  /** 登录成功后启动应用 */
  async startApp() {
    // 设置默认用户名
    if (!SupabaseConfig.getCurrentUser()) {
      SupabaseConfig.setCurrentUser('店员');
    }

    // 渲染主界面骨架
    document.body.innerHTML = `
      <header class="header">
        <div class="header__title">记账</div>
        <div class="header__summary" id="headerSummary"></div>
      </header>
      <main class="page page--active" id="pageContent"></main>
      <button class="fab" id="fabBtn" onclick="Transaction.showForm()">+</button>
      <nav class="nav">
        <button class="nav__item nav__item--active" data-page="transaction">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          <span>记账</span>
        </button>
        <button class="nav__item" data-page="inventory">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
          </svg>
          <span>库存</span>
        </button>
        <button class="nav__item" data-page="report">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
          <span>报表</span>
        </button>
        <button class="nav__item" data-page="settings">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span>设置</span>
        </button>
      </nav>
    `;

    await Category.init();
    this.bindNav();
    await this.navigate('transaction');
    await this.updateHeaderSummary();
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
  async navigate(page) {
    this.currentPage = page;

    document.querySelectorAll('.nav__item').forEach(btn => {
      btn.classList.toggle('nav__item--active', btn.dataset.page === page);
    });

    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = page === 'transaction' ? 'flex' : 'none';

    await this.renderCurrentPage();
  },

  /** 渲染当前页面 */
  async renderCurrentPage() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    let html = '';
    switch (this.currentPage) {
      case 'transaction':
        html = await Transaction.render();
        break;
      case 'inventory':
        html = await Inventory.render();
        break;
      case 'report':
        html = await Report.render();
        break;
      case 'settings':
        html = this.renderSettings();
        break;
    }

    container.innerHTML = html;
    container.classList.remove('page--entering');
    void container.offsetWidth;
    container.classList.add('page--entering');

    if (this.currentPage === 'report') {
      setTimeout(() => Report.renderCharts(), 50);
    }
  },

  /** 更新顶部概览 */
  async updateHeaderSummary() {
    const todayTx = await Transaction.getFiltered({ dateFrom: Utils.today(), dateTo: Utils.today() });
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
    const currentUser = SupabaseConfig.getCurrentUser();
    return `
      <div class="card">
        <div class="card__title">当前用户</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" id="settingsUserName" value="${currentUser}" placeholder="你的姓名" style="flex:1">
          <button class="btn btn--primary btn--small" onclick="App.saveUserName()">保存</button>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">记账时会自动标记为你的名字</div>
      </div>

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

      <div class="card">
        <button class="btn btn--outline btn--block" onclick="App.doLogout()">退出登录</button>
      </div>
    `;
  },

  /** 保存用户名 */
  saveUserName() {
    const name = document.getElementById('settingsUserName').value.trim();
    if (!name) { Notify.toast('请输入姓名', 'error'); return; }
    SupabaseConfig.setCurrentUser(name);
    Notify.toast(`已切换为「${name}」`);
  },

  /** 导入数据 */
  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const ok = await Notify.confirm('导入数据', '导入将覆盖现有数据，确定继续吗？');
    if (!ok) { event.target.value = ''; return; }

    try {
      const data = await Utils.importFile(file);
      await Store.restore(data);
      await Category.loadFromDB();
      Notify.toast('数据导入成功');
      await this.renderCurrentPage();
      await this.updateHeaderSummary();
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

    await Store.clearAll();
    await Category.init();
    await this.renderCurrentPage();
    await this.updateHeaderSummary();
    Notify.toast('数据已清空');
  },

  /** 退出登录 */
  async doLogout() {
    const ok = await Notify.confirm('退出登录', '确定要退出登录吗？');
    if (!ok) return;
    await SupabaseConfig.logout();
    this.showLogin();
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => App.init());
