/**
 * Shared utility functions for Russian language trainers.
 *
 * Usage: <script src="/shared/utils.js"></script> before the app script,
 * or import individual functions if using ES modules.
 */

/* ─── String helpers ──────────────────────────────────────── */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[ch];
  });
}

/* ─── Array helpers ───────────────────────────────────────── */

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ─── Math helpers ────────────────────────────────────────── */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* ─── Time formatting ─────────────────────────────────────── */

function formatSeconds(ms) {
  if (!ms) return "0.0s";
  const seconds = ms / 1000;
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatStudyTime(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

/* ─── localStorage helpers ────────────────────────────────── */

function loadStateFromStorage(key, defaultState, migrateFn) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return migrateFn ? migrateFn(parsed, defaultState) : { ...structuredClone(defaultState), ...parsed };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveStateToStorage(key, state) {
  try {
    state.savedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

/* ─── Phase banner (shared UI) ────────────────────────────── */

function showPhaseBanner(fromTitle, toTitle) {
  const banner = document.createElement("div");
  banner.className = "phase-banner";
  banner.innerHTML = `<strong>${escapeHtml(fromTitle)} complete</strong><span>Advancing to ${escapeHtml(toTitle)}</span>`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("is-visible"));
  setTimeout(() => {
    banner.classList.remove("is-visible");
    setTimeout(() => banner.remove(), 400);
  }, 2800);
}

/* ─── Keyboard shortcut helpers ───────────────────────────── */

function setupMCQKeyboardShortcuts({ getOptions, submitAnswer, isCurrentSolved, onNext, onToggleHint, onTogglePause }) {
  document.addEventListener("keydown", (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
    const key = event.key;

    if (key >= "1" && key <= "9" && !isCurrentSolved()) {
      const buttons = getOptions();
      const index = parseInt(key) - 1;
      if (index < buttons.length) {
        event.preventDefault();
        submitAnswer(buttons[index].dataset.option);
      }
    }

    if ((key === "Enter" || key === " ") && isCurrentSolved()) {
      event.preventDefault();
      onNext();
    }

    if (key === "h" && !isCurrentSolved() && onToggleHint) {
      onToggleHint();
    }

    if (key === "p" && !isCurrentSolved() && onTogglePause) {
      onTogglePause();
    }
  });
}
