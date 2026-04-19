const STORAGE_KEY = "russian-sentence-coach-state-v2";
const LEGACY_STORAGE_KEY = "russian-sentence-coach-state-v1";
const REMOTE_PROGRESS_URL = "./api/progress";
const HVPT_API_BASE = "../hvpt/api";
const CLEAN_THRESHOLD = 98;
const HISTORY_LIMIT = 240;
const RECENT_WINDOW = 8;
const MIN_PREVIEW_SECONDS = 1;
const MAX_PREVIEW_SECONDS = 6;
const DEFAULT_PREVIEW_SECONDS = 3;
const MAX_HIDDEN_WORDS = 6;
const MIN_REPLAY_LIMIT = 1;
const MAX_REPLAY_LIMIT = 8;
const DEFAULT_REPLAY_LIMIT = 3;
const MAX_CUSTOM_SENTENCES = 1000;
const MASTERED_AVERAGE_ACCURACY = 96;
const MASTERED_MIN_ATTEMPTS = 3;
const MODE_ORDER = ["copy", "flash", "listen"];
const SOURCE_ORDER = ["custom", "hvpt"];
const NO_SPACE_BEFORE = new Set([",", ".", "!", "?", ";", ":"]);
const STOPWORDS = new Set([
  "а","в","во","и","из","как","мне","мы","на","не","но","она","они","с","ты","у","я",
]);

const MODE_META = {
  copy: {
    label: "See",
    title: "Visible sentence",
    summary: "Type what you see.",
  },
  flash: {
    label: "Flash",
    title: "Preview + recall",
    summary: "Memorize in the preview, then type from memory.",
  },
  listen: {
    label: "Listen",
    title: "Audio only",
    summary: "Listen, then type what you heard.",
  },
};

const elements = {
  startButton: document.getElementById("start-button"),
  heroSessionActions: document.getElementById("hero-session-actions"),
  pauseButton: document.getElementById("pause-button"),
  nextButton: document.getElementById("next-button"),
  resetButton: document.getElementById("reset-button"),
  resetMenu: document.querySelector(".hero-menu"),
  coverageCount: document.getElementById("coverage-count"),
  coverageDetail: document.getElementById("coverage-detail"),
  recentTrend: document.getElementById("recent-trend"),
  recentTrendDetail: document.getElementById("recent-trend-detail"),
  statusPill: document.getElementById("status-pill"),
  countdownPill: document.getElementById("countdown-pill"),
  promptStage: document.getElementById("prompt-stage"),
  englishGloss: document.getElementById("english-gloss"),
  sentenceDisplay: document.getElementById("sentence-display"),
  hiddenWordsRow: document.getElementById("hidden-words-row"),
  audioStage: document.getElementById("audio-stage"),
  audioPlayButton: document.getElementById("audio-play"),
  audioReplayInfo: document.getElementById("audio-replay-info"),
  audioPlayer: document.getElementById("audio-player"),
  sentenceInput: document.getElementById("sentence-input"),
  liveTimer: document.getElementById("live-timer"),
  attemptErrors: document.getElementById("attempt-errors"),
  currentStreak: document.getElementById("current-streak"),
  feedbackMessage: document.getElementById("feedback-message"),
  layoutHint: document.getElementById("layout-hint"),
  practiceActions: document.querySelector(".practice-actions"),
  entryPanel: document.getElementById("entry-panel"),
  scoreButton: document.getElementById("score-button"),
  clearButton: document.getElementById("clear-button"),
  resultCard: document.getElementById("result-card"),
  resultSummary: document.getElementById("result-summary"),
  resultTitle: document.getElementById("result-title"),
  resultBody: document.getElementById("result-body"),
  resultMetrics: document.getElementById("result-metrics"),
  resultDiff: document.getElementById("result-diff"),
  advanceButton: document.getElementById("advance-button"),
  replayCurrentButton: document.getElementById("replay-button"),
  sessionBadge: document.getElementById("session-badge"),
  sessionAttempts: document.getElementById("session-attempts"),
  sessionCleanRate: document.getElementById("session-clean-rate"),
  sessionAverageAccuracy: document.getElementById("session-average-accuracy"),
  sessionAverageAccuracyDetail: document.getElementById("session-average-accuracy-detail"),
  sessionAverageSpeed: document.getElementById("session-average-speed"),
  sessionBestStreak: document.getElementById("session-best-streak"),
  lifetimeAverageAccuracy: document.getElementById("lifetime-average-accuracy"),
  lifetimeAverageSpeed: document.getElementById("lifetime-average-speed"),
  lifetimeTotals: document.getElementById("lifetime-totals"),
  focusSentences: document.getElementById("focus-sentences"),
  settingsRow: document.getElementById("settings-row"),
  flashWordsSetting: document.getElementById("flash-words-setting"),
  previewSetting: document.getElementById("preview-setting"),
  replaySetting: document.getElementById("replay-setting"),
  missingMinus: document.getElementById("missing-minus"),
  missingPlus: document.getElementById("missing-plus"),
  missingCount: document.getElementById("missing-count"),
  previewMinus: document.getElementById("preview-minus"),
  previewPlus: document.getElementById("preview-plus"),
  previewSeconds: document.getElementById("preview-seconds"),
  replayMinus: document.getElementById("replay-minus"),
  replayPlus: document.getElementById("replay-plus"),
  replayLimit: document.getElementById("replay-limit"),
  modeButtons: Array.from(document.querySelectorAll(".mode-chip[data-mode]")),
  sourceButtons: Array.from(document.querySelectorAll(".source-tab[data-source]")),
  orderButtons: Array.from(document.querySelectorAll(".order-chip[data-order]")),
  hvptPicker: document.getElementById("hvpt-picker"),
  hvptDeckSelect: document.getElementById("hvpt-deck-select"),
  hvptGroupSelect: document.getElementById("hvpt-group-select"),
  hvptStatus: document.getElementById("hvpt-status"),
  addForm: document.getElementById("add-form"),
  addRussian: document.getElementById("add-russian"),
  addEnglish: document.getElementById("add-english"),
  addButton: document.getElementById("add-button"),
  addHint: document.getElementById("add-hint"),
  libraryCount: document.getElementById("library-count"),
  libraryQueue: document.getElementById("library-queue"),
  libraryEmpty: document.getElementById("library-empty"),
  sentenceList: document.getElementById("sentence-list"),
};

let state = loadState();
let session = createSession();
let currentAttempt = null;
let queuedSentenceKey = "";
let liveInterval = 0;
let remoteSaveChain = Promise.resolve();
let keyboardOpen = false;
let visualViewportBaseline = window.visualViewport?.height || window.innerHeight;
let speechVoice = null;
let speechVoicesLoaded = false;
const hvpt = {
  loading: false,
  loaded: false,
  error: "",
  decks: [],
};

// ───────── state helpers ─────────

function createAggregateStats() {
  return { attempts: 0, totalAccuracy: 0, totalWpm: 0, totalMs: 0, cleanAttempts: 0 };
}

function createSentenceModeStats() {
  return { attempts: 0, totalAccuracy: 0, totalWpm: 0, lastSeenAt: 0, bestAccuracy: 0 };
}

function createSentenceStats() {
  const byMode = {};
  MODE_ORDER.forEach((mode) => {
    byMode[mode] = createSentenceModeStats();
  });
  return { attempts: 0, totalAccuracy: 0, bestAccuracy: 0, lastSeenAt: 0, byMode };
}

function createDefaultState(now = Date.now()) {
  const byMode = {};
  MODE_ORDER.forEach((mode) => {
    byMode[mode] = createAggregateStats();
  });

  return {
    version: 2,
    createdAt: now,
    updatedAt: now,
    settings: {
      mode: "copy",
      hiddenWordCount: 1,
      previewSeconds: DEFAULT_PREVIEW_SECONDS,
      replayLimit: DEFAULT_REPLAY_LIMIT,
      sourceKind: "custom",
      hvptDeckId: "",
      hvptGroupId: "",
      orderMode: "shuffle",
    },
    totals: createAggregateStats(),
    history: [],
    byMode,
    bySentence: {},
    customSentences: [],
  };
}

function createSession() {
  return {
    attempts: 0,
    totalAccuracy: 0,
    totalWpm: 0,
    cleanAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    sequentialIndex: 0,
  };
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function coerceMode(value, fallback = "copy") {
  if (typeof value !== "string") return fallback;
  if (MODE_ORDER.includes(value)) return value;
  if (value === "single" || value === "multi") return "flash";
  return fallback;
}

function normalizeKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[^A-Za-z0-9._:\-]/g, "").slice(0, 160);
}

function copyAggregateStats(target, source) {
  if (!source || typeof source !== "object") return;
  target.attempts = Math.max(0, numberOr(source.attempts, target.attempts));
  target.totalAccuracy = Math.max(0, numberOr(source.totalAccuracy, target.totalAccuracy));
  target.totalWpm = Math.max(0, numberOr(source.totalWpm, target.totalWpm));
  target.totalMs = Math.max(0, numberOr(source.totalMs, target.totalMs));
  target.cleanAttempts = Math.max(0, numberOr(source.cleanAttempts, target.cleanAttempts));
}

