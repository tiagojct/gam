// Runs before first paint: apply the remembered family and mode, if any.
// Everything is wrapped so a missing or blocked localStorage changes nothing;
// the stylesheet then falls back to Pequod following the system scheme.
(function () {
  try {
    var raw = localStorage.getItem('gam-theme');
    if (!raw) return;
    var t = JSON.parse(raw);
    var root = document.documentElement;
    if (t && typeof t.family === 'string' && /^[a-z-]+$/.test(t.family)) root.setAttribute('data-family', t.family);
    if (t && (t.mode === 'dark' || t.mode === 'light')) root.setAttribute('data-mode', t.mode);
  } catch (e) { /* no storage: render with defaults */ }
})();
