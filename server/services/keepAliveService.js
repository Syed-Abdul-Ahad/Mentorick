/**
 * Pings GET /health every 5 minutes so hosted runtimes stay warm.
 * Uses SERVER_URL when set; otherwise http://127.0.0.1:$PORT.
 * Failures are logged only — never throws into the main app.
 */

const INTERVAL_MS = 5 * 60 * 1000;

let timer = null;

function resolveHealthUrl() {
  const base = (process.env.SERVER_URL || '').toString().trim().replace(/\/$/, '');
  if (base) return `${base}/health`;

  const port = process.env.PORT || 5000;
  return `http://127.0.0.1:${port}/health`;
}

async function pingHealth() {
  const url = resolveHealthUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[keep-alive] ${url} → HTTP ${res.status}`);
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[keep-alive] ok ${url}`);
    }
  } catch (err) {
    console.warn(`[keep-alive] ping failed: ${err.message || err}`);
  }
}

function startKeepAliveScheduler() {
  if (timer) return;

  const url = resolveHealthUrl();
  console.log(`[keep-alive] starting — ping ${url} every 5 minutes`);

  // First ping shortly after boot (skip immediate race with listen)
  setTimeout(() => {
    pingHealth();
  }, 15000);

  timer = setInterval(pingHealth, INTERVAL_MS);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}

function stopKeepAliveScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  startKeepAliveScheduler,
  stopKeepAliveScheduler,
  pingHealth,
};
