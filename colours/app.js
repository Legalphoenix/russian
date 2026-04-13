const STORAGE_KEY = "russian-colour-studio-state-v1";

const FORM_ORDER = ["masculine", "feminine", "neuter", "plural"];
const FORM_META = {
  masculine: {
    label: "Masculine singular",
    short: "Masc.",
    note: "Dictionary form first.",
    grammarHint: "The noun is masculine singular.",
  },
  feminine: {
    label: "Feminine singular",
    short: "Fem.",
    note: "Watch the feminine ending.",
    grammarHint: "The noun is feminine singular.",
  },
  neuter: {
    label: "Neuter singular",
    short: "Neut.",
    note: "Listen for the neuter vowel shape.",
    grammarHint: "The noun is neuter singular.",
  },
  plural: {
    label: "Plural",
    short: "Plural",
    note: "Plural keeps the family but changes the ending.",
    grammarHint: "The noun is plural.",
  },
};

const PHASE_ORDER = ["visual", "agreement", "mastery"];
const PHASE_META = {
  visual: {
    title: "Step 1: Swatch to word",
    pill: "Visual",
    badge: "Swatch read",
    summary: "Manual: Swatch to word",
  },
  agreement: {
    title: "Step 2: Agreement lab",
    pill: "Endings",
    badge: "Ending lab",
    summary: "Manual: Agreement lab",
  },
  mastery: {
    title: "Step 3: Listening + mixed mastery",
    pill: "Mastery",
    badge: "Mixed mastery",
    summary: "Manual: Listening + mastery",
  },
};

const MODE_META = {
  visual: {
    badge: "Swatch read",
    label: "Colour swatch",
    short: "Eye",
  },
  agreement: {
    badge: "Ending lab",
    label: "Agreement cue",
    short: "Ending",
  },
  audio: {
    badge: "Listening",
    label: "Listening cue",
    short: "Ear",
  },
};

const colourFamilies = [
  {
    id: "red",
    english: "red",
    swatch: "#d7443f",
    swatchDeep: "#9f2d31",
    forms: {
      masculine: "красный",
      feminine: "красная",
      neuter: "красное",
      plural: "красные",
    },
    examples: {
      masculine: { phrase: "красный телефон", noun: "телефон", gloss: "telephone" },
      feminine: { phrase: "красная курица", noun: "курица", gloss: "chicken" },
      neuter: { phrase: "красное вино", noun: "вино", gloss: "wine" },
      plural: { phrase: "красные письма", noun: "письма", gloss: "letters" },
    },
  },
  {
    id: "orange",
    english: "orange",
    swatch: "#ef8b27",
    swatchDeep: "#bc5a18",
    forms: {
      masculine: "оранжевый",
      feminine: "оранжевая",
      neuter: "оранжевое",
      plural: "оранжевые",
    },
    examples: {
      masculine: { phrase: "оранжевый апельсин", noun: "апельсин", gloss: "orange fruit" },
      feminine: { phrase: "оранжевая машина", noun: "машина", gloss: "car" },
      neuter: { phrase: "оранжевое поле", noun: "поле", gloss: "field" },
      plural: { phrase: "оранжевые леса", noun: "леса", gloss: "forests" },
    },
  },
  {
    id: "yellow",
    english: "yellow",
    swatch: "#d7b322",
    swatchDeep: "#9c7f12",
    forms: {
      masculine: "жёлтый",
      feminine: "жёлтая",
      neuter: "жёлтое",
      plural: "жёлтые",
    },
    examples: {
      masculine: { phrase: "жёлтый карандаш", noun: "карандаш", gloss: "pencil" },
      feminine: { phrase: "жёлтая ваза", noun: "ваза", gloss: "vase" },
      neuter: { phrase: "жёлтое пятно", noun: "пятно", gloss: "spot" },
      plural: { phrase: "жёлтые сумки", noun: "сумки", gloss: "bags" },
    },
  },
  {
    id: "green",
    english: "green",
    swatch: "#4c954d",
    swatchDeep: "#2d6d35",
    forms: {
      masculine: "зелёный",
      feminine: "зелёная",
      neuter: "зелёное",
      plural: "зелёные",
    },
    examples: {
      masculine: { phrase: "зелёный дом", noun: "дом", gloss: "house" },
      feminine: { phrase: "зелёная трава", noun: "трава", gloss: "grass" },
      neuter: { phrase: "зелёное дерево", noun: "дерево", gloss: "tree" },
      plural: { phrase: "зелёные столы", noun: "столы", gloss: "tables" },
    },
  },
  {
    id: "light-blue",
    english: "light blue",
    swatch: "#6db0ea",
    swatchDeep: "#4784c0",
    forms: {
      masculine: "голубой",
      feminine: "голубая",
      neuter: "голубое",
      plural: "голубые",
    },
    examples: {
      masculine: { phrase: "голубой стол", noun: "стол", gloss: "table" },
      feminine: { phrase: "голубая речка", noun: "речка", gloss: "river" },
      neuter: { phrase: "голубое небо", noun: "небо", gloss: "sky" },
      plural: { phrase: "голубые книги", noun: "книги", gloss: "books" },
    },
  },
  {
    id: "blue",
    english: "blue",
    swatch: "#356ad8",
    swatchDeep: "#21459c",
    forms: {
      masculine: "синий",
      feminine: "синяя",
      neuter: "синее",
      plural: "синие",
    },
    examples: {
      masculine: { phrase: "синий кит", noun: "кит", gloss: "whale" },
      feminine: { phrase: "синяя вода", noun: "вода", gloss: "water" },
      neuter: { phrase: "синее море", noun: "море", gloss: "sea" },
      plural: { phrase: "синие машины", noun: "машины", gloss: "cars" },
    },
  },
  {
    id: "violet",
    english: "violet",
    swatch: "#8c61da",
    swatchDeep: "#60409f",
    forms: {
      masculine: "фиолетовый",
      feminine: "фиолетовая",
      neuter: "фиолетовое",
      plural: "фиолетовые",
    },
    examples: {
      masculine: { phrase: "фиолетовый цветок", noun: "цветок", gloss: "flower" },
      feminine: { phrase: "фиолетовая ручка", noun: "ручка", gloss: "pen" },
      neuter: { phrase: "фиолетовое одеяло", noun: "одеяло", gloss: "blanket" },
      plural: { phrase: "фиолетовые лампы", noun: "лампы", gloss: "lamps" },
    },
  },
  {
    id: "black",
    english: "black",
    swatch: "#1f2024",
    swatchDeep: "#070708",
    forms: {
      masculine: "чёрный",
      feminine: "чёрная",
      neuter: "чёрное",
      plural: "чёрные",
    },
    examples: {
      masculine: { phrase: "чёрный кофе", noun: "кофе", gloss: "coffee" },
      feminine: { phrase: "чёрная стена", noun: "стена", gloss: "wall" },
      neuter: { phrase: "чёрное зеркало", noun: "зеркало", gloss: "mirror" },
      plural: { phrase: "чёрные сумки", noun: "сумки", gloss: "bags" },
    },
  },
  {
    id: "white",
    english: "white",
    swatch: "#f4efe7",
    swatchDeep: "#d4cec5",
    forms: {
      masculine: "белый",
      feminine: "белая",
      neuter: "белое",
      plural: "белые",
    },
    examples: {
      masculine: { phrase: "белый кот", noun: "кот", gloss: "cat" },
      feminine: { phrase: "белая собака", noun: "собака", gloss: "dog" },
      neuter: { phrase: "белое одеяло", noun: "одеяло", gloss: "blanket" },
      plural: { phrase: "белые одеяла", noun: "одеяла", gloss: "blankets" },
    },
  },
  {
    id: "grey",
    english: "grey",
    swatch: "#8f8c86",
    swatchDeep: "#67645f",
    forms: {
      masculine: "серый",
      feminine: "серая",
      neuter: "серое",
      plural: "серые",
    },
    examples: {
      masculine: { phrase: "серый волк", noun: "волк", gloss: "wolf" },
      feminine: { phrase: "серая лошадь", noun: "лошадь", gloss: "horse" },
      neuter: { phrase: "серое пятно", noun: "пятно", gloss: "spot" },
      plural: { phrase: "серые пятна", noun: "пятна", gloss: "spots" },
    },
  },
  {
    id: "brown",
    english: "brown",
    swatch: "#7b4e32",
    swatchDeep: "#51311f",
    forms: {
      masculine: "коричневый",
      feminine: "коричневая",
      neuter: "коричневое",
      plural: "коричневые",
    },
    examples: {
      masculine: { phrase: "коричневый чемодан", noun: "чемодан", gloss: "suitcase" },
      feminine: { phrase: "коричневая куртка", noun: "куртка", gloss: "jacket" },
      neuter: { phrase: "коричневое жильё", noun: "жильё", gloss: "housing" },
      plural: { phrase: "коричневые волки", noun: "волки", gloss: "wolves" },
    },
  },
  {
    id: "pink",
    english: "pink",
    swatch: "#e481b0",
    swatchDeep: "#bf5b8f",
    forms: {
      masculine: "розовый",
      feminine: "розовая",
      neuter: "розовое",
      plural: "розовые",
    },
    examples: {
      masculine: { phrase: "розовый маникюр", noun: "маникюр", gloss: "manicure" },
      feminine: { phrase: "розовая юбка", noun: "юбка", gloss: "skirt" },
      neuter: { phrase: "розовое платье", noun: "платье", gloss: "dress" },
      plural: { phrase: "розовые платья", noun: "платья", gloss: "dresses" },
    },
  },
];

