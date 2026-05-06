/**
 * 通知模块 - Toast + 自定义确认弹窗
 */
const Notify = {
  /** 显示 toast 提示 */
  toast(message, type = 'success', duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--show'));
    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /** 自定义确认弹窗，返回 Promise<boolean> */
  confirm(title, message = '') {
    return new Promise(resolve => {
      const html = `
        <div class="modal-overlay" id="confirmModal">
          <div class="modal" style="max-width:340px">
            <div class="modal__title">${title}</div>
            ${message ? `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">${message}</p>` : ''}
            <div class="modal__actions">
              <button class="btn btn--outline" id="confirmCancel">取消</button>
              <button class="btn btn--primary" id="confirmOk">确定</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);

      const cleanup = (result) => {
        document.getElementById('confirmModal')?.remove();
        resolve(result);
      };

      document.getElementById('confirmCancel').onclick = () => cleanup(false);
      document.getElementById('confirmOk').onclick = () => cleanup(true);
      document.getElementById('confirmModal').onclick = (e) => {
        if (e.target.id === 'confirmModal') cleanup(false);
      };
    });
  }
};
