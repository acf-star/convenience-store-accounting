/**
 * 报表分析模块
 */
const Report = {
  currentPeriod: 'month',

  /** 渲染报表页面 */
  async render() {
    const stats = await this.getStats(this.currentPeriod);
    this._lastStats = stats;

    return `
      <div class="tabs">
        <button class="tab ${this.currentPeriod === 'today' ? 'tab--active' : ''}" onclick="Report.setPeriod('today')">今日</button>
        <button class="tab ${this.currentPeriod === 'week' ? 'tab--active' : ''}" onclick="Report.setPeriod('week')">本周</button>
        <button class="tab ${this.currentPeriod === 'month' ? 'tab--active' : ''}" onclick="Report.setPeriod('month')">本月</button>
        <button class="tab ${this.currentPeriod === 'year' ? 'tab--active' : ''}" onclick="Report.setPeriod('year')">本年</button>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__label">总收入</div>
          <div class="stat-card__value stat-card__value--income">¥${Utils.formatMoney(stats.income)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">总支出</div>
          <div class="stat-card__value stat-card__value--expense">¥${Utils.formatMoney(stats.expense)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">利润</div>
          <div class="stat-card__value stat-card__value--profit">¥${Utils.formatMoney(stats.profit)}</div>
        </div>
      </div>

      <div class="card">
        <div class="card__title">收支趋势</div>
        <div class="chart-container">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card__title">支出分类占比</div>
        <div class="chart-container">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card__title">收入分类占比</div>
        <div class="chart-container">
          <canvas id="incomeCategoryChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="card__title" style="margin-bottom:0">数据导出</div>
        </div>
        <button class="btn btn--outline btn--block mb-8" onclick="Report.exportTransactions()">导出交易记录 (CSV)</button>
        <button class="btn btn--outline btn--block" onclick="Report.exportAll()">导出全部数据 (JSON)</button>
      </div>
    `;
  },

  /** 设置时间维度 */
  async setPeriod(period) {
    this.currentPeriod = period;
    await App.renderCurrentPage();
  },

  /** 获取统计数据 */
  async getStats(period) {
    let dateFrom;
    switch (period) {
      case 'today': dateFrom = Utils.today(); break;
      case 'week': dateFrom = Utils.getWeekStart(); break;
      case 'month': dateFrom = Utils.getMonthStart(); break;
      case 'year': dateFrom = Utils.getYearStart(); break;
      default: dateFrom = Utils.getMonthStart();
    }

    try {
      const transactions = await Transaction.getFiltered({
        dateFrom,
        dateTo: Utils.today()
      });

      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      return { transactions, income, expense, profit: income - expense };
    } catch (e) {
      Notify.toast('加载报表数据失败', 'error');
      return { transactions: [], income: 0, expense: 0, profit: 0 };
    }
  },

  /** 渲染图表（在 DOM 插入后调用） */
  async renderCharts() {
    const stats = this._lastStats || await this.getStats(this.currentPeriod);
    this._lastStats = null;
    this.renderTrendChart(stats);
    this.renderCategoryChart(stats, 'expense', 'categoryChart');
    this.renderCategoryChart(stats, 'income', 'incomeCategoryChart');
  },

  /** 获取当前主题的图表配色 */
  _chartColors() {
    const style = getComputedStyle(document.documentElement);
    const text = style.getPropertyValue('--text-secondary').trim() || '#6B6B6B';
    const muted = style.getPropertyValue('--text-muted').trim() || '#A0A0A0';
    const border = style.getPropertyValue('--border').trim() || '#E8E6E1';
    const income = style.getPropertyValue('--income').trim() || '#16A34A';
    const expense = style.getPropertyValue('--expense').trim() || '#DC2626';
    return { text, muted, border, income, expense };
  },

  /** 渲染趋势图 */
  renderTrendChart(stats) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const c = this._chartColors();

    const dailyData = {};
    stats.transactions.forEach(t => {
      if (!dailyData[t.date]) dailyData[t.date] = { income: 0, expense: 0 };
      dailyData[t.date][t.type] += t.amount;
    });

    const dates = Object.keys(dailyData).sort();
    const incomeData = dates.map(d => dailyData[d].income);
    const expenseData = dates.map(d => dailyData[d].expense);

    if (this._trendChart) this._trendChart.destroy();
    this._trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dates.map(d => Utils.formatDate(d)),
        datasets: [
          {
            label: '收入',
            data: incomeData,
            borderColor: c.income,
            backgroundColor: c.income + '12',
            fill: true,
            tension: 0.4,
            borderWidth: 1.5,
            pointRadius: 2,
            pointBackgroundColor: c.income
          },
          {
            label: '支出',
            data: expenseData,
            borderColor: c.expense,
            backgroundColor: c.expense + '12',
            fill: true,
            tension: 0.4,
            borderWidth: 1.5,
            pointRadius: 2,
            pointBackgroundColor: c.expense
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.muted, padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { family: "'DM Sans', sans-serif", size: 12 } }
          }
        },
        scales: {
          x: {
            ticks: { color: c.muted, maxTicksLimit: 8, font: { family: "'DM Sans', sans-serif", size: 11 } },
            grid: { color: c.border + '40' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: c.muted, font: { family: "'DM Sans', sans-serif", size: 11 } },
            grid: { color: c.border + '40' }
          }
        }
      }
    });
  },

  /** 渲染分类饼图 */
  renderCategoryChart(stats, type, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = this._chartColors();
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-elevated').trim() || '#FFFFFF';

    const filtered = stats.transactions.filter(t => t.type === type);
    const categoryTotals = {};
    filtered.forEach(t => {
      const cat = Category.getById(t.category);
      const name = cat ? cat.name : '未分类';
      const color = cat ? cat.color : '#607D8B';
      if (!categoryTotals[name]) categoryTotals[name] = { amount: 0, color };
      categoryTotals[name].amount += t.amount;
    });

    const entries = Object.entries(categoryTotals).sort((a, b) => b[1].amount - a[1].amount);
    if (entries.length === 0) return;

    const key = type === 'expense' ? '_expenseChart' : '_incomeChart';
    if (this[key]) this[key].destroy();

    this[key] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: entries.map(([name]) => name),
        datasets: [{
          data: entries.map(([, v]) => v.amount),
          backgroundColor: entries.map(([, v]) => v.color + 'cc'),
          borderColor: bgColor,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.muted, padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { family: "'DM Sans', sans-serif", size: 12 } }
          }
        }
      }
    });
  },

  /** 导出交易记录 CSV */
  async exportTransactions() {
    const transactions = await Store.getTransactions();
    const data = transactions.map(t => {
      const cat = Category.getById(t.category);
      return {
        日期: t.date,
        类型: t.type === 'income' ? '收入' : '支出',
        金额: t.amount,
        分类: cat ? cat.name : '未分类',
        商品名: t.productName || '',
        备注: t.note || '',
        记录人: t.recordedBy || ''
      };
    });
    Utils.exportCSV(data, `交易记录_${Utils.today()}.csv`);
  },

  /** 导出全部数据 JSON */
  async exportAll() {
    const backup = await Store.backup();
    Utils.exportJSON(backup, `便利店数据备份_${Utils.today()}.json`);
  }
};
