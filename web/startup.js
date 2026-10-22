// Runs independently of the application so a loading error is not mistaken for caching.
(() => {
  function failed(message) {
    const error = document.getElementById('error');
    error.hidden = false;
    error.textContent = `三维图启动失败：${message}。请通过“启动 AeroScatter.command”打开网页，或把这条提示发给开发者。`;
    document.getElementById('offline-status').textContent = '主程序未就绪；这不是离线资源下载进度';
  }
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement) failed('无法读取 ' + event.target.getAttribute('src'));
    else if (event.message) failed(event.message);
  }, true);
  window.addEventListener('unhandledrejection', event => failed(event.reason?.message || String(event.reason)));
  setTimeout(() => {
    if (document.documentElement.dataset.appReady !== 'true') failed('程序未在 8 秒内完成初始化');
  }, 8000);
})();
