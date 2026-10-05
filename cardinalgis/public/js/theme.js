// Apply the saved light/dark choice before the page paints (avoids a flash).
try {
  const t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch { /* storage blocked */ }
