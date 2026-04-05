const STORAGE_KEY = "russian-sentence-coach-state-v1";
const REMOTE_PROGRESS_URL = "./api/progress";
const CLEAN_THRESHOLD = 98;
const HISTORY_LIMIT = 240;
const RECENT_WINDOW = 8;
const MIN_PREVIEW_SECONDS = 1;
const MAX_PREVIEW_SECONDS = 6;
const DEFAULT_PREVIEW_SECONDS = 3;
const MAX_HIDDEN_WORDS = 6;
const MASTERED_AVERAGE_ACCURACY = 96;
const MASTERED_MIN_ATTEMPTS = 3;
const MODE_ORDER = ["copy", "single", "multi"];
const UI_MODE_ORDER = ["copy", "flash"];
const NO_SPACE_BEFORE = new Set([",", ".", "!", "?", ";", ":"]);
const STOPWORDS = new Set([
  "а",
  "в",
  "во",
  "и",
  "из",
  "как",
  "мне",
  "мы",
  "на",
  "не",
  "но",
  "она",
  "они",
  "с",
  "ты",
  "у",
  "я",
]);

const MODE_META = {
  copy: {
    label: "Copy",
    title: "Visible sentence",
    summary: "Type what you see.",
  },
  single: {
    label: "Flash",
    title: "One missing word",
    summary: "One word hidden.",
  },
  multi: {
    label: "Flash",
    title: "Several missing words",
    summary: "Several words hidden.",
  },
};

const UI_MODE_META = {
  copy: {
    label: "Copy",
    title: "Visible",
    summary: "Type the full line.",
  },
  flash: {
    label: "Flash",
    title: "Preview + recall",
    summary: "Preview it, then type from memory.",
  },
};

const SENTENCES = [
  {
    id: "good-morning",
    text: "Доброе утро!",
    english: "Good morning!",
  },
  {
    id: "how-are-things",
    text: "Как у тебя дела?",
    english: "How are things with you?",
  },
  {
    id: "thirty-two",
    text: "Мне тридцать два.",
    english: "I am thirty-two.",
  },
  {
    id: "live-in-sweden",
    text: "Я живу в Швеции.",
    english: "I live in Sweden.",
  },
  {
    id: "home-now",
    text: "Я дома сейчас.",
    english: "I am at home now.",
  },
  {
    id: "gym-after-dinner",
    text: "Я иду в спортзал после ужина.",
    english: "I go to the gym after dinner.",
  },
  {
    id: "beer-with-friends",
    text: "Мы пьём пиво с друзьями.",
    english: "We drink beer with friends.",
  },
  {
    id: "music-at-her-place",
    text: "Мы слушаем музыку у неё дома.",
    english: "We listen to music at her place.",
  },
  {
    id: "friend-of-friend",
    text: "Она подруга моей подруги.",
    english: "She is a friend of my friend.",
  },
  {
    id: "i-want-sleep",
    text: "Я хочу спать.",
    english: "I want to sleep.",
  },
  {
    id: "woke-up-at-one",
    text: "Я проснулся в час.",
    english: "I woke up at one o'clock.",
  },
  {
    id: "breakfast-question",
    text: "Что ты ел на завтрак?",
    english: "What did you eat for breakfast?",
  },
  {
    id: "breakfast-eggs-bread",
    text: "На завтрак я ел яйца и хлеб.",
    english: "For breakfast I ate eggs and bread.",
  },
  {
    id: "fish-for-dinner",
    text: "Мы ели рыбу на ужин.",
    english: "We ate fish for dinner.",
  },
  {
    id: "was-it-tasty",
    text: "Было вкусно?",
    english: "Was it tasty?",
  },
  {
    id: "never-work-home",
    text: "Я никогда не работаю дома.",
    english: "I never work at home.",
  },
  {
    id: "you-listen-home",
    text: "Вы слушаете музыку дома.",
    english: "You listen to music at home.",
  },
  {
    id: "football-tuesday",
    text: "Они играют в футбол во вторник.",
    english: "They play football on Tuesday.",
  },
  {
    id: "day-of-week",
    text: "Какой сегодня день недели?",
    english: "What day of the week is it today?",
  },
  {
    id: "what-time-now",
    text: "Который час сейчас?",
    english: "What time is it now?",
  },
];

const SENTENCE_IDS = new Set(SENTENCES.map((sentence) => sentence.id));
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
  replayButton: document.getElementById("replay-button"),
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
  modeStatsGrid: document.getElementById("mode-stats-grid"),
  sentenceBank: document.getElementById("sentence-bank"),
  settingsRow: document.querySelector(".settings-row"),
  missingMinus: document.getElementById("missing-minus"),
  missingPlus: document.getElementById("missing-plus"),
  missingCount: document.getElementById("missing-count"),
  previewMinus: document.getElementById("preview-minus"),
  previewPlus: document.getElementById("preview-plus"),
  previewSeconds: document.getElementById("preview-seconds"),
  modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
};

