/**
 * Supabase 配置与认证
 *
 * 使用前需要：
 * 1. 在 https://supabase.com 注册并创建项目
 * 2. 将下方 SUPABASE_URL 和 SUPABASE_ANON_KEY 替换为你的项目值
 * 3. 在 Supabase Dashboard 的 SQL Editor 中执行建表 SQL（见 CLAUDE.md）
 */
const SupabaseConfig = {
  SUPABASE_URL: 'https://wbwjzwsegcdaggmrnoqx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_5PO_QMxkl6zQB2BS5guMAA_CSDMDZSz',

  client: null,

  /** 初始化 Supabase 客户端 */
  init() {
    this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
  },

  /** 登录 */
  async login(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /** 登出 */
  async logout() {
    await this.client.auth.signOut();
    localStorage.removeItem('csa_current_user');
  },

  /** 获取当前登录状态 */
  async getSession() {
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  },

  /** 获取当前用户名 */
  getCurrentUser() {
    return localStorage.getItem('csa_current_user') || '';
  },

  /** 设置当前用户名 */
  setCurrentUser(name) {
    localStorage.setItem('csa_current_user', name);
  }
};
