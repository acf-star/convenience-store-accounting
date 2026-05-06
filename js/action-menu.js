/**
 * 更多操作菜单
 */
const ActionMenu = {
  /** 切换菜单 */
  toggle(trigger) {
    const dropdown = trigger.nextElementSibling;
    const isOpen = dropdown.classList.contains('action-menu__dropdown--open');

    // 先关闭所有菜单
    this.closeAll();

    if (!isOpen) {
      dropdown.classList.add('action-menu__dropdown--open');
    }
  },

  /** 关闭当前菜单 */
  close() {
    this.closeAll();
  },

  /** 关闭所有菜单 */
  closeAll() {
    document.querySelectorAll('.action-menu__dropdown--open').forEach(d => {
      d.classList.remove('action-menu__dropdown--open');
    });
  }
};

// 点击空白处关闭菜单
document.addEventListener('click', (e) => {
  if (!e.target.closest('.action-menu')) {
    ActionMenu.closeAll();
  }
});
