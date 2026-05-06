/**
 * 工具函数模块
 */
const Utils = {
  /** 生成唯一 ID */
  genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  /** 获取今天的日期字符串 YYYY-MM-DD（本地时间） */
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /** 格式化金额 */
  formatMoney(amount) {
    return Number(amount).toFixed(2);
  },

  /** 格式化日期显示 */
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  /** 获取本周起始日期（周一，本地时间） */
  getWeekStart() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /** 获取本月起始日期 */
  getMonthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  },

  /** 获取本年起始日期 */
  getYearStart() {
    return `${new Date().getFullYear()}-01-01`;
  },

  /** 数组按日期分组 */
  groupByDate(items, dateField = 'date') {
    const groups = {};
    items.forEach(item => {
      const date = item[dateField];
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  },

  /** 导出为 CSV */
  exportCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const BOM = '﻿';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** 导出 JSON */
  exportJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** 解析导入的文件 */
  importFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch {
          reject(new Error('文件格式错误'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  },

  /** 简单 debounce */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};