const familyById = Object.fromEntries(colourFamilies.map((family) => [family.id, family]));
const allFamilyIds = colourFamilies.map((family) => family.id);

function buildFamilyOptions(index) {
  const total = allFamilyIds.length;
  return [
    allFamilyIds[index],
    allFamilyIds[(index + total - 1) % total],
    allFamilyIds[(index + 1) % total],
    allFamilyIds[(index + 5) % total],
  ];
}

const visualItems = colourFamilies.map((family, index) => ({
  id: `visual-${family.id}`,
  phase: "visual",
  kind: "visual",
  mode: "visual",
  familyId: family.id,
  answerKey: family.id,
  options: buildFamilyOptions(index),
}));

const agreementItems = colourFamilies.flatMap((family) =>
  FORM_ORDER.map((formKey) => ({
    id: `agreement-${family.id}-${formKey}`,
    phase: "agreement",
    kind: "agreement",
    mode: "agreement",
    familyId: family.id,
    formKey,
    answerKey: family.forms[formKey],
    options: FORM_ORDER.map((key) => family.forms[key]),
  })),
);

const audioItems = colourFamilies.flatMap((family, index) =>
  FORM_ORDER.map((formKey) => ({
    id: `audio-${family.id}-${formKey}`,
    phase: "mastery",
    kind: "audio",
    mode: "audio",
    familyId: family.id,
    formKey,
    answerKey: family.id,
    options: buildFamilyOptions(index),
  })),
);

const itemsById = Object.fromEntries([...visualItems, ...agreementItems, ...audioItems].map((item) => [item.id, item]));

