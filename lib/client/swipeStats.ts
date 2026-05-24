const FLUSH_THRESHOLD = 10;
const MAX_PER_FLUSH   = 500;
const ENDPOINT        = "/api/stats/swipes";
const LS_BUF_KEY      = "cindr_sb";
const SS_COUNTED_KEY  = "cindr_sc";

interface SwipeBuf {
  left:  number;
  right: number;
  up:    number;
  total: number;
}

const mem: SwipeBuf = { left: 0, right: 0, up: 0, total: 0 };
let listenersAttached = false;

// ── Persistence helpers ────────────────────────────────────────────────────

function loadBuf(): SwipeBuf {
  try {
    const raw = localStorage.getItem(LS_BUF_KEY);
    if (!raw) return { left: 0, right: 0, up: 0, total: 0 };
    const parsed = JSON.parse(raw) as Partial<SwipeBuf>;
    return {
      left:  Number(parsed.left)  || 0,
      right: Number(parsed.right) || 0,
      up:    Number(parsed.up)    || 0,
      total: Number(parsed.total) || 0,
    };
  } catch {
    return { left: 0, right: 0, up: 0, total: 0 };
  }
}

function saveBuf(buf: SwipeBuf): void {
  try {
    localStorage.setItem(LS_BUF_KEY, JSON.stringify(buf));
  } catch {
    // storage blocked (private mode, quota) — silently ignore
  }
}

function clearBuf(): void {
  try { localStorage.removeItem(LS_BUF_KEY); } catch { /* ignore */ }
}

function isSessionCounted(): boolean {
  try { return sessionStorage.getItem(SS_COUNTED_KEY) === "1"; } catch { return false; }
}

function markSessionCounted(): void {
  try { sessionStorage.setItem(SS_COUNTED_KEY, "1"); } catch { /* ignore */ }
}

// ── Flush ──────────────────────────────────────────────────────────────────

function buildPayload(buf: SwipeBuf, newSession: boolean): string {
  return JSON.stringify({
    left:       Math.min(buf.left,  MAX_PER_FLUSH),
    right:      Math.min(buf.right, MAX_PER_FLUSH),
    up:         Math.min(buf.up,    MAX_PER_FLUSH),
    newSession,
  });
}

function flushSync(buf: SwipeBuf, newSession: boolean): void {
  if (buf.left + buf.right + buf.up === 0 && !newSession) return;
  try {
    navigator.sendBeacon(ENDPOINT, new Blob([buildPayload(buf, newSession)], { type: "application/json" }));
  } catch {
    // fallback: fire-and-forget fetch (may not survive unload but better than nothing)
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: buildPayload(buf, newSession), keepalive: true }).catch(() => { /* silent */ });
  }
}

async function flushAsync(buf: SwipeBuf, newSession: boolean): Promise<void> {
  if (buf.left + buf.right + buf.up === 0 && !newSession) return;
  try {
    await fetch(ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    buildPayload(buf, newSession),
    });
  } catch {
    // network failure — restore buf so counts aren't lost
    mem.left  += buf.left;
    mem.right += buf.right;
    mem.up    += buf.up;
    mem.total += buf.total;
    saveBuf(mem);
  }
}

// ── Attach page-lifecycle listeners (once) ────────────────────────────────

function attachListeners(): void {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    const snap = { ...mem };
    const ns   = false; // session already counted if we got here
    mem.left = mem.right = mem.up = mem.total = 0;
    clearBuf();
    flushSync(snap, ns);
  });

  window.addEventListener("beforeunload", () => {
    const snap = { ...mem };
    mem.left = mem.right = mem.up = mem.total = 0;
    clearBuf();
    flushSync(snap, false);
  });
}

// ── Init: recover any unflushed buffer from a previous page load ──────────

function init(): void {
  if (typeof window === "undefined") return;
  attachListeners();
  const persisted = loadBuf();
  if (persisted.total > 0) {
    // Flush leftover from last session immediately (no newSession — already counted then)
    void flushAsync(persisted, false);
    clearBuf();
  }
}

// Run init once when the module is first imported
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export function recordSwipe(direction: "left" | "right" | "up"): void {
  if (typeof window === "undefined") return;

  mem[direction] += 1;
  mem.total      += 1;

  // Mark this session as active the first time total crosses 3
  let newSession = false;
  if (mem.total === 3 && !isSessionCounted()) {
    markSessionCounted();
    newSession = true;
  }

  saveBuf(mem);

  if (newSession || mem.total % FLUSH_THRESHOLD === 0) {
    const snap = { ...mem };
    mem.left = mem.right = mem.up = mem.total = 0;
    clearBuf();
    void flushAsync(snap, newSession);
  }
}
