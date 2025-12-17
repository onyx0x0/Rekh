// Global debug toggle for console chatter
window.APP_DEBUG = false;

(function() {
  if (window.APP_DEBUG) return;
  const noop = function() {};
  ['log', 'debug', 'info'].forEach((method) => {
    if (typeof console !== 'undefined' && typeof console[method] === 'function') {
      console[method] = noop;
    }
  });
})();