const el = {
  cardsSolved: document.querySelector("#cardsSolved"),
  currentStreak: document.querySelector("#currentStreak"),
  accuracyValue: document.querySelector("#accuracyValue"),
  averageTimeValue: document.querySelector("#averageTimeValue"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  spectrumStrip: document.querySelector("#spectrumStrip"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phasePill: document.querySelector("#phasePill"),
  phaseProgress: document.querySelector("#phaseProgress"),
  modeBadge: document.querySelector("#modeBadge"),
  liveTimer: document.querySelector("#liveTimer"),
  audioButton: document.querySelector("#audioButton"),
  pauseTimerButton: document.querySelector("#pauseTimerButton"),
  promptLabel: document.querySelector("#promptLabel"),
  promptTitle: document.querySelector("#promptTitle"),
  promptStage: document.querySelector("#promptStage"),
  subPrompt: document.querySelector("#subPrompt"),
  choiceNudge: document.querySelector("#choiceNudge"),
  hintButton: document.querySelector("#hintButton"),
  hintText: document.querySelector("#hintText"),
  optionsGrid: document.querySelector("#optionsGrid"),
  feedbackCard: document.querySelector("#feedbackCard"),
  nextButton: document.querySelector("#nextButton"),
  masteryGrid: document.querySelector("#masteryGrid"),
  weakSpotList: document.querySelector("#weakSpotList"),
  atlasGrid: document.querySelector("#atlasGrid"),
  phaseOverrideSelect: document.querySelector("#phaseOverrideSelect"),
  settingsSummary: document.querySelector("#settingsSummary"),
  memoryNote: document.querySelector("#memoryNote"),
};

function blankMetric() {
  return {
    attempts: 0,
    correct: 0,
    wrong: 0,
    totalMs: 0,
    bestMs: null,
  };
}

function blankItemStats() {
  return {
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    dueAt: 0,
    lastTurn: -1,
    totalMs: 0,
    bestMs: null,
  };
}

function blankFamilyStats() {
  return {
    attempts: 0,
    correct: 0,
    wrong: 0,
    totalMs: 0,
    bestMs: null,
    modeStats: {
      visual: blankMetric(),
      agreement: blankMetric(),
      audio: blankMetric(),
    },
    formStats: Object.fromEntries(FORM_ORDER.map((formKey) => [formKey, blankMetric()])),
  };
}

const defaultState = {
  currentPhase: "visual",
  phaseOverride: "auto",
  turn: 0,
  currentItemId: null,
  currentOptionOrder: [],
  currentSolved: false,
  currentChoice: null,
  hintVisible: false,
  cardStartedAt: 0,
  cardElapsedOffsetMs: 0,
  timerPaused: false,
  lastResponseMs: null,
  savedAt: null,
  totalAnswered: 0,
  totalCorrect: 0,
  totalResponseMs: 0,
  streak: 0,
  itemStats: {},
  familyStats: Object.fromEntries(colourFamilies.map((family) => [family.id, blankFamilyStats()])),
};

let state = loadState();
let timerHandle = null;

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function safeNullableNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function mergeMetric(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  return {
    attempts: safeNumber(source.attempts),
    correct: safeNumber(source.correct),
    wrong: safeNumber(source.wrong),
    totalMs: safeNumber(source.totalMs),
    bestMs: safeNullableNumber(source.bestMs),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return mergeState(JSON.parse(raw));
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const merged = structuredClone(defaultState);

  merged.currentPhase = PHASE_ORDER.includes(source.currentPhase) ? source.currentPhase : "visual";
  merged.phaseOverride = source.phaseOverride === "auto" || PHASE_ORDER.includes(source.phaseOverride) ? source.phaseOverride : "auto";
  merged.turn = safeNumber(source.turn);
  merged.currentItemId = itemsById[source.currentItemId] ? source.currentItemId : null;
  merged.currentSolved = Boolean(source.currentSolved);
  merged.currentChoice = typeof source.currentChoice === "string" ? source.currentChoice : null;
  merged.hintVisible = Boolean(source.hintVisible);
  merged.cardStartedAt = safeNumber(source.cardStartedAt);
  merged.cardElapsedOffsetMs = safeNumber(source.cardElapsedOffsetMs);
  merged.timerPaused = Boolean(source.timerPaused);
  merged.lastResponseMs = safeNullableNumber(source.lastResponseMs);
  merged.savedAt = safeNullableNumber(source.savedAt);
  merged.totalAnswered = safeNumber(source.totalAnswered);
  merged.totalCorrect = safeNumber(source.totalCorrect);
  merged.totalResponseMs = safeNumber(source.totalResponseMs);
  merged.streak = safeNumber(source.streak);

  merged.currentOptionOrder = Array.isArray(source.currentOptionOrder)
    ? source.currentOptionOrder.filter((option) => typeof option === "string")
    : [];

  merged.itemStats = Object.fromEntries(
    Object.entries(source.itemStats || {})
      .filter(([itemId]) => itemsById[itemId])
      .map(([itemId, stats]) => {
        const itemSource = stats && typeof stats === "object" ? stats : {};
        return [
          itemId,
          {
            seen: safeNumber(itemSource.seen),
            correct: safeNumber(itemSource.correct),
            wrong: safeNumber(itemSource.wrong),
            streak: safeNumber(itemSource.streak),
            dueAt: safeNumber(itemSource.dueAt),
            lastTurn: safeNumber(itemSource.lastTurn, -1),
            totalMs: safeNumber(itemSource.totalMs),
            bestMs: safeNullableNumber(itemSource.bestMs),
          },
        ];
      }),
  );

  merged.familyStats = Object.fromEntries(
    colourFamilies.map((family) => {
      const familySource = source.familyStats?.[family.id] || {};
      return [
        family.id,
        {
          attempts: safeNumber(familySource.attempts),
          correct: safeNumber(familySource.correct),
          wrong: safeNumber(familySource.wrong),
          totalMs: safeNumber(familySource.totalMs),
          bestMs: safeNullableNumber(familySource.bestMs),
          modeStats: {
            visual: mergeMetric(familySource.modeStats?.visual),
            agreement: mergeMetric(familySource.modeStats?.agreement),
            audio: mergeMetric(familySource.modeStats?.audio),
          },
          formStats: Object.fromEntries(FORM_ORDER.map((formKey) => [formKey, mergeMetric(familySource.formStats?.[formKey])])),
        },
      ];
    }),
  );

  if (merged.currentItemId && !merged.currentSolved && !merged.timerPaused) {
    merged.cardStartedAt = Date.now();
    merged.lastResponseMs = null;
  }

  return merged;
}

function saveState() {
  state.savedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures and keep the session running.
  }
}

function ensureItemStats(itemId) {
  if (!state.itemStats[itemId]) {
    state.itemStats[itemId] = blankItemStats();
  }
  return state.itemStats[itemId];
}

function getActivePhase() {
  return state.phaseOverride === "auto" ? state.currentPhase : state.phaseOverride;
}

function getPoolForPhase(phase) {
  if (phase === "visual") return visualItems;
  if (phase === "agreement") return agreementItems;
  return [...audioItems, ...agreementItems, ...visualItems];
}

function getCurrentPool() {
  return getPoolForPhase(getActivePhase());
}

function currentItem() {
  return state.currentItemId ? itemsById[state.currentItemId] || null : null;
}

function itemMatchesActivePhase(item) {
  return getCurrentPool().some((candidate) => candidate.id === item.id);
}

function isValidOptionOrder(item) {
  return (
    Array.isArray(state.currentOptionOrder) &&
    state.currentOptionOrder.length === item.options.length &&
    item.options.every((option) => state.currentOptionOrder.includes(option))
  );
}

const phaseLabels = {
  visual: { title: "Swatch to Word", next: "Agreement Lab" },
  agreement: { title: "Agreement Lab", next: "Listening + Mastery" },
  mastery: { title: "Listening + Mastery", next: null },
};

function showPhaseBanner(fromPhase, toPhase) {
  const from = phaseLabels[fromPhase]?.title || fromPhase;
  const to = phaseLabels[toPhase]?.title || toPhase;
  const banner = document.createElement("div");
  banner.className = "phase-banner";
  banner.innerHTML = `<strong>${from} complete</strong><span>Advancing to ${to}</span>`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("is-visible"));
  setTimeout(() => {
    banner.classList.remove("is-visible");
    setTimeout(() => banner.remove(), 400);
  }, 2800);
}

function updatePhaseIfNeeded() {
  const before = state.currentPhase;

  if (state.currentPhase === "visual") {
    const ready = visualItems.every((item) => (state.itemStats[item.id]?.correct || 0) > 0);
    if (ready) state.currentPhase = "agreement";
  }

  if (state.currentPhase === "agreement") {
    const ready = agreementItems.every((item) => (state.itemStats[item.id]?.seen || 0) > 0);
    if (ready) state.currentPhase = "mastery";
  }

  if (state.currentPhase !== before && state.phaseOverride === "auto") {
    showPhaseBanner(before, state.currentPhase);
  }
}

function phaseProgressText() {
  const activePhase = getActivePhase();

  if (activePhase === "visual") {
    const solved = visualItems.filter((item) => (state.itemStats[item.id]?.correct || 0) > 0).length;
    return `${solved} / ${visualItems.length} swatches named`;
  }

  if (activePhase === "agreement") {
    const touched = agreementItems.filter((item) => (state.itemStats[item.id]?.seen || 0) > 0).length;
    return `${touched} / ${agreementItems.length} endings touched`;
  }

  const steady = colourFamilies.filter((family) => isFamilySteady(family.id)).length;
  return `${steady} / ${colourFamilies.length} families steady`;
}

function averageMs(metric) {
  return metric.attempts ? metric.totalMs / metric.attempts : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function speedScore(avgMs) {
  if (avgMs === null) return 0.12;
  return clamp((6500 - avgMs) / 4200, 0.05, 1);
}

function metricMastery(metric) {
  const attempts = metric.attempts;
  if (!attempts) return 0.12;
  const accuracy = metric.correct / attempts;
  const speed = speedScore(averageMs(metric));
  const reliability = Math.min(1, attempts / 5);
  return 0.08 + (accuracy * 0.7 + speed * 0.3) * 0.92 * reliability;
}

function familyMastery(familyId) {
  const stats = state.familyStats[familyId];
  const scores = [
    metricMastery(stats.modeStats.visual),
    metricMastery(stats.modeStats.agreement),
    ...FORM_ORDER.map((formKey) => metricMastery(stats.formStats[formKey])),
  ];

  if (stats.modeStats.audio.attempts > 0) {
    scores.push(metricMastery(stats.modeStats.audio));
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function formMastery(familyId, formKey) {
  return metricMastery(state.familyStats[familyId].formStats[formKey]);
}

function isFamilySteady(familyId) {
  const stats = state.familyStats[familyId];
  return (
    stats.modeStats.visual.attempts > 0 &&
    stats.modeStats.agreement.attempts > 0 &&
    stats.modeStats.audio.attempts > 0 &&
    familyMastery(familyId) >= 0.72
  );
}

function candidateScore(item, currentTurn) {
  const itemStats = ensureItemStats(item.id);
  const familyStats = state.familyStats[item.familyId];
  const familyScore = familyMastery(item.familyId);
  const formScore = item.formKey ? formMastery(item.familyId, item.formKey) : familyScore;
  const modeAverage = averageMs(familyStats.modeStats[item.mode]);
  const dueBonus = itemStats.dueAt <= currentTurn ? 12 : 0;
  const unseenBonus = itemStats.seen === 0 ? 9 : 0;
  const weakFamilyBonus = (1 - familyScore) * 11;
  const weakFormBonus = item.formKey ? (1 - formScore) * 7 : 0;
  const slowBonus = modeAverage ? Math.max(0, (modeAverage - 3400) / 420) : 4;
  const missBonus = itemStats.wrong * 2.7;
  const recencyPenalty = itemStats.lastTurn === currentTurn - 1 ? -10 : 0;

  return dueBonus + unseenBonus + weakFamilyBonus + weakFormBonus + slowBonus + missBonus + recencyPenalty + Math.random();
}

function pickNextItemId() {
  const pool = getCurrentPool();
  const currentTurn = state.turn;
  const ranked = [...pool]
    .sort((a, b) => candidateScore(b, currentTurn) - candidateScore(a, currentTurn))
    .filter((item) => ensureItemStats(item.id).lastTurn !== currentTurn);

  return ranked[0]?.id || pool[0]?.id || null;
}

function formatSeconds(ms) {
  if (!ms) return "0.0s";
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
}

function describeForms(family) {
  return FORM_ORDER.map((formKey) => family.forms[formKey]).join(" / ");
}

function swatchStyle(family) {
  return `--swatch:${family.swatch};--swatch-deep:${family.swatchDeep};`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formKeyForFamilyValue(family, formValue) {
  return FORM_ORDER.find((formKey) => family.forms[formKey] === formValue) || "masculine";
}

function promptTitleForItem(item) {
  if (item.kind === "visual") return "Which Russian colour family is this?";
  if (item.kind === "agreement") return "Match the ending to the noun.";
  return "Listen and choose the colour.";
}

function subPromptForItem(item) {
  const family = familyById[item.familyId];

  if (item.kind === "visual") {
    return "Choose the masculine dictionary form before you worry about endings.";
  }

  if (item.kind === "agreement") {
    const example = family.examples[item.formKey];
    return `${FORM_META[item.formKey].label}. Noun gloss: ${example.gloss}.`;
  }

  return "Tap listen, then choose the matching swatch. The spoken phrase includes the noun.";
}

function choiceNudgeForItem(item) {
  if (item.kind === "audio") return "Use the sound, not the text, to choose the swatch.";
  if (item.kind === "agreement") return "Pick the ending that matches the noun.";
  return "Tap the Russian colour family that matches the swatch.";
}

function hintForItem(item) {
  const family = familyById[item.familyId];

  if (item.kind === "visual") {
    return `Start with the base family: ${family.forms.masculine}.`;
  }

  if (item.kind === "agreement") {
    return `${FORM_META[item.formKey].grammarHint} ${family.examples[item.formKey].noun} needs ${family.forms[item.formKey]}.`;
  }

  return `Listen for the adjective root first. This family sounds like ${family.forms[item.formKey]}.`;
}

function stageMarkupForItem(item) {
  const family = familyById[item.familyId];

  if (item.kind === "visual") {
    return `
      <div class="swatch-stage">
        <div class="swatch-surface" style="${swatchStyle(family)}"></div>
        <p class="swatch-caption">Goal: see the hue, then recall the Russian family in its masculine dictionary form.</p>
      </div>
    `;
  }

  if (item.kind === "agreement") {
    const example = family.examples[item.formKey];
    return `
      <div class="agreement-stage">
        <div class="agreement-row">
          <div class="swatch-chip" style="${swatchStyle(family)}"></div>
          <div>
            <p class="sentence-blank"><span class="blank">___</span> ${escapeHtml(example.noun)}</p>
            <p class="stage-meta">${escapeHtml(FORM_META[item.formKey].label)} · ${escapeHtml(example.gloss)}</p>
          </div>
        </div>
        <p class="stage-note">Keep the colour family, only change the ending to agree with the noun.</p>
      </div>
    `;
  }

  return `
    <div class="audio-stage">
      <div class="audio-disc" aria-hidden="true"></div>
      <div>
        <p class="stage-note">Tap listen, then match the spoken colour phrase to the right swatch.</p>
        <p class="stage-meta">The full phrase is spoken. You are retrieving the colour family from sound.</p>
      </div>
    </div>
  `;
}

function getAnswerLabel(item) {
  if (item.kind === "agreement") return item.answerKey;
  return familyById[item.answerKey].forms.masculine;
}

function currentElapsedMs() {
  if (state.currentSolved) return state.lastResponseMs || 0;
  if (state.timerPaused) return state.cardElapsedOffsetMs || 0;
  return (state.cardElapsedOffsetMs || 0) + Math.max(0, Date.now() - (state.cardStartedAt || Date.now()));
}

function speedSummary(responseMs) {
  if (responseMs < 2600) return "That speed pushes this family toward automatic recall.";
  if (responseMs < 4200) return "Accurate, but there is still room to make the retrieval faster.";
  return "The answer landed, but the slow response keeps this family active for more review.";
}

function feedbackBodyForItem(item, correct) {
  const family = familyById[item.familyId];
  const responseMs = state.lastResponseMs || 0;

  if (item.kind === "visual") {
    if (correct) {
      return `This swatch belongs to the ${escapeHtml(family.forms.masculine)} family: ${escapeHtml(describeForms(family))}. ${speedSummary(responseMs)}`;
    }
    return `This hue belongs to ${escapeHtml(family.forms.masculine)}. Keep the family together: ${escapeHtml(describeForms(family))}. Misses return sooner than stable cards.`;
  }

  if (item.kind === "agreement") {
    const example = family.examples[item.formKey];
    if (correct) {
      return `${escapeHtml(example.noun)} is ${escapeHtml(FORM_META[item.formKey].label.toLowerCase())}, so the colour becomes ${escapeHtml(family.forms[item.formKey])}: ${escapeHtml(example.phrase)}. ${speedSummary(responseMs)}`;
    }
    return `${escapeHtml(example.noun)} is ${escapeHtml(FORM_META[item.formKey].label.toLowerCase())}, so the right form is ${escapeHtml(family.forms[item.formKey])}: ${escapeHtml(example.phrase)}.`;
  }

  const example = family.examples[item.formKey];
  if (correct) {
    return `You heard ${escapeHtml(example.phrase)}. The family is ${escapeHtml(family.forms.masculine)}, and the spoken form was ${escapeHtml(family.forms[item.formKey])}. ${speedSummary(responseMs)}`;
  }
  return `The audio phrase was ${escapeHtml(example.phrase)}. That maps back to the ${escapeHtml(family.forms.masculine)} family.`;
}

function optionMarkup(item, option) {
  const answer = item.answerKey;
  const selected = state.currentChoice === option;
  const solved = state.currentSolved;
  const disabled = solved || state.timerPaused;
  let classes = `option-button ${item.kind === "audio" ? "option-swatch" : "option-text"}`;

  if (selected) classes += " is-selected";
  if (solved && option === answer) classes += " is-correct";
  if (solved && selected && option !== answer) classes += " is-wrong";

  if (item.kind === "audio") {
    const family = familyById[option];
    return `
      <button
        class="${classes}"
        type="button"
        data-option="${escapeHtml(option)}"
        aria-label="${escapeHtml(family.forms.masculine)}"
        ${disabled ? "disabled" : ""}
      >
        <span class="option-swatch-surface" style="${swatchStyle(family)}"></span>
        <span class="option-swatch-label">${solved ? escapeHtml(family.forms.masculine) : "&nbsp;"}</span>
        <span class="sr-only">${escapeHtml(family.forms.masculine)}</span>
      </button>
    `;
  }

  if (item.kind === "visual") {
    const family = familyById[option];
    return `
      <button
        class="${classes}"
        type="button"
        data-option="${escapeHtml(option)}"
        ${disabled ? "disabled" : ""}
      >
        <strong>${escapeHtml(family.forms.masculine)}</strong>
      </button>
    `;
  }

  const family = familyById[item.familyId];
  const formKey = formKeyForFamilyValue(family, option);
  return `
    <button
      class="${classes}"
      type="button"
      data-option="${escapeHtml(option)}"
      ${disabled ? "disabled" : ""}
    >
      <strong>${escapeHtml(option)}</strong>
      <span>${escapeHtml(FORM_META[formKey].short)}</span>
    </button>
  `;
}

function weakSpotReason(familyId) {
  const family = familyById[familyId];
  const stats = state.familyStats[familyId];

  if (!stats.attempts) {
    return "Not started yet.";
  }

  if (getActivePhase() === "mastery" && !stats.modeStats.audio.attempts) {
    return "Listening still needs its first clean pass.";
  }

  const weakestMode = Object.entries(stats.modeStats).sort((a, b) => metricMastery(a[1]) - metricMastery(b[1]))[0];
  const weakestForm = [...FORM_ORDER].sort((a, b) => formMastery(familyId, a) - formMastery(familyId, b))[0];
  const modeAverage = averageMs(weakestMode[1]);

  if (modeAverage && modeAverage > 3800) {
    return `${MODE_META[weakestMode[0]].short} is still slow at ${formatSeconds(modeAverage)}.`;
  }

  return `${FORM_META[weakestForm].short} ending still slips inside the ${family.forms.masculine} family.`;
}

function getSpeechText(item) {
  const family = familyById[item.familyId];

  if (item.kind === "visual") {
    return FORM_ORDER.map((formKey) => family.forms[formKey]).join(", ");
  }

  return family.examples[item.formKey].phrase;
}

function renderSpectrumStrip() {
  el.spectrumStrip.innerHTML = colourFamilies
    .map(
      (family) => `
        <article class="spectrum-chip">
          <div class="spectrum-swatch" style="${swatchStyle(family)}"></div>
          <div>
            <strong>${escapeHtml(family.forms.masculine)}</strong>
            <span>${escapeHtml(family.english)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAtlas() {
  el.atlasGrid.innerHTML = colourFamilies
    .map((family) => {
      const formsMarkup = FORM_ORDER.map(
        (formKey) => `<span class="form-pill">${escapeHtml(family.forms[formKey])}</span>`,
      ).join("");

      const examplesMarkup = FORM_ORDER.map((formKey) => {
        const example = family.examples[formKey];
        return `
          <div class="example-line">
            <span class="example-phrase">${escapeHtml(example.phrase)}</span>
            <span class="example-gloss">${escapeHtml(FORM_META[formKey].short)} · ${escapeHtml(example.gloss)}</span>
          </div>
        `;
      }).join("");

      return `
        <article class="atlas-card">
          <div class="atlas-head">
            <div class="atlas-swatch" style="${swatchStyle(family)}"></div>
            <div class="atlas-copy">
              <h3>${escapeHtml(family.forms.masculine)}</h3>
              <p>${escapeHtml(family.english)} family</p>
            </div>
          </div>
          <div class="forms-row">${formsMarkup}</div>
          <div class="example-list">${examplesMarkup}</div>
        </article>
      `;
    })
    .join("");
}

function renderPhaseMeta() {
  const meta = PHASE_META[getActivePhase()];
  el.phaseTitle.textContent = meta.title;
  el.phasePill.textContent = meta.pill;
  el.phaseProgress.textContent = phaseProgressText();
}

function renderHeaderMetrics() {
  const accuracy = state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
  const average = state.totalAnswered ? state.totalResponseMs / state.totalAnswered : 0;

  el.cardsSolved.textContent = `${state.totalAnswered}`;
  el.currentStreak.textContent = `${state.streak}`;
  el.accuracyValue.textContent = `${accuracy}%`;
  el.averageTimeValue.textContent = formatSeconds(average);
}

function renderPrompt() {
  const item = currentItem();
  if (!item) return;

  el.modeBadge.textContent = MODE_META[item.mode].badge;
  el.promptLabel.textContent = MODE_META[item.mode].label;
  el.promptTitle.textContent = promptTitleForItem(item);
  el.promptStage.innerHTML = stageMarkupForItem(item);
  el.subPrompt.textContent = subPromptForItem(item);
  el.choiceNudge.textContent = state.currentSolved
    ? "Review the explanation, then move on to the next card."
    : state.timerPaused
      ? "Timer paused. Resume when you're ready to continue this card."
      : choiceNudgeForItem(item);
  el.hintButton.textContent = state.hintVisible ? "Hide hint" : "Reveal hint";
  el.hintText.textContent = state.hintVisible ? hintForItem(item) : "";
  el.audioButton.textContent = item.kind === "audio" ? "Play phrase" : "Hear phrase";
  el.audioButton.disabled = !("speechSynthesis" in window);
  el.pauseTimerButton.textContent = state.timerPaused ? "Resume timer" : "Pause timer";
  el.pauseTimerButton.disabled = state.currentSolved;
  el.pauseTimerButton.classList.toggle("is-active", state.timerPaused);
  renderLiveTimer();
}

function renderOptions() {
  const item = currentItem();
  if (!item) return;

  const options = isValidOptionOrder(item) ? state.currentOptionOrder : [...item.options];
  el.optionsGrid.dataset.choiceType = item.kind === "audio" ? "swatch" : "text";
  el.optionsGrid.innerHTML = options.map((option) => optionMarkup(item, option)).join("");
}

function renderFeedback() {
  const item = currentItem();
  if (!item) return;

  if (!state.currentSolved) {
    el.feedbackCard.classList.add("is-hidden");
    el.feedbackCard.classList.remove("is-correct", "is-wrong");
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Pick an answer to see the logic.</p>
      <p class="feedback-body">The review explains the colour family, the ending, and how your speed affected mastery.</p>
    `;
    return;
  }

  const correct = state.currentChoice === item.answerKey;
  const title = correct ? `Correct in ${formatSeconds(state.lastResponseMs || 0)}.` : `Reach for ${escapeHtml(getAnswerLabel(item))}.`;

  el.feedbackCard.classList.remove("is-hidden");
  el.feedbackCard.classList.toggle("is-correct", correct);
  el.feedbackCard.classList.toggle("is-wrong", !correct);
  el.feedbackCard.innerHTML = `
    <p class="feedback-title">${title}</p>
    <p class="feedback-body">${feedbackBodyForItem(item, correct)}</p>
  `;
}

function renderMastery() {
  el.masteryGrid.innerHTML = colourFamilies
    .map((family) => {
      const stats = state.familyStats[family.id];
      const accuracy = stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0;
      const average = averageMs(stats);
      const score = familyMastery(family.id);
      const modeMarkup = ["visual", "agreement", "audio"]
        .map((mode) => `<span class="mode-chip">${MODE_META[mode].short} ${Math.round(metricMastery(stats.modeStats[mode]) * 100)}</span>`)
        .join("");

      return `
        <article class="mastery-tile">
          <div class="mastery-header">
            <span class="swatch-dot" style="${swatchStyle(family)}"></span>
            <div>
              <strong>${escapeHtml(family.forms.masculine)}</strong>
            </div>
          </div>
          <div class="mastery-track">
            <span class="mastery-fill" style="width: ${Math.round(score * 100)}%"></span>
          </div>
          <div class="mastery-summary">${accuracy}% right · ${average ? formatSeconds(average) : "no timing yet"}</div>
          <div class="mode-row">${modeMarkup}</div>
        </article>
      `;
    })
    .join("");
}

function renderWeakSpots() {
  const weakest = [...colourFamilies]
    .sort((a, b) => familyMastery(a.id) - familyMastery(b.id))
    .slice(0, 3);

  el.weakSpotList.innerHTML = weakest
    .map(
      (family) => `
        <article class="weak-spot-item">
          <strong>${escapeHtml(family.forms.masculine)}</strong>
          <span>${escapeHtml(weakSpotReason(family.id))}</span>
        </article>
      `,
    )
    .join("");
}

function renderButtons() {
  el.nextButton.disabled = !state.currentSolved;
  el.nextButton.parentElement.classList.toggle("is-hidden", !state.currentSolved);
}

function renderSettings() {
  el.phaseOverrideSelect.value = state.phaseOverride;
  el.settingsSummary.textContent = state.phaseOverride === "auto" ? "Automatic step" : PHASE_META[state.phaseOverride].summary;
  el.memoryNote.textContent =
    state.phaseOverride === "auto"
      ? "Progress, answer timing, current card, and settings resume automatically on this device."
      : "Manual step is active. Switch back to Automatic whenever you want the trainer to choose the next pressure for you.";
}

function renderLiveTimer() {
  const liveMs = currentElapsedMs();
  el.liveTimer.textContent = state.timerPaused ? `Paused at ${formatSeconds(liveMs)}` : `${formatSeconds(liveMs)} response`;
  el.liveTimer.classList.toggle("is-paused", state.timerPaused);
}

function stopCardClock() {
  if (timerHandle !== null) {
    window.clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startCardClock() {
  stopCardClock();
  renderLiveTimer();
  if (!state.currentSolved && !state.timerPaused) {
    timerHandle = window.setInterval(renderLiveTimer, 100);
  }
}

function render() {
  renderSpectrumStrip();
  renderAtlas();
  renderPhaseMeta();
  renderHeaderMetrics();
  renderSettings();
  renderPrompt();
  renderOptions();
  renderFeedback();
  renderMastery();
  renderWeakSpots();
  renderButtons();
}

function recordMetric(metric, correct, responseMs) {
  metric.attempts += 1;
  metric.totalMs += responseMs;
  metric.bestMs = metric.bestMs === null ? responseMs : Math.min(metric.bestMs, responseMs);

  if (correct) {
    metric.correct += 1;
  } else {
    metric.wrong += 1;
  }
}

function submitAnswer(choice) {
  const item = currentItem();
  if (!item || state.currentSolved || state.timerPaused) return;

  const correct = choice === item.answerKey;
  const responseMs = Math.max(250, currentElapsedMs());
  const itemStats = ensureItemStats(item.id);
  const familyStats = state.familyStats[item.familyId];

  stopCardClock();

  itemStats.seen += 1;
  itemStats.lastTurn = state.turn;
  itemStats.totalMs += responseMs;
  itemStats.bestMs = itemStats.bestMs === null ? responseMs : Math.min(itemStats.bestMs, responseMs);

  state.totalAnswered += 1;
  state.totalResponseMs += responseMs;
  state.currentChoice = choice;
  state.currentSolved = true;
  state.lastResponseMs = responseMs;

  recordMetric(familyStats, correct, responseMs);
  recordMetric(familyStats.modeStats[item.mode], correct, responseMs);
  if (item.formKey) {
    recordMetric(familyStats.formStats[item.formKey], correct, responseMs);
  }

  if (correct) {
    itemStats.correct += 1;
    itemStats.streak += 1;
    itemStats.dueAt = state.turn + 4 + Math.min(5, itemStats.streak);
    state.totalCorrect += 1;
    state.streak += 1;
  } else {
    itemStats.wrong += 1;
    itemStats.streak = 0;
    itemStats.dueAt = state.turn + 2;
    state.streak = 0;
  }

  state.turn += 1;
  saveState();
  updatePhaseIfNeeded();
  render();
  checkSessionSummary(correct);
}

// ─── Session summary ─────────────────────────────────────────
let sessionCardsAnswered = 0;
let sessionCorrectCount = 0;
const SESSION_SUMMARY_INTERVAL = 15;
const sessionStartedAt = Date.now();

function checkSessionSummary(correct) {
  sessionCardsAnswered += 1;
  if (correct) sessionCorrectCount += 1;
  if (sessionCardsAnswered % SESSION_SUMMARY_INTERVAL === 0) {
    showSessionSummary();
  }
}

function showSessionSummary() {
  const accuracy = sessionCardsAnswered ? Math.round((sessionCorrectCount / sessionCardsAnswered) * 100) : 0;
  const elapsed = Math.round((Date.now() - sessionStartedAt) / 60000);
  const steady = colourFamilies.filter((f) => isFamilySteady(f.id)).length;
  const overlay = document.createElement("div");
  overlay.className = "session-summary-overlay";
  overlay.innerHTML = `
    <div class="session-summary-card">
      <h3>Session check-in</h3>
      <div class="summary-stats">
        <div class="summary-stat"><strong>${sessionCardsAnswered}</strong><span>cards</span></div>
        <div class="summary-stat"><strong>${accuracy}%</strong><span>accuracy</span></div>
        <div class="summary-stat"><strong>${elapsed}m</strong><span>elapsed</span></div>
        <div class="summary-stat"><strong>${steady}/${colourFamilies.length}</strong><span>steady</span></div>
      </div>
      <p class="summary-note">${accuracy >= 85 ? "Strong session. Keep going or take a break." : accuracy >= 65 ? "Solid progress. Consider slowing down on weak families." : "Lots of misses. A short break might help consolidation."}</p>
      <button class="primary-button summary-dismiss" type="button">Continue</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  overlay.querySelector(".summary-dismiss").addEventListener("click", () => {
    overlay.classList.remove("is-visible");
    setTimeout(() => overlay.remove(), 300);
  });
}

function speakCurrentCard() {
  const item = currentItem();
  if (!item || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(getSpeechText(item));
  utterance.lang = "ru-RU";
  utterance.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function startNextCard() {
  updatePhaseIfNeeded();
  state.currentItemId = pickNextItemId();
  const item = currentItem();
  state.currentOptionOrder = item ? shuffle([...item.options]) : [];
  state.currentSolved = false;
  state.currentChoice = null;
  state.hintVisible = false;
  state.timerPaused = false;
  state.cardElapsedOffsetMs = 0;
  state.cardStartedAt = Date.now();
  state.lastResponseMs = null;
  saveState();
  render();
  startCardClock();
}

function toggleTimerPause() {
  if (state.currentSolved || !currentItem()) return;

  if (state.timerPaused) {
    state.timerPaused = false;
    state.cardStartedAt = Date.now();
  } else {
    state.cardElapsedOffsetMs = currentElapsedMs();
    state.timerPaused = true;
    state.cardStartedAt = 0;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  saveState();
  render();
  startCardClock();
}

function resetSession() {
  stopCardClock();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  state = structuredClone(defaultState);
  saveState();
  startNextCard();
}

function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

el.optionsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (!button) return;
  submitAnswer(button.dataset.option);
});

document.addEventListener("keydown", (event) => {
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
  const key = event.key;
  if (key >= "1" && key <= "9" && !state.currentSolved) {
    const buttons = el.optionsGrid.querySelectorAll("[data-option]");
    const index = parseInt(key) - 1;
    if (index < buttons.length) {
      event.preventDefault();
      submitAnswer(buttons[index].dataset.option);
    }
  }
  if ((key === "Enter" || key === " ") && state.currentSolved) {
    event.preventDefault();
    startNextCard();
  }
  if (key === "h" && !state.currentSolved) {
    state.hintVisible = !state.hintVisible;
    saveState();
    renderPrompt();
  }
  if (key === "p") {
    timerPaused = !timerPaused;
    renderLiveTimer();
  }
});

el.nextButton.addEventListener("click", () => {
  startNextCard();
});

el.hintButton.addEventListener("click", () => {
  state.hintVisible = !state.hintVisible;
  saveState();
  renderPrompt();
});

el.audioButton.addEventListener("click", () => {
  speakCurrentCard();
});

el.pauseTimerButton.addEventListener("click", () => {
  toggleTimerPause();
});

el.phaseOverrideSelect.addEventListener("change", (event) => {
  state.phaseOverride = event.target.value;
  saveState();
  startNextCard();
});

el.resetSessionButton.addEventListener("click", () => {
  if (!window.confirm("Reset all progress? This cannot be undone.")) return;
  resetSession();
});

updatePhaseIfNeeded();
if (!currentItem() || !itemMatchesActivePhase(currentItem()) || !isValidOptionOrder(currentItem())) {
  startNextCard();
} else {
  render();
  if (state.currentSolved || state.timerPaused) {
    stopCardClock();
  } else {
    startCardClock();
  }
}
