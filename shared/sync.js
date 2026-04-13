/**
 * Lightweight server sync for Russian trainers.
 *
 * Usage:
 *   <script src="/shared/sync.js"></script>
 *
 *   // After page load, call once:
 *   initSync("tenses", loadState, (serverState) => { ... merge ... });
 *
 *   // After each saveState(), call:
 *   syncToServer(state);
 */

const SYNC_BASE = "/api/russian";
let _syncTrainerId = null;
let _syncDebounceTimer = null;

/**
 * Initialize server sync for a trainer.
 * @param {string} trainerId - One of: tenses, possessives, colours, plurals
 * @param {Function} getCurrentState - Returns current local state object
 * @param {Function} onServerState - Called with server state if it's newer
 */
function initSync(trainerId, getCurrentState, onServerState) {
  _syncTrainerId = trainerId;

  // Fetch server state on load
  fetch(`${SYNC_BASE}/${trainerId}/progress`)
    .then((res) => (res.ok ? res.json() : null))
    .then((serverState) => {
      if (!serverState) return;
      const local = getCurrentState();
      // If server has more answers, use server state
      if (
        serverState.totalAnswered > (local.totalAnswered || 0) ||
        (serverState.updatedAt && local.savedAt && serverState.updatedAt > local.savedAt)
      ) {
        onServerState(serverState);
      }
    })
    .catch(() => {
      // Offline or server unavailable — silent
    });
}

/**
 * Debounced sync of state to server. Call after every saveState().
 * @param {object} state - The full trainer state
 */
function syncToServer(state) {
  if (!_syncTrainerId) return;

  clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(() => {
    fetch(`${SYNC_BASE}/${_syncTrainerId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {
      // Offline — will sync on next page load
    });
  }, 2000);
}
