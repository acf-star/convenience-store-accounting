# 便利店收出支记账工具

## 项目简介
纯前端便利店记账工具，支持收支记录、分类管理、库存关联、报表分析。

## 技术栈
- HTML/CSS/JavaScript（无框架，原生开发）
- Chart.js（CDN 引入，图表渲染）
- localStorage（数据持久化）

## 目录结构
```
├── index.html          # 主页面
├── css/style.css       # 样式
├── js/
│   ├── app.js          # 主入口，初始化 + 路由
│   ├── store.js        # 数据层（localStorage 封装）
│   ├── transaction.js  # 记账模块
│   ├── category.js     # 分类管理模块
│   ├── inventory.js    # 库存管理模块
│   ├── report.js       # 报表分析模块
│   └── utils.js        # 工具函数
```

## 开发规范
- 所有函数使用 JSDoc 注释
- 模块间通过全局对象 `App` 通信，不直接互相引用
- CSS 使用 BEM 命名规范
- 数据格式统一用 ISO 字符串（YYYY-MM-DD）

## 验证方式
浏览器直接打开 index.html 即可运行，无需构建。