let state = loadState();
let session = createSession();
let currentAttempt = null;
let liveInterval = 0;
let remoteSaveChain = Promise.resolve();
let keyboardOpen = false;
let visualViewportBaseline = window.visualViewport?.height || window.innerHeight;

function createAggregateStats() {
  return {
    attempts: 0,
    totalAccuracy: 0,
    totalWpm: 0,
    totalMs: 0,
    cleanAttempts: 0,
  };
}

function createSentenceStats() {
  const byMode = {};
  MODE_ORDER.forEach((mode) => {
    byMode[mode] = {
      attempts: 0,
      totalAccuracy: 0,
      totalWpm: 0,
      lastSeenAt: 0,
      bestAccuracy: 0,
    };
  });

  return {
    attempts: 0,
    totalAccuracy: 0,
    bestAccuracy: 0,
    lastSeenAt: 0,
    byMode,
  };
}

function createDefaultState(now = Date.now()) {
  const byMode = {};
  const bySentence = {};

  MODE_ORDER.forEach((mode) => {
    byMode[mode] = createAggregateStats();
  });

  SENTENCES.forEach((sentence) => {
    bySentence[sentence.id] = createSentenceStats();
  });

  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    settings: {
      mode: "copy",
      hiddenWordCount: 1,
      previewSeconds: DEFAULT_PREVIEW_SECONDS,
    },
    totals: createAggregateStats(),
    history: [],
    byMode,
    bySentence,
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
  };
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function copyAggregateStats(target, source) {
  target.attempts = Math.max(0, numberOr(source?.attempts, target.attempts));
  target.totalAccuracy = Math.max(0, numberOr(source?.totalAccuracy, target.totalAccuracy));
  target.totalWpm = Math.max(0, numberOr(source?.totalWpm, target.totalWpm));
  target.totalMs = Math.max(0, numberOr(source?.totalMs, target.totalMs));
  target.cleanAttempts = Math.max(0, numberOr(source?.cleanAttempts, target.cleanAttempts));
}

function sanitizeHistory(items, fallbackNow = Date.now()) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      sentenceId: SENTENCE_IDS.has(item?.sentenceId) ? item.sentenceId : null,
      mode: MODE_META[item?.mode] ? item.mode : "copy",
      accuracy: clamp(numberOr(item?.accuracy, 0), 0, 100),
      wpm: Math.max(0, numberOr(item?.wpm, 0)),
      timeMs: Math.max(0, numberOr(item?.timeMs, 0)),
      errors: Math.max(0, numberOr(item?.errors, 0)),
      clean: Boolean(item?.clean),
      at: Math.max(0, numberOr(item?.at, fallbackNow)),
    }))
    .filter((item) => item.sentenceId)
    .slice(-HISTORY_LIMIT);
}

function sanitizeState(parsed, fallbackNow = Date.now()) {
  const base = createDefaultState(fallbackNow);
  if (!parsed || typeof parsed !== "object") {
    return base;
  }

  base.createdAt = Math.max(0, numberOr(parsed.createdAt, base.createdAt));
  base.updatedAt = Math.max(0, numberOr(parsed.updatedAt, base.updatedAt));
  const persistedMode = parsed.settings?.mode;
  if (persistedMode === "copy" || persistedMode === "flash") {
    base.settings.mode = persistedMode;
  } else if (persistedMode === "single" || persistedMode === "multi") {
    base.settings.mode = "flash";
  }
  base.settings.hiddenWordCount = clamp(
    numberOr(parsed.settings?.hiddenWordCount, parsed.settings?.multiHiddenCount ?? 1),
    1,
    MAX_HIDDEN_WORDS
  );
  base.settings.previewSeconds = clamp(
    numberOr(parsed.settings?.previewSeconds, DEFAULT_PREVIEW_SECONDS),
    MIN_PREVIEW_SECONDS,
    MAX_PREVIEW_SECONDS
  );

  copyAggregateStats(base.totals, parsed.totals);
  base.history = sanitizeHistory(parsed.history, fallbackNow);

  MODE_ORDER.forEach((mode) => {
    copyAggregateStats(base.byMode[mode], parsed.byMode?.[mode]);
  });

  SENTENCES.forEach((sentence) => {
    const target = base.bySentence[sentence.id];
    const source = parsed.bySentence?.[sentence.id];
    target.attempts = Math.max(0, numberOr(source?.attempts, target.attempts));
    target.totalAccuracy = Math.max(0, numberOr(source?.totalAccuracy, target.totalAccuracy));
    target.bestAccuracy = clamp(numberOr(source?.bestAccuracy, target.bestAccuracy), 0, 100);
    target.lastSeenAt = Math.max(0, numberOr(source?.lastSeenAt, target.lastSeenAt));

    MODE_ORDER.forEach((mode) => {
      const modeTarget = target.byMode[mode];
      const modeSource = source?.byMode?.[mode];
      modeTarget.attempts = Math.max(0, numberOr(modeSource?.attempts, modeTarget.attempts));
      modeTarget.totalAccuracy = Math.max(0, numberOr(modeSource?.totalAccuracy, modeTarget.totalAccuracy));
      modeTarget.totalWpm = Math.max(0, numberOr(modeSource?.totalWpm, modeTarget.totalWpm));
      modeTarget.lastSeenAt = Math.max(0, numberOr(modeSource?.lastSeenAt, modeTarget.lastSeenAt));
      modeTarget.bestAccuracy = clamp(numberOr(modeSource?.bestAccuracy, modeTarget.bestAccuracy), 0, 100);
    });
  });

  return base;
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState(0);
    }
    return sanitizeState(JSON.parse(raw), 0);
  } catch (error) {
    return createDefaultState(0);
  }
}

