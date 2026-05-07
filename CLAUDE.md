# 便利店记账

## 项目简介
多人共享便利店记账工具，支持收支记录、分类管理、库存关联、报表分析。
数据存储在 Supabase 云端，多人通过同一账号登录，通过姓名区分记录人。

## 技术栈
- HTML/CSS/JavaScript（无框架，原生开发）
- Chart.js 4.x（CDN 引入，图表渲染，配色动态读取 CSS 变量适配主题）
- Supabase（云端 PostgreSQL 数据库 + 认证）
- GitHub Actions → GitHub Pages 自动部署（push 到 main 触发）

## 目录结构
```
├── index.html              # 主页面（SPA，无路由框架）
├── css/style.css           # 全部样式（CSS 变量 + BEM 命名）
├── js/
│   ├── app.js              # 主入口：登录、初始化、路由、设置页
│   ├── supabase-config.js  # Supabase 客户端初始化与认证
│   ├── store.js            # 数据层（Supabase CRUD 封装，全部 async）
│   ├── transaction.js      # 记账模块（增删改查、筛选）
│   ├── category.js         # 分类管理（CRUD + 缓存机制 + 预设 6 个默认分类）
│   ├── inventory.js        # 库存管理（进货/销售自动关联交易）
│   ├── report.js           # 报表分析（Chart.js 趋势图 + 饼图）
│   ├── notify.js           # Toast 通知 + 确认弹窗（Promise）
│   ├── action-menu.js      # 下拉操作菜单组件
│   └── utils.js            # 工具函数（ID 生成、日期、金额格式化、导入导出）
└── .github/workflows/deploy.yml  # GitHub Pages 部署
```

## Supabase 配置
1. 在 https://supabase.com 注册并创建项目
2. 在 Dashboard → Settings → API 获取 `Project URL` 和 `anon public key`
3. 编辑 `js/supabase-config.js`，替换 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
4. 在 Dashboard → SQL Editor 中执行以下建表 SQL：

```sql
create table categories (
  id text primary key,
  name text not null,
  icon text default '📦',
  color text default '#607D8B'
);

create table inventory (
  id text primary key,
  name text not null,
  category_id text references categories(id),
  purchase_price real default 0,
  selling_price real default 0,
  stock integer default 0,
  alert_threshold integer default 5
);

create table transactions (
  id text primary key,
  date text not null,
  type text not null,
  amount real not null,
  category text references categories(id),
  product_name text,
  note text,
  inventory_id text,
  recorded_by text
);

alter table categories enable row level security;
alter table inventory enable row level security;
alter table transactions enable row level security;

create policy "allow all" on categories for all using (true) with check (true);
create policy "allow all" on inventory for all using (true) with check (true);
create policy "allow all" on transactions for all using (true) with check (true);
```

5. 在 Dashboard → Authentication 中创建一个共用账号（邮箱 + 密码）

## 设计规范
- 主题：浅色纸白底（`#FAF9F7`）+ 暗色模式（`#0F0F0F`），通过 `prefers-color-scheme` 切换
- 字体：Newsreader（衬线，标题）+ DM Sans（正文），Google Fonts CDN
- 图标：导航用 SVG 线条图标，分类用 emoji
- 边框：1px 细线分隔，无毛玻璃、无重阴影
- CSS 变量集中在 `:root` 和 `@media (prefers-color-scheme: dark)` 中定义

## 开发规范
- 所有函数使用 JSDoc 注释
- Store 层所有方法为 async，返回 Promise
- Category 模块使用缓存机制：`loadFromDB()` 异步加载，`getAll()`/`getById()` 同步读缓存
- CSS 使用 BEM 命名规范
- 数据格式统一用 ISO 字符串（YYYY-MM-DD，本地时间）
- Chart.js 图表配色通过 `getComputedStyle` 读取 CSS 变量，确保主题一致

## 验证方式
浏览器直接打开 index.html 即可运行（需要先配置 Supabase）。
本地开发可用任意静态文件服务器，如 `npx serve .`。

## 部署
push 到 `main` 分支自动触发 GitHub Actions 部署到 GitHub Pages，无需 build 步骤。