function foldAggregateStats(target, source) {
  if (!source || typeof source !== "object") return;
  target.attempts += Math.max(0, numberOr(source.attempts, 0));
  target.totalAccuracy += Math.max(0, numberOr(source.totalAccuracy, 0));
  target.totalWpm += Math.max(0, numberOr(source.totalWpm, 0));
  target.totalMs += Math.max(0, numberOr(source.totalMs, 0));
  target.cleanAttempts += Math.max(0, numberOr(source.cleanAttempts, 0));
}

function sanitizeHistory(items, fallbackNow = Date.now()) {
  if (!Array.isArray(items)) return [];
  const cleaned = [];
  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const key = normalizeKey(item.sentenceKey || item.sentenceId);
    if (!key) return;
    cleaned.push({
      sentenceKey: key,
      mode: coerceMode(item.mode, "copy"),
      accuracy: clamp(numberOr(item.accuracy, 0), 0, 100),
      wpm: Math.max(0, numberOr(item.wpm, 0)),
      timeMs: Math.max(0, numberOr(item.timeMs, 0)),
      errors: Math.max(0, numberOr(item.errors, 0)),
      clean: Boolean(item.clean),
      at: Math.max(0, numberOr(item.at, fallbackNow)),
    });
  });
  return cleaned.slice(-HISTORY_LIMIT);
}

function sanitizeSentenceStats(source) {
  const target = createSentenceStats();
  if (!source || typeof source !== "object") return target;
  target.attempts = Math.max(0, numberOr(source.attempts, 0));
  target.totalAccuracy = Math.max(0, numberOr(source.totalAccuracy, 0));
  target.bestAccuracy = clamp(numberOr(source.bestAccuracy, 0), 0, 100);
  target.lastSeenAt = Math.max(0, numberOr(source.lastSeenAt, 0));
  const byMode = source.byMode || {};
  MODE_ORDER.forEach((mode) => {
    const modeSource = byMode[mode];
    const modeTarget = target.byMode[mode];
    if (modeSource && typeof modeSource === "object") {
      modeTarget.attempts = Math.max(0, numberOr(modeSource.attempts, 0));
      modeTarget.totalAccuracy = Math.max(0, numberOr(modeSource.totalAccuracy, 0));
      modeTarget.totalWpm = Math.max(0, numberOr(modeSource.totalWpm, 0));
      modeTarget.lastSeenAt = Math.max(0, numberOr(modeSource.lastSeenAt, 0));
      modeTarget.bestAccuracy = clamp(numberOr(modeSource.bestAccuracy, 0), 0, 100);
    }
  });
  // Fold legacy single/multi into flash.
  ["single", "multi"].forEach((legacy) => {
    const legacySource = byMode[legacy];
    if (!legacySource || typeof legacySource !== "object") return;
    const flash = target.byMode.flash;
    flash.attempts += Math.max(0, numberOr(legacySource.attempts, 0));
    flash.totalAccuracy += Math.max(0, numberOr(legacySource.totalAccuracy, 0));
    flash.totalWpm += Math.max(0, numberOr(legacySource.totalWpm, 0));
    flash.lastSeenAt = Math.max(flash.lastSeenAt, numberOr(legacySource.lastSeenAt, 0));
    flash.bestAccuracy = Math.max(flash.bestAccuracy, clamp(numberOr(legacySource.bestAccuracy, 0), 0, 100));
  });
  return target;
}

function sanitizeBySentence(items) {
  const result = {};
  if (!items || typeof items !== "object") return result;
  Object.entries(items).forEach(([rawKey, value]) => {
    const key = normalizeKey(rawKey);
    if (!key) return;
    if (!value || typeof value !== "object") return;
    result[key] = sanitizeSentenceStats(value);
  });
  return result;
}

function sanitizeCustomSentences(items, fallbackNow = Date.now()) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const cleaned = [];
  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const id = normalizeKey(item.id);
    if (!id || seen.has(id)) return;
    const text = String(item.text || "").trim().slice(0, 500);
    if (!text) return;
    const english = String(item.english || "").trim().slice(0, 500);
    const createdAt = Math.max(0, numberOr(item.createdAt, fallbackNow));
    const updatedAt = Math.max(createdAt, numberOr(item.updatedAt, fallbackNow));
    cleaned.push({ id, text, english, createdAt, updatedAt });
    seen.add(id);
  });
  return cleaned.slice(0, MAX_CUSTOM_SENTENCES);
}

function sanitizeState(parsed, fallbackNow = Date.now()) {
  const base = createDefaultState(fallbackNow);
  if (!parsed || typeof parsed !== "object") return base;

  base.createdAt = Math.max(0, numberOr(parsed.createdAt, base.createdAt));
  base.updatedAt = Math.max(0, numberOr(parsed.updatedAt, base.updatedAt));

  const settings = parsed.settings || {};
  base.settings.mode = coerceMode(settings.mode, base.settings.mode);
  const hiddenSource = Number.isFinite(settings.hiddenWordCount)
    ? settings.hiddenWordCount
    : settings.multiHiddenCount;
  base.settings.hiddenWordCount = clamp(
    numberOr(hiddenSource, base.settings.hiddenWordCount),
    1,
    MAX_HIDDEN_WORDS,
  );
  base.settings.previewSeconds = clamp(
    numberOr(settings.previewSeconds, base.settings.previewSeconds),
    MIN_PREVIEW_SECONDS,
    MAX_PREVIEW_SECONDS,
  );
  base.settings.replayLimit = clamp(
    numberOr(settings.replayLimit, base.settings.replayLimit),
    MIN_REPLAY_LIMIT,
    MAX_REPLAY_LIMIT,
  );
  if (settings.sourceKind === "custom" || settings.sourceKind === "hvpt") {
    base.settings.sourceKind = settings.sourceKind;
  }
  const deckId = normalizeKey(settings.hvptDeckId);
  base.settings.hvptDeckId = deckId || "";
  const groupId = normalizeKey(settings.hvptGroupId);
  base.settings.hvptGroupId = groupId || "";
  if (settings.orderMode === "shuffle" || settings.orderMode === "sequential") {
    base.settings.orderMode = settings.orderMode;
  }

  copyAggregateStats(base.totals, parsed.totals);
  base.history = sanitizeHistory(parsed.history, fallbackNow);

  const parsedByMode = parsed.byMode || {};
  MODE_ORDER.forEach((mode) => {
    copyAggregateStats(base.byMode[mode], parsedByMode[mode]);
  });
  // Fold legacy single/multi lane totals into flash.
  ["single", "multi"].forEach((legacy) => {
    foldAggregateStats(base.byMode.flash, parsedByMode[legacy]);
  });

  base.bySentence = sanitizeBySentence(parsed.bySentence);
  base.customSentences = sanitizeCustomSentences(parsed.customSentences, fallbackNow);
  return base;
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultState(0);
    return sanitizeState(JSON.parse(raw), 0);
  } catch (error) {
    return createDefaultState(0);
  }
}

function persistLocalState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // ignore
  }
}

function cloneStateSnapshot(source) {
  if (typeof structuredClone === "function") return structuredClone(source);
  return JSON.parse(JSON.stringify(source));
}