function persistLocalState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

function cloneStateSnapshot(source) {
  if (typeof structuredClone === "function") {
    return structuredClone(source);
  }

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

  if (!response.ok) {
    throw new Error(`Remote sync failed with status ${response.status}`);
  }

  return response.json();
}

function queueRemoteSave(snapshot = cloneStateSnapshot(state)) {
  if (typeof window.fetch !== "function") {
    return;
  }

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
  if (typeof window.fetch !== "function") {
    return;
  }

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

    if (state.updatedAt > remote.updatedAt) {
      queueRemoteSave();
    }
  } catch (error) {
    return;
  }
}

function saveState() {
  try {
    state.updatedAt = Date.now();
    persistLocalState();
    queueRemoteSave();
  } catch (error) {
    return;
  }
}

function getMode() {
  return state.settings.mode;
}

function getHiddenCountForMode(mode = getMode()) {
  if (mode === "copy") {
    return 0;
  }
  return clamp(state.settings.hiddenWordCount, 1, MAX_HIDDEN_WORDS);
}

function getPreviewSeconds() {
  return clamp(state.settings.previewSeconds, MIN_PREVIEW_SECONDS, MAX_PREVIEW_SECONDS);
}

function getPreviewMs(mode = getMode()) {
  if (mode === "copy") {
    return 0;
  }
  return getPreviewSeconds() * 1000;
}

function getPracticeLane(mode = getMode()) {
  if (mode === "copy") {
    return "copy";
  }
  return getHiddenCountForMode(mode) === 1 ? "single" : "multi";
}

function combineAggregateStats(statsList) {
  return statsList.reduce(
    (combined, stats) => {
      combined.attempts += stats.attempts;
      combined.totalAccuracy += stats.totalAccuracy;
      combined.totalWpm += stats.totalWpm;
      combined.totalMs += stats.totalMs;
      combined.cleanAttempts += stats.cleanAttempts;
      return combined;
    },
    createAggregateStats()
  );
}

function combineSentenceModeStats(statsList) {
  return statsList.reduce(
    (combined, stats) => {
      combined.attempts += stats.attempts;
      combined.totalAccuracy += stats.totalAccuracy;
      combined.totalWpm += stats.totalWpm;
      combined.lastSeenAt = Math.max(combined.lastSeenAt, stats.lastSeenAt);
      combined.bestAccuracy = Math.max(combined.bestAccuracy, stats.bestAccuracy);
      return combined;
    },
    {
      attempts: 0,
      totalAccuracy: 0,
      totalWpm: 0,
      lastSeenAt: 0,
      bestAccuracy: 0,
    }
  );
}

function getModeStatsForView(mode = getMode()) {
  if (mode === "copy") {
    return state.byMode.copy;
  }
  return combineAggregateStats([state.byMode.single, state.byMode.multi]);
}