async function requestRemoteState(method = "GET", payload = null) {
  const response = await window.fetch(REMOTE_PROGRESS_URL, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    keepalive: method === "PUT",
    headers: {
      Accept: "application/json",
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (!response.ok) throw new Error(`Remote sync failed with status ${response.status}`);
  return response.json();
}

function queueRemoteSave(snapshot = cloneStateSnapshot(state)) {
  if (typeof window.fetch !== "function") return;
  remoteSaveChain = remoteSaveChain
    .catch(() => undefined)
    .then(async () => {
      const remote = sanitizeState(await requestRemoteState("PUT", snapshot));
      if (remote.updatedAt >= state.updatedAt && !currentAttempt) {
        state = remote;
        persistLocalState();
        render();
      }
    })
    .catch(() => undefined);
}

async function syncStateFromServer() {
  if (typeof window.fetch !== "function") return;
  try {
    const remote = sanitizeState(await requestRemoteState());
    if (remote.updatedAt > state.updatedAt) {
      if (!currentAttempt && session.attempts === 0) {
        state = remote;
        persistLocalState();
        render();
      }
      return;
    }
    if (state.updatedAt > remote.updatedAt) queueRemoteSave();
  } catch (error) {
    // ignore
  }
}

function saveState() {
  try {
    state.updatedAt = Date.now();
    persistLocalState();
    queueRemoteSave();
  } catch (error) {
    // ignore
  }
}

// ───────── HVPT source ─────────

async function loadHvpt() {
  if (hvpt.loading) return;
  hvpt.loading = true;
  renderHvptPicker();
  try {
    const response = await window.fetch(`${HVPT_API_BASE}/bootstrap`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HVPT bootstrap failed (${response.status})`);
    const payload = await response.json();
    hvpt.decks = Array.isArray(payload.decks) ? payload.decks : [];
    hvpt.loaded = true;
    hvpt.error = "";
  } catch (error) {
    hvpt.error = error.message || "Could not load HVPT decks.";
    hvpt.loaded = false;
  } finally {
    hvpt.loading = false;
    renderHvptPicker();
    render();
  }
}

function getHvptDeck(id = state.settings.hvptDeckId) {
  if (!hvpt.loaded) return null;
  if (id) {
    const match = hvpt.decks.find((deck) => deck.id === id);
    if (match) return match;
  }
  return hvpt.decks[0] || null;
}

function getHvptGroup(deck, id = state.settings.hvptGroupId) {
  if (!deck || !id) return null;
  return (deck.groups || []).find((group) => group.id === id) || null;
}

function getHvptPhrases() {
  const deck = getHvptDeck();
  if (!deck) return [];
  const phrases = Array.isArray(deck.phrases) ? deck.phrases : [];
  const group = getHvptGroup(deck);
  if (!group) return phrases;
  const byId = new Map(phrases.map((phrase) => [phrase.id, phrase]));
  return (group.phraseIds || []).map((id) => byId.get(id)).filter(Boolean);
}

function hvptPhraseToSentence(phrase) {
  return {
    key: `hvpt:${phrase.id}`,
    id: phrase.id,
    text: String(phrase.text || "").trim(),
    english: String(phrase.note || "").trim(),
    source: "hvpt",
    audioUrl: phrase.recordingUrl || "",
    phrase,
  };
}

function customSentenceToSentence(custom) {
  return {
    key: `custom:${custom.id}`,
    id: custom.id,
    text: custom.text,
    english: custom.english || "",
    source: "custom",
    audioUrl: "",
    custom,
  };
}

function getActiveSentences() {
  if (state.settings.sourceKind === "hvpt") {
    return getHvptPhrases().filter((phrase) => String(phrase.text || "").trim()).map(hvptPhraseToSentence);
  }
  return state.customSentences.map(customSentenceToSentence);
}

function getSentenceByKey(key) {
  if (!key) return null;
  return getActiveSentences().find((sentence) => sentence.key === key) || null;
}

// ───────── text + scoring helpers ─────────

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let row = 0; row < rows; row += 1) grid[row][0] = row;
  for (let col = 0; col < cols; col += 1) grid[0][col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      grid[row][col] = Math.min(
        grid[row - 1][col] + 1,
        grid[row][col - 1] + 1,
        grid[row - 1][col - 1] + cost,
      );
    }
  }
  return grid[a.length][b.length];
}

function buildEditGrid(expectedChars, actualChars) {
  const rows = expectedChars.length + 1;
  const cols = actualChars.length + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let row = 0; row < rows; row += 1) grid[row][0] = row;
  for (let col = 0; col < cols; col += 1) grid[0][col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = expectedChars[row - 1] === actualChars[col - 1] ? 0 : 1;
      grid[row][col] = Math.min(
        grid[row - 1][col] + 1,
        grid[row][col - 1] + 1,
        grid[row - 1][col - 1] + cost,
      );
    }
  }
  return grid;
}

function buildCharacterDiff(expectedText, actualText) {
  const expectedChars = Array.from(expectedText || "");
  const actualChars = Array.from(actualText || "");
  const grid = buildEditGrid(expectedChars, actualChars);
  const operations = [];
  let row = expectedChars.length;
  let col = actualChars.length;
  while (row > 0 || col > 0) {
    if (
      row > 0 &&
      col > 0 &&
      grid[row][col] ===
        grid[row - 1][col - 1] + (expectedChars[row - 1] === actualChars[col - 1] ? 0 : 1)
    ) {
      operations.push({
        type: expectedChars[row - 1] === actualChars[col - 1] ? "match" : "replace",
        expected: expectedChars[row - 1],
        actual: actualChars[col - 1],
      });
      row -= 1;
      col -= 1;
      continue;
    }
    if (row > 0 && grid[row][col] === grid[row - 1][col] + 1) {
      operations.push({ type: "delete", expected: expectedChars[row - 1], actual: "" });
      row -= 1;
      continue;
    }
    operations.push({ type: "insert", expected: "", actual: actualChars[col - 1] });
    col -= 1;
  }
  return operations.reverse();
}

function renderDiffChar(character, className) {
  const value = character ? escapeHtml(character).replaceAll(" ", "&nbsp;") : "·";
  return `<span class="diff-char ${className}">${value}</span>`;
}

function buildDiffHtml(expectedText, actualText) {
  const operations = buildCharacterDiff(expectedText, actualText);
  const expectedLine = operations
    .map((op) => {
      if (op.type === "match") return renderDiffChar(op.expected, "is-match");
      if (op.type === "replace") return renderDiffChar(op.expected, "is-miss");
      if (op.type === "delete") return renderDiffChar(op.expected, "is-gap");
      return renderDiffChar("", "is-gap");
    })
    .join("");
  const actualLine = operations
    .map((op) => {
      if (op.type === "match") return renderDiffChar(op.actual, "is-match");
      if (op.type === "replace") return renderDiffChar(op.actual, "is-miss");
      if (op.type === "insert") return renderDiffChar(op.actual, "is-miss");
      return renderDiffChar("", "is-gap");
    })
    .join("");
  return `
    <div class="diff-row">
      <div class="diff-label">Correct</div>
      <p class="diff-line">${expectedLine}</p>
    </div>
    <div class="diff-row">
      <div class="diff-label">Typed</div>
      <p class="diff-line">${actualLine}</p>
    </div>
  `;
}

function tokenizeSentence(text) {
  const values = text.match(/[\p{L}\p{M}\p{N}-]+|[^\s\p{L}\p{M}\p{N}-]+/gu) || [];
  return values.map((value) => ({ value, isWord: /[\p{L}\p{M}\p{N}]/u.test(value) }));
}

function needsSpaceBefore(token) {
  return !NO_SPACE_BEFORE.has(token);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSentenceHtml(tokens, hiddenIndexes = [], { reveal = false, highlightHidden = false } = {}) {
  const hiddenSet = new Set(hiddenIndexes);
  let html = "";
  tokens.forEach((token, index) => {
    if (index > 0 && needsSpaceBefore(token.value)) html += " ";
    if (token.isWord && hiddenSet.has(index) && !reveal) {
      html += `<span class="masked-word" style="--letters:${Math.max(token.value.length, 2)}"></span>`;
      return;
    }
    const classes = [];
    if (token.isWord && hiddenSet.has(index) && highlightHidden) classes.push("token-highlight");
    const classAttribute = classes.length ? ` class="${classes.join(" ")}"` : "";
    html += `<span${classAttribute}>${escapeHtml(token.value)}</span>`;
  });
  return html;
}

function pickRandomItems(items, count) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
}

function pickHiddenIndexes(tokens, requestedCount) {
  const wordIndexes = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.isWord);
  if (!wordIndexes.length) return [];
  const safeCount = clamp(requestedCount, 1, Math.max(1, wordIndexes.length - 1));
  const primary = wordIndexes.filter(({ token }) => {
    const normalized = normalizeText(token.value);
    return token.value.length > 3 && !STOPWORDS.has(normalized);
  });
  const secondary = wordIndexes.filter(({ token }) => token.value.length > 2);
  const tertiary = wordIndexes;
  const chosen = [];
  [primary, secondary, tertiary].forEach((pool) => {
    const unused = pool.filter(({ index }) => !chosen.some((item) => item.index === index));
    pickRandomItems(unused, safeCount - chosen.length).forEach((item) => {
      if (chosen.length < safeCount) chosen.push(item);
    });
  });
  return chosen.slice(0, safeCount).map(({ index }) => index).sort((a, b) => a - b);
}

function getCurrentElapsedMs() {
  if (!currentAttempt) return 0;
  if (currentAttempt.phase === "typing") {
    return currentAttempt.elapsedMs + (Date.now() - currentAttempt.timerStartedAt);
  }
  return currentAttempt.elapsedMs;
}

function stopLiveInterval() {
  if (liveInterval) {
    window.clearInterval(liveInterval);
    liveInterval = 0;
  }
}

function ensureLiveInterval() {
  if (!liveInterval) liveInterval = window.setInterval(tickAttempt, 100);
}

function tickAttempt() {
  if (!currentAttempt) {
    stopLiveInterval();
    return;
  }
  if (currentAttempt.phase === "preview") {
    currentAttempt.remainingPreviewMs = Math.max(0, currentAttempt.previewEndsAt - Date.now());
    if (currentAttempt.remainingPreviewMs === 0) {
      beginTypingPhase();
      return;
    }
  }
  if (currentAttempt.phase !== "preview" && currentAttempt.phase !== "typing") {
    stopLiveInterval();
  }
  renderPracticePanel();
}

function average(total, attempts) {
  return attempts ? total / attempts : 0;
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function formatWholePercent(value) {
  return `${Math.round(value)}%`;
}

function formatWpm(value) {
  return `${value.toFixed(1)} WPM`;
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatStudyTime(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function formatRepCount(attempts) {
  return `${attempts} rep${attempts === 1 ? "" : "s"}`;
}

function getAverageAccuracy(stats) {
  return average(stats.totalAccuracy, stats.attempts);
}

function getAverageWpm(stats) {
  return average(stats.totalWpm, stats.attempts);
}

function getMasteryPercent(stats) {
  return clamp(Math.round(getAverageAccuracy(stats)), 0, 100);
}

function getSentenceSection(stats) {
  if (!stats.attempts) return "new";
  if (stats.attempts >= MASTERED_MIN_ATTEMPTS && getAverageAccuracy(stats) >= MASTERED_AVERAGE_ACCURACY) {
    return "mastered";
  }
  return "progress";
}

function getSentenceStatsEntry(key) {
  if (!key) return createSentenceStats();
  return state.bySentence[key] || createSentenceStats();
}

function getSentenceStatsForView(key, mode = getMode()) {
  const stats = getSentenceStatsEntry(key);
  return stats.byMode[mode] || createSentenceModeStats();
}

function computeTrend() {
  const history = state.history;
  if (history.length < RECENT_WINDOW) {
    return { label: "Waiting for attempts", detail: `Need ${RECENT_WINDOW} scored reps.` };
  }
  const recent = history.slice(-RECENT_WINDOW);
  const previous = history.slice(-(RECENT_WINDOW * 2), -RECENT_WINDOW);
  const recentAverage = average(
    recent.reduce((total, item) => total + item.accuracy, 0),
    recent.length,
  );
  if (!previous.length) {
    return {
      label: "First block complete",
      detail: `${formatPercent(recentAverage)} across the last ${recent.length} reps.`,
    };
  }
  const previousAverage = average(
    previous.reduce((total, item) => total + item.accuracy, 0),
    previous.length,
  );
  const delta = recentAverage - previousAverage;
  if (delta >= 2.5) return { label: "Sharpening", detail: `Accuracy up ${delta.toFixed(1)} points.` };
  if (delta <= -2.5) return { label: "Slipping", detail: `Accuracy down ${Math.abs(delta).toFixed(1)} points.` };
  return { label: "Stable", detail: `Within ${Math.abs(delta).toFixed(1)} points of the last block.` };
}

function getSessionBadge() {
  if (session.attempts < 3) return "Fresh run";
  const avgAccuracy = average(session.totalAccuracy, session.attempts);
  const avgWpm = average(session.totalWpm, session.attempts);
  if (avgAccuracy >= 97 && avgWpm >= 16) return "Locked in";
  if (avgAccuracy >= 93) return "Clean run";
  if (avgAccuracy >= 88) return "Settling in";
  return "Dig in";
}

// ───────── picker ─────────

function pickSentence() {
  const pool = getActiveSentences();
  if (!pool.length) return null;

  if (queuedSentenceKey) {
    const match = pool.find((s) => s.key === queuedSentenceKey);
    queuedSentenceKey = "";
    if (match) return match;
  }

  if (state.settings.orderMode === "sequential") {
    const index = session.sequentialIndex % pool.length;
    session.sequentialIndex = (session.sequentialIndex + 1) % pool.length;
    return pool[index];
  }

  const mode = getMode();
  const lastKey = currentAttempt?.sentence?.key || "";
  const ranked = pool.map((sentence) => {
    const stats = getSentenceStatsForView(sentence.key, mode);
    const avgAccuracy = getAverageAccuracy(stats);
    const avgWpm = getAverageWpm(stats);
    const freshness = stats.lastSeenAt ? Math.min((Date.now() - stats.lastSeenAt) / 60000, 240) : 80;
    let weight =
      (stats.attempts ? 0 : 18) +
      (100 - avgAccuracy) * 0.7 +
      Math.max(0, 18 - avgWpm) * 0.8 +
      freshness * 0.08;
    if (sentence.key === lastKey && pool.length > 1) weight *= 0.05;
    return { sentence, weight: Math.max(2, weight) };
  });
  const totalWeight = ranked.reduce((total, item) => total + item.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const item of ranked) {
    cursor -= item.weight;
    if (cursor <= 0) return item.sentence;
  }
  return ranked[0].sentence;
}

// ───────── audio ─────────

function stopAudio() {
  try {
    elements.audioPlayer.pause();
    elements.audioPlayer.currentTime = 0;
  } catch {}
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

function ensureSpeechVoice() {
  if (speechVoice || !("speechSynthesis" in window)) return speechVoice;
  const voices = window.speechSynthesis.getVoices();
  speechVoicesLoaded = voices.length > 0;
  const ruVoice = voices.find((voice) => /ru/i.test(voice.lang)) || null;
  speechVoice = ruVoice;
  return speechVoice;
}

function playSentenceAudio(sentence) {
  if (!sentence) return false;
  stopAudio();
  if (sentence.audioUrl) {
    try {
      const url = new URL(sentence.audioUrl, window.location.href).toString();
      elements.audioPlayer.src = url;
      const playPromise = elements.audioPlayer.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => speakSentence(sentence));
      }
      return true;
    } catch {
      return speakSentence(sentence);
    }
  }
  return speakSentence(sentence);
}

function speakSentence(sentence) {
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(sentence.text);
  utterance.lang = "ru-RU";
  ensureSpeechVoice();
  if (speechVoice) utterance.voice = speechVoice;
  utterance.rate = 0.9;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

function triggerAttemptAudio() {
  if (!currentAttempt || currentAttempt.mode !== "listen") return;
  const limit = state.settings.replayLimit;
  if (currentAttempt.playCount >= limit) return;
  currentAttempt.playCount += 1;
  currentAttempt.audioPlaying = true;
  playSentenceAudio(currentAttempt.sentence);
  if (currentAttempt.phase === "preview") beginTypingPhase();
  renderPracticePanel();
}

// ───────── attempts ─────────

function getMode() {
  return state.settings.mode;
}

function getHiddenCountForMode(mode = getMode()) {
  if (mode !== "flash") return 0;
  return clamp(state.settings.hiddenWordCount, 1, MAX_HIDDEN_WORDS);
}

function getPreviewSeconds() {
  return clamp(state.settings.previewSeconds, MIN_PREVIEW_SECONDS, MAX_PREVIEW_SECONDS);
}

function getReplayLimit() {
  return clamp(state.settings.replayLimit, MIN_REPLAY_LIMIT, MAX_REPLAY_LIMIT);
}

function getPreviewMs(mode = getMode()) {
  if (mode === "flash") return getPreviewSeconds() * 1000;
  return 0;
}

function createAttempt({ sentence = null, hiddenIndexes = null, mode = getMode() } = {}) {
  stopAudio();
  const pool = getActiveSentences();
  if (!pool.length) {
    currentAttempt = null;
    render();
    return;
  }
  const sentenceChoice = sentence || pickSentence();
  if (!sentenceChoice) {
    currentAttempt = null;
    render();
    return;
  }

  const hiddenCount = getHiddenCountForMode(mode);
  const tokens = tokenizeSentence(sentenceChoice.text);
  const previewMs = getPreviewMs(mode);

  const phase = mode === "copy" ? "typing" : "preview";
  currentAttempt = {
    sentence: sentenceChoice,
    mode,
    tokens,
    hiddenCount,
    hiddenIndexes: hiddenCount ? hiddenIndexes || pickHiddenIndexes(tokens, hiddenCount) : [],
    phase,
    previewEndsAt: mode === "flash" ? Date.now() + previewMs : 0,
    remainingPreviewMs: mode === "flash" ? previewMs : 0,
    elapsedMs: 0,
    timerStartedAt: mode === "copy" ? Date.now() : 0,
    errors: 0,
    result: null,
    playCount: 0,
    audioPlaying: false,
  };

  elements.sentenceInput.value = "";
  elements.sentenceInput.disabled = mode !== "copy";
  elements.layoutHint.classList.add("hidden");

  if (mode === "copy") {
    window.setTimeout(() => elements.sentenceInput.focus(), 0);
  } else {
    blurActiveElement();
  }

  if (mode === "listen") {
    // Auto-play the first time on a fresh listen attempt, then user can replay.
    window.setTimeout(() => triggerAttemptAudio(), 120);
  }

  ensureLiveInterval();
  render();
}

function beginTypingPhase() {
  if (!currentAttempt) return;
  currentAttempt.phase = "typing";
  currentAttempt.timerStartedAt = Date.now();
  currentAttempt.remainingPreviewMs = 0;
  elements.sentenceInput.disabled = false;
  window.setTimeout(() => elements.sentenceInput.focus(), 0);
  ensureLiveInterval();
  render();
}

function startOrResume() {
  if (!currentAttempt) {
    createAttempt();
    return;
  }
  if (currentAttempt.phase === "paused") {
    if (currentAttempt.pausedPhase === "preview") {
      currentAttempt.phase = "preview";
      currentAttempt.previewEndsAt = Date.now() + currentAttempt.remainingPreviewMs;
    } else {
      currentAttempt.phase = "typing";
      currentAttempt.timerStartedAt = Date.now();
      elements.sentenceInput.disabled = false;
      window.setTimeout(() => elements.sentenceInput.focus(), 0);
    }
    ensureLiveInterval();
    render();
    return;
  }
  if (currentAttempt.phase === "review") {
    createAttempt();
    return;
  }
  if (currentAttempt.phase === "typing") elements.sentenceInput.focus();
}

function pauseAttempt() {
  if (!currentAttempt) return;
  if (currentAttempt.phase === "typing") {
    currentAttempt.elapsedMs = getCurrentElapsedMs();
    currentAttempt.phase = "paused";
    currentAttempt.pausedPhase = "typing";
    elements.sentenceInput.disabled = true;
  } else if (currentAttempt.phase === "preview") {
    currentAttempt.remainingPreviewMs = Math.max(0, currentAttempt.previewEndsAt - Date.now());
    currentAttempt.phase = "paused";
    currentAttempt.pausedPhase = "preview";
  } else {
    return;
  }
  stopAudio();
  stopLiveInterval();
  blurActiveElement();
  render();
}

function nextSentence() {
  stopLiveInterval();
  stopAudio();
  createAttempt();
}

function replayCurrentSentence() {
  if (!currentAttempt) return;
  stopLiveInterval();
  stopAudio();
  createAttempt({
    sentence: currentAttempt.sentence,
    hiddenIndexes: currentAttempt.hiddenIndexes,
    mode: currentAttempt.mode,
  });
}

function resetProgress() {
  const confirmed = window.confirm("Reset all sentence progress on this device?");
  if (!confirmed) return;
  stopLiveInterval();
  stopAudio();
  const previous = state.customSentences;
  state = createDefaultState(Date.now());
  state.customSentences = sanitizeCustomSentences(previous, Date.now());
  session = createSession();
  currentAttempt = null;
  queuedSentenceKey = "";
  elements.resetMenu?.removeAttribute("open");
  saveState();
  render();
}

function clearInput() {
  elements.sentenceInput.value = "";
  elements.layoutHint.classList.add("hidden");
  renderPracticePanel();
  renderButtons();
}

function restartCurrentSentence(mode = getMode()) {
  if (!currentAttempt) {
    render();
    return;
  }
  stopLiveInterval();
  stopAudio();
  createAttempt({ sentence: currentAttempt.sentence, mode });
}

function setMode(mode) {
  if (!MODE_META[mode] || mode === getMode()) return;
  state.settings.mode = mode;
  saveState();
  restartCurrentSentence(mode);
}

function setSource(kind) {
  if (kind !== "custom" && kind !== "hvpt") return;
  if (state.settings.sourceKind === kind) return;
  state.settings.sourceKind = kind;
  session.sequentialIndex = 0;
  queuedSentenceKey = "";
  saveState();
  stopAudio();
  stopLiveInterval();
  currentAttempt = null;
  if (kind === "hvpt" && !hvpt.loaded && !hvpt.loading) void loadHvpt();
  render();
}

function setOrderMode(order) {
  if (order !== "shuffle" && order !== "sequential") return;
  if (state.settings.orderMode === order) return;
  state.settings.orderMode = order;
  session.sequentialIndex = 0;
  saveState();
  render();
}

function setHvptDeck(id) {
  const safe = normalizeKey(id);
  if (state.settings.hvptDeckId === safe) return;
  state.settings.hvptDeckId = safe;
  state.settings.hvptGroupId = "";
  session.sequentialIndex = 0;
  queuedSentenceKey = "";
  stopAudio();
  stopLiveInterval();
  currentAttempt = null;
  saveState();
  render();
}

function setHvptGroup(id) {
  const safe = normalizeKey(id);
  if (state.settings.hvptGroupId === safe) return;
  state.settings.hvptGroupId = safe;
  session.sequentialIndex = 0;
  queuedSentenceKey = "";
  stopAudio();
  stopLiveInterval();
  currentAttempt = null;
  saveState();
  render();
}

function adjustHiddenCount(delta) {
  const nextValue = clamp(state.settings.hiddenWordCount + delta, 1, MAX_HIDDEN_WORDS);
  if (nextValue === state.settings.hiddenWordCount) return;
  state.settings.hiddenWordCount = nextValue;
  saveState();
  if (getMode() === "flash") restartCurrentSentence("flash");
  else render();
}

function adjustPreviewSeconds(delta) {
  const nextValue = clamp(getPreviewSeconds() + delta, MIN_PREVIEW_SECONDS, MAX_PREVIEW_SECONDS);
  if (nextValue === state.settings.previewSeconds) return;
  state.settings.previewSeconds = nextValue;
  saveState();
  if (getMode() === "flash") restartCurrentSentence("flash");
  else render();
}

function adjustReplayLimit(delta) {
  const nextValue = clamp(getReplayLimit() + delta, MIN_REPLAY_LIMIT, MAX_REPLAY_LIMIT);
  if (nextValue === state.settings.replayLimit) return;
  state.settings.replayLimit = nextValue;
  saveState();
  render();
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function addCustomSentence() {
  const russian = elements.addRussian.value.trim();
  const english = elements.addEnglish.value.trim();
  if (!russian) {
    elements.addRussian.focus();
    elements.addHint.textContent = "Add the Russian text first.";
    return;
  }
  if (state.customSentences.length >= MAX_CUSTOM_SENTENCES) {
    elements.addHint.textContent = `Max ${MAX_CUSTOM_SENTENCES} custom sentences.`;
    return;
  }
  const now = Date.now();
  const id = makeId();
  state.customSentences.unshift({
    id,
    text: russian.slice(0, 500),
    english: english.slice(0, 500),
    createdAt: now,
    updatedAt: now,
  });
  elements.addRussian.value = "";
  elements.addEnglish.value = "";
  elements.addHint.textContent = "Saved. Press Enter to add another.";
  saveState();
  render();
  elements.addRussian.focus();
}

function deleteCustomSentence(id) {
  const target = state.customSentences.find((item) => item.id === id);
  if (!target) return;
  const confirmed = window.confirm(`Delete "${target.text}"?`);
  if (!confirmed) return;
  state.customSentences = state.customSentences.filter((item) => item.id !== id);
  if (currentAttempt?.sentence?.key === `custom:${id}`) {
    currentAttempt = null;
    stopLiveInterval();
    stopAudio();
  }
  saveState();
  render();
}

function queueSentence(key) {
  queuedSentenceKey = key;
  stopLiveInterval();
  stopAudio();
  createAttempt();
}

// ───────── result + scoring ─────────

function buildResultMetrics(result) {
  return `
    <div class="result-metric">
      <span>Accuracy</span>
      <strong>${formatPercent(result.accuracy)}</strong>
    </div>
    <div class="result-metric">
      <span>Speed</span>
      <strong>${formatWpm(result.wpm)}</strong>
    </div>
    <div class="result-metric">
      <span>Time</span>
      <strong>${formatSeconds(result.timeMs)}</strong>
    </div>
    <div class="result-metric">
      <span>Errors</span>
      <strong>${result.errors}</strong>
    </div>
  `;
}

function scoreAttempt() {
  if (!currentAttempt || currentAttempt.phase !== "typing") return;
  const typedText = elements.sentenceInput.value.trim();
  if (!typedText) return;

  currentAttempt.elapsedMs = getCurrentElapsedMs();
  const targetNormalized = normalizeText(currentAttempt.sentence.text);
  const typedNormalized = normalizeText(elements.sentenceInput.value);
  const distance = levenshtein(targetNormalized, typedNormalized);
  const maxLength = Math.max(targetNormalized.length, typedNormalized.length, 1);
  const accuracy = ((maxLength - distance) / maxLength) * 100;
  const correctChars = Math.max(0, maxLength - distance);
  const minutes = Math.max(currentAttempt.elapsedMs, 1) / 60000;
  const wpm = correctChars ? (correctChars / 5) / minutes : 0;
  const result = {
    sentenceKey: currentAttempt.sentence.key,
    mode: currentAttempt.mode,
    accuracy,
    wpm,
    timeMs: currentAttempt.elapsedMs,
    errors: currentAttempt.errors,
    clean: accuracy >= CLEAN_THRESHOLD,
    at: Date.now(),
    typedText,
  };

  currentAttempt.phase = "review";
  currentAttempt.result = result;
  elements.sentenceInput.disabled = true;
  stopLiveInterval();
  stopAudio();
  applyResult(result);
  saveState();
  render();
  window.setTimeout(() => {
    try { elements.advanceButton.scrollIntoView({ block: "nearest" }); } catch { elements.advanceButton.scrollIntoView(); }
    try { elements.advanceButton.focus({ preventScroll: true }); } catch { elements.advanceButton.focus(); }
  }, 60);
}

function applyResult(result) {
  session.attempts += 1;
  session.totalAccuracy += result.accuracy;
  session.totalWpm += result.wpm;
  if (result.clean) {
    session.cleanAttempts += 1;
    session.currentStreak += 1;
  } else {
    session.currentStreak = 0;
  }
  session.bestStreak = Math.max(session.bestStreak, session.currentStreak);

  state.totals.attempts += 1;
  state.totals.totalAccuracy += result.accuracy;
  state.totals.totalWpm += result.wpm;
  state.totals.totalMs += result.timeMs;
  if (result.clean) state.totals.cleanAttempts += 1;

  const modeStats = state.byMode[result.mode];
  modeStats.attempts += 1;
  modeStats.totalAccuracy += result.accuracy;
  modeStats.totalWpm += result.wpm;
  modeStats.totalMs += result.timeMs;
  if (result.clean) modeStats.cleanAttempts += 1;

  if (!state.bySentence[result.sentenceKey]) {
    state.bySentence[result.sentenceKey] = createSentenceStats();
  }
  const sentenceStats = state.bySentence[result.sentenceKey];
  sentenceStats.attempts += 1;
  sentenceStats.totalAccuracy += result.accuracy;
  sentenceStats.bestAccuracy = Math.max(sentenceStats.bestAccuracy, result.accuracy);
  sentenceStats.lastSeenAt = result.at;

  const sentenceModeStats = sentenceStats.byMode[result.mode];
  sentenceModeStats.attempts += 1;
  sentenceModeStats.totalAccuracy += result.accuracy;
  sentenceModeStats.totalWpm += result.wpm;
  sentenceModeStats.lastSeenAt = result.at;
  sentenceModeStats.bestAccuracy = Math.max(sentenceModeStats.bestAccuracy, result.accuracy);

  state.history.push({
    sentenceKey: result.sentenceKey,
    mode: result.mode,
    accuracy: result.accuracy,
    wpm: result.wpm,
    timeMs: result.timeMs,
    errors: result.errors,
    clean: result.clean,
    at: result.at,
  });
  state.history = state.history.slice(-HISTORY_LIMIT);
}

// ───────── rendering ─────────

function renderHero() {
  const pool = getActiveSentences();
  const covered = pool.filter((sentence) => (state.bySentence[sentence.key]?.attempts || 0) > 0).length;
  elements.coverageCount.textContent = `${pool.length} sentence${pool.length === 1 ? "" : "s"}`;

  if (!pool.length) {
    const sourceName = state.settings.sourceKind === "hvpt" ? "HVPT" : "your bank";
    elements.coverageDetail.textContent =
      state.settings.sourceKind === "hvpt"
        ? "Pick an HVPT deck and group below."
        : "Add a sentence below to begin.";
    void sourceName;
  } else {
    elements.coverageDetail.textContent = `${covered} of ${pool.length} practiced in ${MODE_META[getMode()].label}.`;
  }

  const trend = computeTrend();
  elements.recentTrend.textContent = trend.label;
  elements.recentTrendDetail.textContent = trend.detail;
}

function renderPracticePanel() {
  const attempt = currentAttempt;
  const mode = getMode();
  const flashWordCount = clamp(state.settings.hiddenWordCount, 1, MAX_HIDDEN_WORDS);
  const previewSeconds = getPreviewSeconds();
  const replayLimit = getReplayLimit();
  const hasInput = Boolean(elements.sentenceInput.value.trim());
  const isReview = attempt?.phase === "review";
  const pool = getActiveSentences();

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const showSettings = mode !== "copy";
  elements.settingsRow.classList.toggle("hidden", !showSettings);
  elements.flashWordsSetting.classList.toggle("hidden", mode !== "flash");
  elements.previewSetting.classList.toggle("hidden", mode !== "flash");
  elements.replaySetting.classList.toggle("hidden", mode !== "listen");

  elements.missingCount.textContent = String(flashWordCount);
  elements.missingMinus.disabled = flashWordCount <= 1;
  elements.missingPlus.disabled = flashWordCount >= MAX_HIDDEN_WORDS;
  elements.previewSeconds.textContent = `${previewSeconds}s`;
  elements.previewMinus.disabled = previewSeconds <= MIN_PREVIEW_SECONDS;
  elements.previewPlus.disabled = previewSeconds >= MAX_PREVIEW_SECONDS;
  elements.replayLimit.textContent = String(replayLimit);
  elements.replayMinus.disabled = replayLimit <= MIN_REPLAY_LIMIT;
  elements.replayPlus.disabled = replayLimit >= MAX_REPLAY_LIMIT;

  const isListen = mode === "listen";
  elements.audioStage.classList.toggle("hidden", !isListen || !attempt || isReview);

  if (!attempt) {
    elements.statusPill.className = "status-pill idle";
    elements.statusPill.textContent = pool.length ? "Ready" : "Empty";
    elements.countdownPill.textContent = pool.length ? "Ready" : "Add sentences";
    elements.promptStage.className = "prompt-stage idle";
    elements.promptStage.classList.remove("hidden");
    elements.entryPanel.classList.remove("hidden");
    elements.englishGloss.textContent = pool.length
      ? "Press Start for the first sentence."
      : state.settings.sourceKind === "hvpt"
        ? "No HVPT phrases in this view. Pick another deck or group."
        : "Add a Russian sentence below to practice.";
    elements.sentenceDisplay.textContent = pool.length ? "Press Start to begin." : "—";
    elements.hiddenWordsRow.classList.add("hidden");
    elements.hiddenWordsRow.innerHTML = "";
    elements.liveTimer.textContent = "0.0s";
    elements.attemptErrors.textContent = "0";
    elements.currentStreak.textContent = String(session.currentStreak);
    elements.feedbackMessage.textContent = pool.length
      ? MODE_META[mode].summary
      : "Pick a source and add sentences to start.";
    elements.scoreButton.disabled = true;
    elements.clearButton.disabled = !hasInput;
    elements.sentenceInput.disabled = true;
    return;
  }

  const isPreview = attempt.phase === "preview";
  const isTyping = attempt.phase === "typing";
  const isPaused = attempt.phase === "paused";

  const statusClass = isPreview ? "preview" : isTyping ? "typing" : isPaused ? "paused" : isReview ? "review" : "idle";
  elements.statusPill.className = `status-pill ${statusClass}`;
  elements.statusPill.textContent = isPreview
    ? "Preview"
    : isTyping
      ? "Typing"
      : isPaused
        ? "Paused"
        : isReview
          ? "Done"
          : "Idle";

  elements.promptStage.className = `prompt-stage ${statusClass}`;
  elements.promptStage.classList.toggle("hidden", isReview);
  elements.entryPanel.classList.toggle("hidden", isReview);
  elements.englishGloss.textContent = attempt.sentence.english || "";

  if (isListen) {
    elements.countdownPill.textContent = `${attempt.playCount} of ${replayLimit} plays`;
  } else if (isPreview) {
    elements.countdownPill.textContent = `${(attempt.remainingPreviewMs / 1000).toFixed(1)}s`;
  } else if (isTyping || isPaused) {
    elements.countdownPill.textContent =
      mode === "copy" ? "Visible" : `${attempt.hiddenCount} blank${attempt.hiddenCount === 1 ? "" : "s"}`;
  } else if (isReview) {
    elements.countdownPill.textContent = "Saved";
  }

  if (isListen && !isReview) {
    elements.sentenceDisplay.innerHTML = attempt.audioPlaying
      ? `<span class="listen-placeholder">Playing…</span>`
      : `<span class="listen-placeholder">Tap play to hear the sentence.</span>`;
  } else if (isPreview) {
    elements.sentenceDisplay.innerHTML = renderSentenceHtml(attempt.tokens);
  } else if (isTyping || isPaused) {
    elements.sentenceDisplay.innerHTML =
      mode === "copy"
        ? renderSentenceHtml(attempt.tokens)
        : renderSentenceHtml(attempt.tokens, attempt.hiddenIndexes);
  } else if (isReview) {
    elements.sentenceDisplay.innerHTML = renderSentenceHtml(attempt.tokens, attempt.hiddenIndexes, {
      reveal: true,
      highlightHidden: mode === "flash",
    });
  }

  if (isListen) {
    const reached = attempt.playCount >= replayLimit;
    elements.audioPlayButton.disabled = reached;
    elements.audioPlayButton.querySelector(".audio-label").textContent = attempt.playCount === 0
      ? "Play audio"
      : reached
        ? "No replays left"
        : "Replay";
    elements.audioReplayInfo.textContent = `${attempt.playCount} of ${replayLimit} plays`;
  }

  if (attempt.hiddenIndexes.length && isReview) {
    const hiddenWords = attempt.hiddenIndexes
      .map((index) => attempt.tokens[index].value)
      .map((word) => `<span class="hidden-chip">${escapeHtml(word)}</span>`)
      .join("");
    elements.hiddenWordsRow.innerHTML = hiddenWords;
    elements.hiddenWordsRow.classList.remove("hidden");
  } else {
    elements.hiddenWordsRow.innerHTML = "";
    elements.hiddenWordsRow.classList.add("hidden");
  }

  let feedback;
  if (isPaused) feedback = "Paused.";
  else if (isPreview) feedback = mode === "flash" ? "Memorize it." : "Get ready.";
  else if (isTyping && mode === "copy") feedback = "Type what you see.";
  else if (isTyping && mode === "flash") feedback = "Type from memory.";
  else if (isTyping && mode === "listen") feedback = "Type what you heard.";
  else if (isReview) feedback = "Scored.";
  else feedback = MODE_META[mode].summary;
  elements.feedbackMessage.textContent = feedback;

  elements.liveTimer.textContent = formatSeconds(getCurrentElapsedMs());
  elements.attemptErrors.textContent = String(attempt.errors);
  elements.currentStreak.textContent = String(session.currentStreak);
  elements.scoreButton.disabled = !isTyping || !hasInput;
  elements.clearButton.disabled = !hasInput;
}

function renderResultCard() {
  if (!currentAttempt || currentAttempt.phase !== "review" || !currentAttempt.result) {
    elements.resultCard.classList.add("hidden");
    elements.resultCard.classList.remove("is-review");
    return;
  }
  elements.resultCard.classList.remove("hidden");
  const result = currentAttempt.result;
  const hiddenWords = currentAttempt.hiddenIndexes
    .map((index) => currentAttempt.tokens[index].value)
    .join(", ");
  const modeNote = currentAttempt.mode === "copy"
    ? "See rep."
    : currentAttempt.mode === "listen"
      ? `Listen rep (${currentAttempt.playCount} play${currentAttempt.playCount === 1 ? "" : "s"}).`
      : hiddenWords
        ? `Hidden: ${hiddenWords}.`
        : `${currentAttempt.hiddenCount} blank${currentAttempt.hiddenCount === 1 ? "" : "s"}.`;

  elements.resultCard.classList.add("is-review");
  elements.resultSummary.textContent = result.clean ? "Clean" : "Retry";
  elements.resultTitle.textContent = `${formatPercent(result.accuracy)} accuracy · ${formatWpm(result.wpm)}`;
  elements.resultBody.textContent = `${result.clean ? "Clean hit." : "Another pass recommended."} ${modeNote}`;
  elements.resultMetrics.innerHTML = buildResultMetrics(result);
  elements.resultDiff.innerHTML = buildDiffHtml(currentAttempt.sentence.text, result.typedText);
}

function renderSessionPanel() {
  const sessionAverageAccuracy = average(session.totalAccuracy, session.attempts);
  const sessionAverageWpm = average(session.totalWpm, session.attempts);
  const lifetimeAverageAccuracy = average(state.totals.totalAccuracy, state.totals.attempts);
  const lifetimeAverageWpm = average(state.totals.totalWpm, state.totals.attempts);

  elements.sessionBadge.textContent = getSessionBadge();
  elements.sessionAttempts.textContent = String(session.attempts);
  elements.sessionCleanRate.textContent = `${formatWholePercent(average(session.cleanAttempts * 100, session.attempts))} clean hits`;
  elements.sessionAverageAccuracy.textContent = formatPercent(sessionAverageAccuracy);
  elements.sessionAverageAccuracyDetail.textContent =
    session.attempts > 0
      ? `${session.attempts} sentence${session.attempts === 1 ? "" : "s"} in this run`
      : "Session average";
  elements.sessionAverageSpeed.textContent = formatWpm(sessionAverageWpm);
  elements.sessionBestStreak.textContent = `Best streak: ${session.bestStreak}`;
  elements.lifetimeAverageAccuracy.textContent = formatPercent(lifetimeAverageAccuracy);
  elements.lifetimeAverageSpeed.textContent = `${formatWpm(lifetimeAverageWpm)} lifetime`;
  elements.lifetimeTotals.textContent = `${state.totals.attempts} attempts · ${formatStudyTime(state.totals.totalMs)} studied`;
}

function renderFocusPanel() {
  const mode = getMode();
  const pool = getActiveSentences();
  const ranked = pool
    .map((sentence) => {
      const stats = getSentenceStatsForView(sentence.key, mode);
      const avgAccuracy = getAverageAccuracy(stats);
      const avgWpm = getAverageWpm(stats);
      const freshness = stats.lastSeenAt ? Math.min((Date.now() - stats.lastSeenAt) / 60000, 240) : 120;
      const weight =
        (stats.attempts ? 0 : 24) +
        (100 - avgAccuracy) * 0.8 +
        Math.max(0, 16 - avgWpm) +
        freshness * 0.05;
      return { sentence, stats, avgAccuracy, avgWpm, weight };
    })
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 4);

  if (!ranked.length) {
    elements.focusSentences.innerHTML = `<p class="focus-empty">No sentences to focus on yet.</p>`;
    return;
  }

  elements.focusSentences.innerHTML = ranked
    .map(({ sentence, stats, avgAccuracy, avgWpm }) => {
      const meta = stats.attempts
        ? `${formatPercent(avgAccuracy)} avg · ${formatWpm(avgWpm)}`
        : "New";
      return `
        <div class="focus-item">
          <strong>${escapeHtml(sentence.text)}</strong>
          <div class="focus-meta">${escapeHtml(meta)}</div>
        </div>
      `;
    })
    .join("");
}

function renderSourceTabs() {
  elements.sourceButtons.forEach((button) => {
    const isActive = button.dataset.source === state.settings.sourceKind;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  elements.orderButtons.forEach((button) => {
    const isActive = button.dataset.order === state.settings.orderMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const isHvpt = state.settings.sourceKind === "hvpt";
  elements.hvptPicker.classList.toggle("hidden", !isHvpt);
  elements.addForm.classList.toggle("hidden", isHvpt);
}

function renderHvptPicker() {
  if (state.settings.sourceKind !== "hvpt") return;
  if (hvpt.loading) {
    elements.hvptStatus.textContent = "Loading decks…";
    elements.hvptDeckSelect.innerHTML = `<option>Loading…</option>`;
    elements.hvptDeckSelect.disabled = true;
    elements.hvptGroupSelect.innerHTML = `<option>Loading…</option>`;
    elements.hvptGroupSelect.disabled = true;
    return;
  }
  if (hvpt.error) {
    elements.hvptStatus.textContent = hvpt.error;
    elements.hvptDeckSelect.innerHTML = `<option>—</option>`;
    elements.hvptDeckSelect.disabled = true;
    elements.hvptGroupSelect.innerHTML = `<option>—</option>`;
    elements.hvptGroupSelect.disabled = true;
    return;
  }
  if (!hvpt.loaded) {
    elements.hvptStatus.textContent = "";
    return;
  }
  if (!hvpt.decks.length) {
    elements.hvptStatus.textContent = "No HVPT decks found. Build one in the HVPT Voice Lab.";
    elements.hvptDeckSelect.innerHTML = `<option>—</option>`;
    elements.hvptDeckSelect.disabled = true;
    elements.hvptGroupSelect.innerHTML = `<option>—</option>`;
    elements.hvptGroupSelect.disabled = true;
    return;
  }

  const deck = getHvptDeck();
  elements.hvptDeckSelect.disabled = false;
  elements.hvptDeckSelect.innerHTML = hvpt.decks
    .map(
      (d) => `<option value="${escapeHtml(d.id)}" ${d.id === deck?.id ? "selected" : ""}>${escapeHtml(d.name || "Untitled deck")} · ${(d.phrases || []).length}</option>`,
    )
    .join("");

  const groups = deck?.groups || [];
  elements.hvptGroupSelect.disabled = !groups.length;
  const groupOptions = [
    `<option value="">All phrases${deck ? ` (${(deck.phrases || []).length})` : ""}</option>`,
  ].concat(
    groups.map(
      (group) =>
        `<option value="${escapeHtml(group.id)}" ${group.id === state.settings.hvptGroupId ? "selected" : ""}>${escapeHtml(group.name || "Group")} · ${(group.phraseIds || []).length}</option>`,
    ),
  );
  elements.hvptGroupSelect.innerHTML = groupOptions.join("");

  const active = getActiveSentences();
  elements.hvptStatus.textContent = active.length
    ? `${active.length} phrase${active.length === 1 ? "" : "s"} ready.`
    : "No phrases in this selection.";
}

function renderLibrary() {
  const pool = getActiveSentences();
  const mode = getMode();
  elements.libraryCount.textContent = `${pool.length} sentence${pool.length === 1 ? "" : "s"}`;
  const queued = queuedSentenceKey && pool.find((s) => s.key === queuedSentenceKey);
  elements.libraryQueue.classList.toggle("hidden", !queued);
  if (queued) elements.libraryQueue.textContent = `Queued: ${queued.text}`;

  elements.libraryEmpty.classList.toggle("hidden", pool.length > 0);
  if (!pool.length) {
    elements.libraryEmpty.textContent = state.settings.sourceKind === "hvpt"
      ? "No phrases in this selection."
      : "No custom sentences yet. Add one above.";
    elements.sentenceList.innerHTML = "";
    return;
  }

  elements.sentenceList.innerHTML = pool
    .map((sentence, index) => {
      const stats = getSentenceStatsEntry(sentence.key);
      const modeStats = stats.byMode[mode] || createSentenceModeStats();
      const attempts = modeStats.attempts;
      const mastery = attempts ? getMasteryPercent(modeStats) : 0;
      const section = getSentenceSection(modeStats);
      const isCurrent = currentAttempt?.sentence?.key === sentence.key;
      const isQueued = queuedSentenceKey === sentence.key;
      const sectionLabel = attempts ? (section === "mastered" ? "Mastered" : "In progress") : "New";
      const hasAudio = Boolean(sentence.audioUrl) || "speechSynthesis" in window;
      const audioButton = hasAudio
        ? `<button class="row-action row-play" type="button" data-action="play" data-key="${escapeHtml(sentence.key)}" title="Listen" aria-label="Listen">▶</button>`
        : "";
      const picked = isCurrent
        ? `<span class="row-current">Current</span>`
        : isQueued
          ? `<span class="row-current">Queued</span>`
          : `<button class="row-action row-pick" type="button" data-action="pick" data-key="${escapeHtml(sentence.key)}" title="Practice this one" aria-label="Practice this one">↦</button>`;
      const deleteButton = sentence.source === "custom"
        ? `<button class="row-action row-delete" type="button" data-action="delete" data-id="${escapeHtml(sentence.id)}" title="Delete" aria-label="Delete">✕</button>`
        : "";

      return `
        <article class="sentence-row${isCurrent ? " is-current" : ""}${isQueued ? " is-queued" : ""}" data-index="${index}">
          <div class="sentence-row-body">
            <p class="row-russian">${escapeHtml(sentence.text)}</p>
            ${sentence.english ? `<p class="row-english">${escapeHtml(sentence.english)}</p>` : ""}
            <div class="row-meter" aria-hidden="true">
              <span style="width:${attempts ? mastery : 4}%"></span>
            </div>
            <div class="row-meta">
              <span class="row-section is-${section}">${sectionLabel}</span>
              <span>${attempts ? `${mastery}% · ${formatRepCount(attempts)}` : "Not started"}</span>
            </div>
          </div>
          <div class="sentence-row-actions">
            ${audioButton}
            ${picked}
            ${deleteButton}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderButtons() {
  const phase = currentAttempt?.phase || "idle";
  const isReview = phase === "review";
  const isPaused = phase === "paused";
  const hasSession = Boolean(currentAttempt) && !isReview;
  const canPause = phase === "preview" || phase === "typing";
  const showStart = !currentAttempt || isPaused;
  const pool = getActiveSentences();

  elements.startButton.classList.toggle("hidden", !showStart);
  elements.startButton.disabled = !pool.length;
  elements.heroSessionActions.classList.toggle("hidden", !hasSession);
  elements.pauseButton.classList.toggle("hidden", !canPause);
  elements.startButton.textContent = isPaused ? "Resume" : "Start";
  elements.pauseButton.textContent = "Pause";
  elements.nextButton.textContent = "Skip";
  elements.pauseButton.disabled = !(phase === "preview" || phase === "typing");
  elements.scoreButton.disabled = !(phase === "typing" && elements.sentenceInput.value.trim());
  elements.clearButton.disabled = !elements.sentenceInput.value.trim();
  elements.practiceActions.classList.toggle("is-hidden", isReview);
  elements.practiceActions.classList.toggle("keyboard-open", keyboardOpen);
  elements.advanceButton.disabled = !isReview;
  elements.replayCurrentButton.disabled = !isReview;
  elements.addButton.disabled = !elements.addRussian.value.trim();
}

function render() {
  renderHero();
  renderSourceTabs();
  renderHvptPicker();
  renderPracticePanel();
  renderResultCard();
  renderSessionPanel();
  renderFocusPanel();
  renderLibrary();
  renderButtons();
}

// ───────── events ─────────

function handleBeforeInput(event) {
  if (!currentAttempt || currentAttempt.phase !== "typing") return;
  if (event.inputType !== "insertText") return;
  const typed = event.data || "";
  if (typed.length !== 1) return;
  const input = elements.sentenceInput;
  if (input.selectionStart !== input.selectionEnd || input.selectionStart !== input.value.length) return;
  const expected = currentAttempt.sentence.text[input.value.length] || "";
  if (typed !== expected) {
    currentAttempt.errors += 1;
    renderPracticePanel();
  }
}

function handleInput() {
  elements.layoutHint.classList.toggle("hidden", !/[A-Za-z]/.test(elements.sentenceInput.value));
  renderButtons();
}

function handleInputKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    scoreAttempt();
  }
}

function updateKeyboardState() {
  if (!window.visualViewport) return;
  const currentHeight = window.visualViewport.height;
  if (currentHeight > visualViewportBaseline * 0.9) visualViewportBaseline = currentHeight;
  const nextKeyboardOpen = currentHeight < visualViewportBaseline * 0.75;
  if (nextKeyboardOpen === keyboardOpen) return;
  keyboardOpen = nextKeyboardOpen;
  renderButtons();
}

function isTextEntryTarget(target) {
  return target === elements.sentenceInput || target?.closest?.("textarea, input, [contenteditable='true']");
}

function isInteractiveShortcutTarget(target) {
  return Boolean(target?.closest?.("button, summary, a, input, select, textarea, [role='button']"));
}

function handleGlobalKeydown(event) {
  if (event.defaultPrevented) return;
  const target = event.target;
  const textEntry = isTextEntryTarget(target);

  if (event.key === "Escape") {
    if (currentAttempt && (currentAttempt.phase === "typing" || currentAttempt.phase === "preview")) {
      event.preventDefault();
      pauseAttempt();
    }
    return;
  }

  if (textEntry || isInteractiveShortcutTarget(target)) return;

  if (event.key === " " && !event.repeat) {
    event.preventDefault();
    startOrResume();
    return;
  }

  if (event.key === "Tab" && !event.shiftKey && currentAttempt && currentAttempt.phase !== "review") {
    event.preventDefault();
    nextSentence();
  }
}

function handleAudioPlayerEvent(kind) {
  if (!currentAttempt || currentAttempt.mode !== "listen") return;
  if (kind === "ended" || kind === "error" || kind === "pause") {
    if (kind !== "pause" || elements.audioPlayer.ended) {
      currentAttempt.audioPlaying = false;
      renderPracticePanel();
    }
  } else if (kind === "play") {
    currentAttempt.audioPlaying = true;
    renderPracticePanel();
  }
}

function handleAddFormKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomSentence();
  }
}

function handleListClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "play") {
    const sentence = getSentenceByKey(target.dataset.key);
    if (sentence) playSentenceAudio(sentence);
    return;
  }
  if (action === "pick") {
    queueSentence(target.dataset.key);
    return;
  }
  if (action === "delete") {
    deleteCustomSentence(target.dataset.id);
  }
}

function attachEvents() {
  elements.startButton.addEventListener("click", startOrResume);
  elements.pauseButton.addEventListener("click", pauseAttempt);
  elements.nextButton.addEventListener("click", nextSentence);
  elements.resetButton.addEventListener("click", resetProgress);
  elements.scoreButton.addEventListener("click", scoreAttempt);
  elements.clearButton.addEventListener("click", clearInput);
  elements.advanceButton.addEventListener("click", nextSentence);
  elements.replayCurrentButton.addEventListener("click", replayCurrentSentence);
  elements.missingMinus.addEventListener("click", () => adjustHiddenCount(-1));
  elements.missingPlus.addEventListener("click", () => adjustHiddenCount(1));
  elements.previewMinus.addEventListener("click", () => adjustPreviewSeconds(-1));
  elements.previewPlus.addEventListener("click", () => adjustPreviewSeconds(1));
  elements.replayMinus.addEventListener("click", () => adjustReplayLimit(-1));
  elements.replayPlus.addEventListener("click", () => adjustReplayLimit(1));
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  elements.sourceButtons.forEach((button) => {
    button.addEventListener("click", () => setSource(button.dataset.source));
  });
  elements.orderButtons.forEach((button) => {
    button.addEventListener("click", () => setOrderMode(button.dataset.order));
  });
  elements.hvptDeckSelect.addEventListener("change", (event) => setHvptDeck(event.target.value));
  elements.hvptGroupSelect.addEventListener("change", (event) => setHvptGroup(event.target.value));
  elements.audioPlayButton.addEventListener("click", triggerAttemptAudio);
  elements.audioPlayer.addEventListener("play", () => handleAudioPlayerEvent("play"));
  elements.audioPlayer.addEventListener("pause", () => handleAudioPlayerEvent("pause"));
  elements.audioPlayer.addEventListener("ended", () => handleAudioPlayerEvent("ended"));
  elements.audioPlayer.addEventListener("error", () => handleAudioPlayerEvent("error"));
  elements.sentenceInput.addEventListener("beforeinput", handleBeforeInput);
  elements.sentenceInput.addEventListener("input", handleInput);
  elements.sentenceInput.addEventListener("keydown", handleInputKeydown);
  elements.sentenceInput.addEventListener("paste", (event) => event.preventDefault());
  elements.addRussian.addEventListener("keydown", handleAddFormKeydown);
  elements.addEnglish.addEventListener("keydown", handleAddFormKeydown);
  elements.addRussian.addEventListener("input", renderButtons);
  elements.addButton.addEventListener("click", addCustomSentence);
  elements.sentenceList.addEventListener("click", handleListClick);
  document.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("online", () => { void syncStateFromServer(); });
  window.addEventListener("resize", updateKeyboardState);
  window.visualViewport?.addEventListener("resize", updateKeyboardState);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void syncStateFromServer();
  });
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => ensureSpeechVoice();
    ensureSpeechVoice();
  }
}

attachEvents();
updateKeyboardState();
if (state.settings.sourceKind === "hvpt") void loadHvpt();
render();
void syncStateFromServer();