function getSentenceStatsForView(sentenceId, mode = getMode()) {
  const sentenceStats = state.bySentence[sentenceId];
  if (mode === "copy") {
    return sentenceStats.byMode.copy;
  }
  return combineSentenceModeStats([sentenceStats.byMode.single, sentenceStats.byMode.multi]);
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
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!remainder) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainder}s`;
}

function formatRepCount(attempts) {
  return `${attempts} rep${attempts === 1 ? "" : "s"}`;
}

function getMasteryPercent(stats) {
  return clamp(Math.round(getAverageAccuracy(stats)), 0, 100);
}

function getSentenceSection(stats) {
  if (!stats.attempts) {
    return "new";
  }

  if (stats.attempts >= MASTERED_MIN_ATTEMPTS && getAverageAccuracy(stats) >= MASTERED_AVERAGE_ACCURACY) {
    return "mastered";
  }

  return "progress";
}

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  return (text.match(/[\p{L}\p{M}\p{N}-]+/gu) || []).length;
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    grid[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    grid[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      grid[row][col] = Math.min(
        grid[row - 1][col] + 1,
        grid[row][col - 1] + 1,
        grid[row - 1][col - 1] + cost
      );
    }
  }

  return grid[a.length][b.length];
}

function buildEditGrid(expectedChars, actualChars) {
  const rows = expectedChars.length + 1;
  const cols = actualChars.length + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    grid[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    grid[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = expectedChars[row - 1] === actualChars[col - 1] ? 0 : 1;
      grid[row][col] = Math.min(
        grid[row - 1][col] + 1,
        grid[row][col - 1] + 1,
        grid[row - 1][col - 1] + cost
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
      operations.push({
        type: "delete",
        expected: expectedChars[row - 1],
        actual: "",
      });
      row -= 1;
      continue;
    }

    operations.push({
      type: "insert",
      expected: "",
      actual: actualChars[col - 1],
    });
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
    .map((operation) => {
      if (operation.type === "match") {
        return renderDiffChar(operation.expected, "is-match");
      }
      if (operation.type === "replace") {
        return renderDiffChar(operation.expected, "is-miss");
      }
      if (operation.type === "delete") {
        return renderDiffChar(operation.expected, "is-gap");
      }
      return renderDiffChar("", "is-gap");
    })
    .join("");

  const actualLine = operations
    .map((operation) => {
      if (operation.type === "match") {
        return renderDiffChar(operation.actual, "is-match");
      }
      if (operation.type === "replace") {
        return renderDiffChar(operation.actual, "is-miss");
      }
      if (operation.type === "insert") {
        return renderDiffChar(operation.actual, "is-miss");
      }
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
  return values.map((value) => ({
    value,
    isWord: /[\p{L}\p{M}\p{N}]/u.test(value),
  }));
}

function needsSpaceBefore(token) {
  return !NO_SPACE_BEFORE.has(token);
}

function escapeHtml(value) {
  return String(value)
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
    if (index > 0 && needsSpaceBefore(token.value)) {
      html += " ";
    }

    if (token.isWord && hiddenSet.has(index) && !reveal) {
      html += `<span class="masked-word" style="--letters:${Math.max(token.value.length, 2)}"></span>`;
      return;
    }

    const classes = [];
    if (token.isWord && hiddenSet.has(index) && highlightHidden) {
      classes.push("token-highlight");
    }

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

  if (!wordIndexes.length) {
    return [];
  }

  const safeCount = clamp(requestedCount, 1, Math.max(1, wordIndexes.length - 1));
  const primary = wordIndexes.filter(({ token }) => {
    const normalized = normalizeText(token.value);
    return token.value.length > 3 && !STOPWORDS.has(normalized);
  });
  const secondary = wordIndexes.filter(({ token }) => token.value.length > 2);
  const tertiary = wordIndexes;

  const chosen = [];
  const poolOrder = [primary, secondary, tertiary];

  poolOrder.forEach((pool) => {
    const unused = pool.filter(({ index }) => !chosen.some((item) => item.index === index));
    pickRandomItems(unused, safeCount - chosen.length).forEach((item) => {
      if (chosen.length < safeCount) {
        chosen.push(item);
      }
    });
  });

  return chosen
    .slice(0, safeCount)
    .map(({ index }) => index)
    .sort((left, right) => left - right);
}

function getCurrentElapsedMs() {
  if (!currentAttempt) {
    return 0;
  }

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
  if (!liveInterval) {
    liveInterval = window.setInterval(tickAttempt, 100);
  }
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

function getAverageAccuracy(stats) {
  return average(stats.totalAccuracy, stats.attempts);
}

function getAverageWpm(stats) {
  return average(stats.totalWpm, stats.attempts);
}

function computeTrend() {
  const history = state.history;
  if (history.length < RECENT_WINDOW) {
    return {
      label: "Waiting for attempts",
      detail: `Need ${RECENT_WINDOW} scored reps.`,
    };
  }

  const recent = history.slice(-RECENT_WINDOW);
  const previous = history.slice(-(RECENT_WINDOW * 2), -RECENT_WINDOW);
  const recentAverage = average(
    recent.reduce((total, item) => total + item.accuracy, 0),
    recent.length
  );

  if (!previous.length) {
    return {
      label: "First block complete",
      detail: `${formatPercent(recentAverage)} across the last ${recent.length} reps.`,
    };
  }

  const previousAverage = average(
    previous.reduce((total, item) => total + item.accuracy, 0),
    previous.length
  );
  const delta = recentAverage - previousAverage;

  if (delta >= 2.5) {
    return {
      label: "Sharpening",
      detail: `Accuracy up ${delta.toFixed(1)} points.`,
    };
  }

  if (delta <= -2.5) {
    return {
      label: "Slipping",
      detail: `Accuracy down ${Math.abs(delta).toFixed(1)} points.`,
    };
  }

  return {
    label: "Stable",
    detail: `Within ${Math.abs(delta).toFixed(1)} points of the last block.`,
  };
}

function getSessionBadge() {
  if (session.attempts < 3) {
    return "Fresh run";
  }

  const avgAccuracy = average(session.totalAccuracy, session.attempts);
  const avgWpm = average(session.totalWpm, session.attempts);

  if (avgAccuracy >= 97 && avgWpm >= 16) {
    return "Locked in";
  }

  if (avgAccuracy >= 93) {
    return "Clean run";
  }

  if (avgAccuracy >= 88) {
    return "Settling in";
  }

  return "Dig in";
}

function pickSentence(lane) {
  const ranked = SENTENCES.map((sentence) => {
    const stats = state.bySentence[sentence.id].byMode[lane];
    const avgAccuracy = getAverageAccuracy(stats);
    const avgWpm = getAverageWpm(stats);
    const freshnessPenalty = stats.lastSeenAt ? Math.min((Date.now() - stats.lastSeenAt) / 60000, 240) : 80;
    const challenge =
      (stats.attempts ? 0 : 18) +
      (100 - avgAccuracy) * 0.7 +
      Math.max(0, 18 - avgWpm) * 0.8 +
      freshnessPenalty * 0.08;

    return {
      sentence,
      weight: Math.max(6, challenge),
    };
  });

  const totalWeight = ranked.reduce((total, item) => total + item.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const item of ranked) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.sentence;
    }
  }

  return ranked[0].sentence;
}

function createAttempt({ sentence = null, hiddenIndexes = null, mode = getMode(), lane = getPracticeLane(mode) } = {}) {
  const sentenceChoice = sentence || pickSentence(lane);
  const hiddenCount = getHiddenCountForMode(mode);
  const previewMs = getPreviewMs(mode);
  const tokens = tokenizeSentence(sentenceChoice.text);

  currentAttempt = {
    sentence: sentenceChoice,
    mode: lane,
    uiMode: mode,
    tokens,
    hiddenCount,
    hiddenIndexes: hiddenCount ? hiddenIndexes || pickHiddenIndexes(tokens, hiddenCount) : [],
    phase: mode === "copy" ? "typing" : "preview",
    previewEndsAt: mode === "copy" ? 0 : Date.now() + previewMs,
    remainingPreviewMs: mode === "copy" ? 0 : previewMs,
    elapsedMs: 0,
    timerStartedAt: mode === "copy" ? Date.now() : 0,
    errors: 0,
    result: null,
  };

  elements.sentenceInput.value = "";
  elements.sentenceInput.disabled = mode !== "copy";
  elements.layoutHint.classList.add("hidden");

  if (mode === "copy") {
    window.setTimeout(() => {
      elements.sentenceInput.focus();
    }, 0);
  } else {
    blurActiveElement();
  }

  ensureLiveInterval();
  render();
}

function beginTypingPhase() {
  if (!currentAttempt) {
    return;
  }

  currentAttempt.phase = "typing";
  currentAttempt.timerStartedAt = Date.now();
  currentAttempt.remainingPreviewMs = 0;
  elements.sentenceInput.disabled = false;
  window.setTimeout(() => {
    elements.sentenceInput.focus();
  }, 0);
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
      window.setTimeout(() => {
        elements.sentenceInput.focus();
      }, 0);
    }

    ensureLiveInterval();
    render();
    return;
  }

  if (currentAttempt.phase === "review") {
    createAttempt();
    return;
  }

  if (currentAttempt.phase === "typing") {
    elements.sentenceInput.focus();
  }
}

function pauseAttempt() {
  if (!currentAttempt) {
    return;
  }

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

  stopLiveInterval();
  blurActiveElement();
  render();
}

function nextSentence() {
  stopLiveInterval();
  createAttempt();
}

function replayCurrentSentence() {
  if (!currentAttempt) {
    return;
  }

  stopLiveInterval();
  createAttempt({
    sentence: currentAttempt.sentence,
    hiddenIndexes: currentAttempt.hiddenIndexes,
    mode: currentAttempt.uiMode,
    lane: currentAttempt.mode,
  });
}

function resetProgress() {
  const confirmed = window.confirm("Reset all sentence progress on this device?");
  if (!confirmed) {
    return;
  }

  stopLiveInterval();
  state = createDefaultState(Date.now());
  session = createSession();
  currentAttempt = null;
  elements.resetMenu?.removeAttribute("open");
  saveState();
  render();
}

function clearInput() {
  elements.sentenceInput.value = "";
  elements.layoutHint.classList.add("hidden");
  renderPracticePanel();
}

function restartCurrentSentence(mode = getMode()) {
  if (!currentAttempt) {
    render();
    return;
  }

  stopLiveInterval();
  createAttempt({
    sentence: currentAttempt.sentence,
    mode,
    lane: getPracticeLane(mode),
  });
}

function setMode(mode) {
  if (!UI_MODE_META[mode] || mode === getMode()) {
    return;
  }

  state.settings.mode = mode;
  saveState();
  restartCurrentSentence(mode);
}

function adjustHiddenCount(delta) {
  const nextValue = clamp(state.settings.hiddenWordCount + delta, 1, MAX_HIDDEN_WORDS);
  if (nextValue === state.settings.hiddenWordCount) {
    return;
  }

  state.settings.hiddenWordCount = nextValue;
  saveState();

  if (getMode() === "flash") {
    restartCurrentSentence("flash");
  } else {
    render();
  }
}

function adjustPreviewSeconds(delta) {
  const nextValue = clamp(getPreviewSeconds() + delta, MIN_PREVIEW_SECONDS, MAX_PREVIEW_SECONDS);
  if (nextValue === state.settings.previewSeconds) {
    return;
  }

  state.settings.previewSeconds = nextValue;
  saveState();

  if (getMode() === "flash") {
    restartCurrentSentence("flash");
  } else {
    render();
  }
}

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
  if (!currentAttempt || currentAttempt.phase !== "typing") {
    return;
  }

  const typedText = elements.sentenceInput.value.trim();
  if (!typedText) {
    return;
  }

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
    sentenceId: currentAttempt.sentence.id,
    mode: currentAttempt.mode,
    accuracy,
    wpm,
    timeMs: currentAttempt.elapsedMs,
    errors: currentAttempt.errors,
    clean: accuracy >= CLEAN_THRESHOLD,
    at: Date.now(),
    typedText: elements.sentenceInput.value.trim(),
  };

  currentAttempt.phase = "review";
  currentAttempt.result = result;
  elements.sentenceInput.disabled = true;
  stopLiveInterval();
  applyResult(result);
  saveState();
  render();
  window.setTimeout(() => {
    try {
      elements.advanceButton.scrollIntoView({ block: "nearest", inline: "nearest" });
    } catch {
      elements.advanceButton.scrollIntoView();
    }

    try {
      elements.advanceButton.focus({ preventScroll: true });
    } catch {
      elements.advanceButton.focus();
    }
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
  if (result.clean) {
    state.totals.cleanAttempts += 1;
  }

  const modeStats = state.byMode[result.mode];
  modeStats.attempts += 1;
  modeStats.totalAccuracy += result.accuracy;
  modeStats.totalWpm += result.wpm;
  modeStats.totalMs += result.timeMs;
  if (result.clean) {
    modeStats.cleanAttempts += 1;
  }

  const sentenceStats = state.bySentence[result.sentenceId];
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
    sentenceId: result.sentenceId,
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

function renderHero() {
  const covered = SENTENCES.filter((sentence) => state.bySentence[sentence.id].attempts > 0).length;
  const modeCovered = SENTENCES.filter((sentence) => getSentenceStatsForView(sentence.id).attempts > 0).length;
  const trend = computeTrend();
  const modeLabel = UI_MODE_META[getMode()].label;

  elements.coverageCount.textContent = `${covered} / ${SENTENCES.length}`;
  elements.coverageDetail.textContent = `${modeCovered} touched in ${modeLabel}.`;
  elements.recentTrend.textContent = trend.label;
  elements.recentTrendDetail.textContent = trend.detail;
}

function renderPracticePanel() {
  const attempt = currentAttempt;
  const mode = getMode();
  const flashWordCount = clamp(state.settings.hiddenWordCount, 1, MAX_HIDDEN_WORDS);
  const previewSeconds = getPreviewSeconds();
  const hasInput = Boolean(elements.sentenceInput.value.trim());
  const isReview = attempt?.phase === "review";

  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  elements.settingsRow.classList.toggle("hidden", mode === "copy");
  elements.missingCount.textContent = String(flashWordCount);
  elements.missingMinus.disabled = flashWordCount <= 1;
  elements.missingPlus.disabled = flashWordCount >= MAX_HIDDEN_WORDS;
  elements.previewSeconds.textContent = `${previewSeconds}s`;
  elements.previewMinus.disabled = previewSeconds <= MIN_PREVIEW_SECONDS;
  elements.previewPlus.disabled = previewSeconds >= MAX_PREVIEW_SECONDS;

  if (!attempt) {
    elements.statusPill.className = "status-pill idle";
    elements.statusPill.textContent = "Paused";
    elements.countdownPill.textContent = "Ready";
    elements.promptStage.className = "prompt-stage idle";
    elements.promptStage.classList.remove("hidden");
    elements.entryPanel.classList.remove("hidden");
    elements.englishGloss.textContent = "Start to load the first sentence.";
    elements.sentenceDisplay.textContent = "Press Start to begin.";
    elements.hiddenWordsRow.classList.add("hidden");
    elements.hiddenWordsRow.innerHTML = "";
    elements.liveTimer.textContent = "0.0s";
    elements.attemptErrors.textContent = "0";
    elements.currentStreak.textContent = String(session.currentStreak);
    elements.feedbackMessage.textContent = UI_MODE_META[mode].summary;
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
  elements.englishGloss.textContent = attempt.sentence.english;

  if (isPreview) {
    elements.countdownPill.textContent = `${(attempt.remainingPreviewMs / 1000).toFixed(1)}s`;
    elements.sentenceDisplay.innerHTML = renderSentenceHtml(attempt.tokens);
    elements.feedbackMessage.textContent = "Memorize it.";
  } else if (isTyping || isPaused) {
    elements.countdownPill.textContent =
      mode === "copy" ? "Visible" : `${attempt.hiddenCount} blank${attempt.hiddenCount === 1 ? "" : "s"}`;
    elements.sentenceDisplay.innerHTML =
      mode === "copy"
        ? renderSentenceHtml(attempt.tokens)
        : renderSentenceHtml(attempt.tokens, attempt.hiddenIndexes);
    elements.feedbackMessage.textContent = isPaused
      ? "Paused."
      : mode === "copy"
        ? "Type what you see."
        : "Type from memory.";
  } else if (isReview) {
    elements.countdownPill.textContent = "Saved";
    elements.sentenceDisplay.innerHTML = renderSentenceHtml(attempt.tokens, attempt.hiddenIndexes, {
      reveal: true,
      highlightHidden: attempt.uiMode !== "copy",
    });
    elements.feedbackMessage.textContent = "Scored.";
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
  const reviewNote = currentAttempt.uiMode === "copy"
    ? "Copy rep."
    : hiddenWords
      ? `Hidden: ${hiddenWords}.`
      : `${currentAttempt.hiddenCount} blank${currentAttempt.hiddenCount === 1 ? "" : "s"}.`;

  elements.resultCard.classList.add("is-review");
  elements.resultSummary.textContent = result.clean ? "Clean" : "Retry";
  elements.resultTitle.textContent = `${formatPercent(result.accuracy)} accuracy · ${formatWpm(result.wpm)}`;
  elements.resultBody.textContent = `${result.clean ? "Clean hit." : "Another pass recommended."} ${reviewNote}`;
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
    session.attempts > 0 ? `${session.attempts} sentence${session.attempts === 1 ? "" : "s"} in this run` : "Session average";
  elements.sessionAverageSpeed.textContent = formatWpm(sessionAverageWpm);
  elements.sessionBestStreak.textContent = `Best streak: ${session.bestStreak}`;
  elements.lifetimeAverageAccuracy.textContent = formatPercent(lifetimeAverageAccuracy);
  elements.lifetimeAverageSpeed.textContent = `${formatWpm(lifetimeAverageWpm)} lifetime speed`;
  elements.lifetimeTotals.textContent = `${state.totals.attempts} attempts | ${formatStudyTime(state.totals.totalMs)} studied`;
}

function renderFocusPanel() {
  const mode = getMode();
  const ranked = SENTENCES.map((sentence) => {
    const stats = getSentenceStatsForView(sentence.id, mode);
    const avgAccuracy = getAverageAccuracy(stats);
    const avgWpm = getAverageWpm(stats);
    const freshness = stats.lastSeenAt ? Math.min((Date.now() - stats.lastSeenAt) / 60000, 240) : 120;
    const weight =
      (stats.attempts ? 0 : 24) +
      (100 - avgAccuracy) * 0.8 +
      Math.max(0, 16 - avgWpm) +
      freshness * 0.05;

    return {
      sentence,
      stats,
      avgAccuracy,
      avgWpm,
      weight,
    };
  })
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 4);

  elements.focusSentences.innerHTML = ranked
    .map(({ sentence, stats, avgAccuracy, avgWpm }) => {
      const meta = stats.attempts
        ? `${formatPercent(avgAccuracy)} avg accuracy · ${formatWpm(avgWpm)}`
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

function renderModeStats() {
  elements.modeStatsGrid.innerHTML = UI_MODE_ORDER.map((mode) => {
    const stats = getModeStatsForView(mode);
    const isCurrent = mode === getMode();
    return `
      <article class="mode-stat-card${isCurrent ? " is-current" : ""}">
        <p class="mode-stat-label">${UI_MODE_META[mode].label}</p>
        <h3>${UI_MODE_META[mode].title}</h3>
        <div class="mode-stat-rows">
          <div class="mode-stat-row">
            <span>Attempts</span>
            <strong>${stats.attempts}</strong>
          </div>
          <div class="mode-stat-row">
            <span>Avg accuracy</span>
            <strong>${formatPercent(getAverageAccuracy(stats))}</strong>
          </div>
          <div class="mode-stat-row">
            <span>Avg speed</span>
            <strong>${formatWpm(getAverageWpm(stats))}</strong>
          </div>
          <div class="mode-stat-row">
            <span>Clean hits</span>
            <strong>${formatWholePercent(average(stats.cleanAttempts * 100, stats.attempts))}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderSentenceBank() {
  const mode = getMode();
  const sectionMeta = {
    new: { title: "New", empty: "No new lines right now." },
    progress: { title: "In progress", empty: "Nothing in rotation." },
    mastered: { title: "Mastered", empty: "No mastered lines yet." },
  };

  const items = SENTENCES.map((sentence, index) => {
    const stats = getSentenceStatsForView(sentence.id, mode);
    const attempts = stats.attempts;
    const mastery = attempts ? getMasteryPercent(stats) : 0;
    const section = getSentenceSection(stats);
    const isCurrent = currentAttempt?.sentence.id === sentence.id;

    return {
      sentence,
      stats,
      attempts,
      mastery,
      section,
      isCurrent,
      index,
    };
  });

  const sortSectionItems = (sectionItems, section) =>
    sectionItems.sort((left, right) => {
      if (left.isCurrent !== right.isCurrent) {
        return left.isCurrent ? -1 : 1;
      }

      if (section === "progress") {
        return left.mastery - right.mastery || left.index - right.index;
      }

      if (section === "mastered") {
        return right.mastery - left.mastery || right.attempts - left.attempts || left.index - right.index;
      }

      return left.index - right.index;
    });

  elements.sentenceBank.innerHTML = Object.entries(sectionMeta)
    .map(([section, meta]) => {
      const sectionItems = sortSectionItems(
        items.filter((item) => item.section === section),
        section
      );

      const listHtml = sectionItems.length
        ? sectionItems
            .map(({ sentence, attempts, mastery, isCurrent }) => `
              <article class="bank-item is-${section}${isCurrent ? " is-current" : ""}">
                <div class="bank-item-top">
                  <p class="bank-russian">${escapeHtml(sentence.text)}</p>
                  <span class="bank-score-pill">${attempts ? `${mastery}%` : "New"}</span>
                </div>
                <div class="bank-meter" aria-hidden="true">
                  <span style="width:${attempts ? mastery : 6}%"></span>
                </div>
                <div class="bank-meta-row">
                  <span>${attempts ? formatRepCount(attempts) : "Not started"}</span>
                  <span class="${isCurrent ? "bank-current-tag" : ""}">${isCurrent ? "Current" : meta.title}</span>
                </div>
              </article>
            `)
            .join("")
        : `<p class="bank-empty">${meta.empty}</p>`;

      return `
        <section class="bank-section">
          <div class="bank-section-header">
            <span class="bank-section-title">${meta.title}</span>
            <span class="bank-section-count">${sectionItems.length}</span>
          </div>
          <div class="bank-list">
            ${listHtml}
          </div>
        </section>
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

  elements.startButton.classList.toggle("hidden", !showStart);
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
  elements.replayButton.disabled = !isReview;
}

function render() {
  renderHero();
  renderPracticePanel();
  renderResultCard();
  renderSessionPanel();
  renderFocusPanel();
  renderModeStats();
  renderSentenceBank();
  renderButtons();
}

function handleBeforeInput(event) {
  if (!currentAttempt || currentAttempt.phase !== "typing") {
    return;
  }

  if (event.inputType !== "insertText") {
    return;
  }

  const typed = event.data || "";
  if (typed.length !== 1) {
    return;
  }

  const input = elements.sentenceInput;
  if (input.selectionStart !== input.selectionEnd || input.selectionStart !== input.value.length) {
    return;
  }

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

function handleKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    scoreAttempt();
  }
}

function updateKeyboardState() {
  if (!window.visualViewport) {
    return;
  }

  const currentHeight = window.visualViewport.height;
  if (currentHeight > visualViewportBaseline * 0.9) {
    visualViewportBaseline = currentHeight;
  }

  const nextKeyboardOpen = currentHeight < visualViewportBaseline * 0.75;
  if (nextKeyboardOpen === keyboardOpen) {
    return;
  }

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
  if (event.defaultPrevented) {
    return;
  }

  const target = event.target;
  const textEntry = isTextEntryTarget(target);

  if (event.key === "Escape") {
    if (currentAttempt && (currentAttempt.phase === "typing" || currentAttempt.phase === "preview")) {
      event.preventDefault();
      pauseAttempt();
    }
    return;
  }

  if (textEntry || isInteractiveShortcutTarget(target)) {
    return;
  }

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

function attachEvents() {
  elements.startButton.addEventListener("click", startOrResume);
  elements.pauseButton.addEventListener("click", pauseAttempt);
  elements.nextButton.addEventListener("click", nextSentence);
  elements.resetButton.addEventListener("click", resetProgress);
  elements.scoreButton.addEventListener("click", scoreAttempt);
  elements.clearButton.addEventListener("click", clearInput);
  elements.advanceButton.addEventListener("click", nextSentence);
  elements.replayButton.addEventListener("click", replayCurrentSentence);
  elements.missingMinus.addEventListener("click", () => adjustHiddenCount(-1));
  elements.missingPlus.addEventListener("click", () => adjustHiddenCount(1));
  elements.previewMinus.addEventListener("click", () => adjustPreviewSeconds(-1));
  elements.previewPlus.addEventListener("click", () => adjustPreviewSeconds(1));
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  elements.sentenceInput.addEventListener("beforeinput", handleBeforeInput);
  elements.sentenceInput.addEventListener("input", handleInput);
  elements.sentenceInput.addEventListener("keydown", handleKeydown);
  elements.sentenceInput.addEventListener("paste", (event) => {
    event.preventDefault();
  });
  document.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("online", () => {
    void syncStateFromServer();
  });
  window.addEventListener("resize", updateKeyboardState);
  window.visualViewport?.addEventListener("resize", updateKeyboardState);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void syncStateFromServer();
    }
  });
}

attachEvents();
updateKeyboardState();
render();
void syncStateFromServer();
