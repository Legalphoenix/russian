// ─── Constants & Data ─────────────────────────────────────────

const STORAGE_KEY = "russian-possessive-matrix-state-v1";

const categories = ["masc", "fem", "neut", "plur"];
const phaseOrder = ["warmup", "matrix", "typing", "listening", "mastery"];
const invariantFamilies = new Set(["his", "her", "their"]);

const categoryMeta = {
  masc: { label: "Masculine", shortLabel: "masc", nounLabel: "masculine noun" },
  fem: { label: "Feminine", shortLabel: "fem", nounLabel: "feminine noun" },
  neut: { label: "Neuter", shortLabel: "neut", nounLabel: "neuter noun" },
  plur: { label: "Plural", shortLabel: "plur", nounLabel: "plural noun" },
};

const categoryNames = {
  masc: "masculine",
  fem: "feminine",
  neut: "neuter",
  plur: "plural",
};

const familyMeta = {
  my: { label: "мой family", display: "мой / моя / моё / мои", colorClass: "family-my" },
  yourSg: { label: "твой family", display: "твой / твоя / твоё / твои", colorClass: "family-your-sg" },
  his: { label: "его", display: "его", colorClass: "family-his" },
  her: { label: "её", display: "её", colorClass: "family-her" },
  our: { label: "наш family", display: "наш / наша / наше / наши", colorClass: "family-our" },
  yourPl: { label: "ваш family", display: "ваш / ваша / ваше / ваши", colorClass: "family-your-pl" },
  their: { label: "их", display: "их", colorClass: "family-their" },
};

const ownerRows = [
  { id: "ya", label: "Я", englishPossessive: "my", familyKey: "my", forms: { masc: "мой", fem: "моя", neut: "моё", plur: "мои" } },
  { id: "ty", label: "Ты", englishPossessive: "your", familyKey: "yourSg", forms: { masc: "твой", fem: "твоя", neut: "твоё", plur: "твои" } },
  { id: "on", label: "Он", englishPossessive: "his", familyKey: "his", forms: { masc: "его", fem: "его", neut: "его", plur: "его" } },
  { id: "ona", label: "Она", englishPossessive: "her", familyKey: "her", forms: { masc: "её", fem: "её", neut: "её", plur: "её" } },
  { id: "ono", label: "Оно", englishPossessive: "its", familyKey: "his", forms: { masc: "его", fem: "его", neut: "его", plur: "его" } },
  { id: "my", label: "Мы", englishPossessive: "our", familyKey: "our", forms: { masc: "наш", fem: "наша", neut: "наше", plur: "наши" } },
  { id: "vy", label: "Вы", englishPossessive: "your", familyKey: "yourPl", forms: { masc: "ваш", fem: "ваша", neut: "ваше", plur: "ваши" } },
  { id: "oni", label: "Они", englishPossessive: "their", familyKey: "their", forms: { masc: "их", fem: "их", neut: "их", plur: "их" } },
];

const ownerById = Object.fromEntries(ownerRows.map((row) => [row.id, row]));

const nounBuckets = {
  masc: [
    { key: "brat", word: "брат", gloss: "brother" },
    { key: "telefon", word: "телефон", gloss: "phone" },
    { key: "uchitel", word: "учитель", gloss: "teacher" },
    { key: "slovar", word: "словарь", gloss: "dictionary" },
  ],
  fem: [
    { key: "sestra", word: "сестра", gloss: "sister" },
    { key: "kniga", word: "книга", gloss: "book" },
    { key: "mashina", word: "машина", gloss: "car" },
    { key: "komnata", word: "комната", gloss: "room" },
  ],
  neut: [
    { key: "pismo", word: "письмо", gloss: "letter" },
    { key: "okno", word: "окно", gloss: "window" },
    { key: "more", word: "море", gloss: "sea" },
    { key: "mesto", word: "место", gloss: "seat" },
  ],
  plur: [
    { key: "druzya", word: "друзья", gloss: "friends" },
    { key: "klyuchi", word: "ключи", gloss: "keys" },
    { key: "knigi", word: "книги", gloss: "books" },
    { key: "uroki", word: "уроки", gloss: "lessons" },
  ],
};

const canonicalNouns = Object.fromEntries(categories.map((cat) => [cat, nounBuckets[cat][0]]));

const sentenceFrames = [
  { pre: "Это", post: "{noun}.", enPre: "This is", enPost: "{eng}." },
  { pre: "Где", post: "{noun}?", enPre: "Where is", enPost: "{eng}?" },
  { pre: "Вот", post: "{noun}.", enPre: "Here is", enPost: "{eng}." },
  { pre: "", post: "{noun} здесь.", enPre: "", enPost: "{eng} is here." },
];

const phaseMeta = {
  warmup: { title: "Step 1: Warm-up", pill: "Warm-up", badge: "Warm-up", num: 1 },
  matrix: { title: "Step 2: Chart Drill", pill: "Chart", badge: "Chart Drill", num: 2 },
  typing: { title: "Step 3: Type It", pill: "Type", badge: "Type It", num: 3 },
  listening: { title: "Step 4: Listen", pill: "Listen", badge: "Listen", num: 4 },
  mastery: { title: "Step 5: Mastery", pill: "Speed", badge: "Speed Mastery", num: 5 },
};

// ─── Item Generation ──────────────────────────────────────────

function cellId(ownerId, category) {
  return `${ownerId}-${category}`;
}

function parseCellId(value) {
  const [ownerId, category] = value.split("-");
  return { ownerId, category };
}

function getColumnOptions(category) {
  return [...new Set(ownerRows.map((owner) => owner.forms[category]))];
}

function buildHint(owner, category, noun) {
  const answer = owner.forms[category];
  if (invariantFamilies.has(owner.familyKey)) {
    return `${owner.label} keeps ${answer} for every noun column, including ${noun.word}.`;
  }
  return `${noun.word} is a ${categoryMeta[category].nounLabel}, so ${owner.label} needs ${answer}.`;
}

function buildExplanation(owner, category, noun) {
  const answer = owner.forms[category];
  if (owner.id === "ono") {
    return `Оно uses the same invariant family as он, so the answer stays ${answer} even with ${noun.word}.`;
  }
  if (invariantFamilies.has(owner.familyKey)) {
    return `${owner.label} uses the invariant form ${answer}, so the noun column does not change the answer here.`;
  }
  return `${owner.label} picks the ${familyMeta[owner.familyKey].label}. Because ${noun.word} is a ${categoryMeta[category].nounLabel}, the correct form is ${answer}.`;
}

function describeChoiceContrast(choice, item) {
  const owner = ownerById[item.ownerId];
  const choiceCategories = categories.filter((cat) => owner.forms[cat] === choice);

  if (choiceCategories.length && choice !== item.answer) {
    return `You chose ${choice}, the ${formatCategoryList(choiceCategories)} form for ${owner.label}. ${item.noun.word} is ${categoryNames[item.category]}, so this card needs ${item.answer}.`;
  }

  const matchingOwners = ownerRows.filter((row) => categories.some((cat) => row.forms[cat] === choice));
  if (matchingOwners.length && choice !== item.answer) {
    const labels = matchingOwners.map((row) => row.label).join(" / ");
    return `You chose ${choice}, which belongs to ${labels}. This card uses ${owner.label}, so the answer is ${item.answer}.`;
  }

  if (choice && choice !== item.answer) {
    return `You entered ${choice}. This card needs ${item.answer} for ${owner.label} + ${categoryNames[item.category]} ${item.noun.word}.`;
  }

  if (invariantFamilies.has(owner.familyKey)) {
    return `${owner.label} is invariant, so ${item.answer} stays the same for masculine, feminine, neuter, and plural nouns.`;
  }

  return `${owner.label} uses ${familyMeta[owner.familyKey].display}; ${item.noun.word} selects the ${categoryNames[item.category]} form ${item.answer}.`;
}

function formatCategoryList(list) {
  if (list.length === 1) return categoryNames[list[0]];
  return list.map((cat) => categoryNames[cat]).join(" / ");
}

function makeItem({ phase, ownerId, category, noun, options, mode, subPrompt }) {
  const owner = ownerById[ownerId];
  const answer = owner.forms[category];
  return {
    id: `${phase}-${ownerId}-${category}-${noun.key}`,
    phase,
    cellId: cellId(ownerId, category),
    ownerId,
    category,
    noun,
    answer,
    options: [...options],
    mode,
    prompt: `___ ${noun.word}`,
    translation: `${owner.englishPossessive} ${noun.gloss}`,
    subPrompt,
    hint: buildHint(owner, category, noun),
    explanation: buildExplanation(owner, category, noun),
    speechText: `Это ${answer} ${noun.word}.`,
  };
}

function makeListeningItem({ ownerId, category, noun, frame }) {
  const owner = ownerById[ownerId];
  const answer = owner.forms[category];
  const options = invariantFamilies.has(owner.familyKey)
    ? ["его", "её", "их"]
    : [...new Set(Object.values(owner.forms))];

  const post = frame.post.replace("{noun}", noun.word);
  const enPost = frame.enPost.replace("{eng}", noun.gloss);

  const item = makeItem({
    phase: "listening",
    ownerId,
    category,
    noun,
    options,
    mode: "Listen",
    subPrompt: "Listen to the sentence. Choose the missing possessive.",
  });

  item.listenPre = frame.pre;
  item.listenPost = post;
  item.sentenceFull = [frame.pre, answer, post].filter(Boolean).join(" ");
  item.sentenceBlank = [frame.pre, "___", post].filter(Boolean).join(" ");
  item.translationFull = [frame.enPre, owner.englishPossessive, enPost].filter(Boolean).join(" ");

  return item;
}

// ─── Item Collections ─────────────────────────────────────────

const warmupSpecs = [
  ...["ya", "ty", "my", "vy"].flatMap((ownerId) =>
    categories.map((category) => ({
      ownerId,
      category,
      options: Object.values(ownerById[ownerId].forms),
      mode: "Ending warm-up",
      subPrompt: "The owner stays fixed. Let the noun decide the ending.",
    })),
  ),
  {
    ownerId: "on", category: "masc",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "ona", category: "fem",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "ono", category: "neut",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "oni", category: "plur",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
];

const warmupItems = warmupSpecs.map((spec) =>
  makeItem({
    phase: "warmup",
    ownerId: spec.ownerId,
    category: spec.category,
    noun: canonicalNouns[spec.category],
    options: spec.options,
    mode: spec.mode,
    subPrompt: spec.subPrompt,
  }),
);

const matrixItems = ownerRows.flatMap((owner) =>
  categories.map((category) =>
    makeItem({
      phase: "matrix",
      ownerId: owner.id,
      category,
      noun: canonicalNouns[category],
      options: getColumnOptions(category),
      mode: "Chart lab",
      subPrompt: "Use the owner for the family. Use the noun for the column.",
    }),
  ),
);

const typingItems = ownerRows.flatMap((owner) =>
  categories.map((category) =>
    makeItem({
      phase: "typing",
      ownerId: owner.id,
      category,
      noun: canonicalNouns[category],
      options: [],
      mode: "Type it",
      subPrompt: "Type the correct possessive form. Use the owner and noun gender to decide.",
    }),
  ),
);

let _listenIdx = 0;
const listeningItems = ownerRows.flatMap((owner) =>
  categories.map((category) => {
    const noun = canonicalNouns[category];
    const frame = sentenceFrames[_listenIdx % sentenceFrames.length];
    _listenIdx++;
    return makeListeningItem({ ownerId: owner.id, category, noun, frame });
  }),
);

const masteryItems = ownerRows.flatMap((owner) =>
  categories.flatMap((category) =>
    nounBuckets[category].map((noun) =>
      makeItem({
        phase: "mastery",
        ownerId: owner.id,
        category,
        noun,
        options: getColumnOptions(category),
        mode: "Timed mastery",
        subPrompt: "Same chart, but now with mixed nouns and no table-watching.",
      }),
    ),
  ),
);

const allItems = [...warmupItems, ...matrixItems, ...typingItems, ...listeningItems, ...masteryItems];
const itemsById = Object.fromEntries(allItems.map((item) => [item.id, item]));
const allCellIds = ownerRows.flatMap((owner) => categories.map((category) => cellId(owner.id, category)));

// ─── DOM References ───────────────────────────────────────────

const el = {
  stepNav: document.querySelector("#stepNav"),
  cardsSolved: document.querySelector("#cardsSolved"),
  currentStreak: document.querySelector("#currentStreak"),
  accuracyValue: document.querySelector("#accuracyValue"),
  avgResponseValue: document.querySelector("#avgResponseValue"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  referenceMatrix: document.querySelector("#referenceMatrix"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phaseProgress: document.querySelector("#phaseProgress"),
  modeBadge: document.querySelector("#modeBadge"),
  promptLabel: document.querySelector("#promptLabel"),
  promptText: document.querySelector("#promptText"),
  translationLine: document.querySelector("#translationLine"),
  promptChipRow: document.querySelector("#promptChipRow"),
  subPrompt: document.querySelector("#subPrompt"),
  choiceNudge: document.querySelector("#choiceNudge"),
  hintButton: document.querySelector("#hintButton"),
  hintText: document.querySelector("#hintText"),
  feedbackCard: document.querySelector("#feedbackCard"),
  nextButton: document.querySelector("#nextButton"),
  optionsGrid: document.querySelector("#optionsGrid"),
  practiceOptions: document.querySelector("#practiceOptions"),
  familyMasteryGrid: document.querySelector("#familyMasteryGrid"),
  weakSpotList: document.querySelector("#weakSpotList"),
  audioButton: document.querySelector("#audioButton"),
  typingArea: document.querySelector("#typingArea"),
  typingInput: document.querySelector("#typingInput"),
  typingSubmit: document.querySelector("#typingSubmit"),
  listeningControls: document.querySelector("#listeningControls"),
  listenPlayBtn: document.querySelector("#listenPlayBtn"),
  listenClueBtn: document.querySelector("#listenClueBtn"),
};

// ─── State Management ─────────────────────────────────────────

const defaultState = {
  currentPhase: "warmup",
  phaseOverride: "auto",
  turn: 0,
  currentItemId: null,
  currentOptionOrder: [],
  currentSolved: false,
  currentChoice: null,
  hintVisible: false,
  listeningFallbackVisible: false,
  cardStartedAt: null,
  savedAt: null,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  totalResponseMs: 0,
  lastResponseMs: null,
  itemStats: {},
  cellStats: {},
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return mergeState(JSON.parse(raw));
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(candidate = {}) {
  const merged = structuredClone(defaultState);
  Object.assign(merged, candidate);
  merged.currentPhase = phaseOrder.includes(candidate.currentPhase) ? candidate.currentPhase : "warmup";
  merged.phaseOverride =
    candidate.phaseOverride === "auto" || phaseOrder.includes(candidate.phaseOverride) ? candidate.phaseOverride : "auto";
  merged.currentItemId = itemsById[candidate.currentItemId] ? candidate.currentItemId : null;
  merged.currentOptionOrder = Array.isArray(candidate.currentOptionOrder) ? candidate.currentOptionOrder : [];
  merged.currentSolved = Boolean(candidate.currentSolved);
  merged.currentChoice = typeof candidate.currentChoice === "string" ? candidate.currentChoice : null;
  merged.hintVisible = Boolean(candidate.hintVisible);
  merged.listeningFallbackVisible = Boolean(candidate.listeningFallbackVisible);
  merged.turn = Number.isFinite(candidate.turn) ? candidate.turn : 0;
  merged.savedAt = Number.isFinite(candidate.savedAt) ? candidate.savedAt : null;
  merged.totalAnswered = Number.isFinite(candidate.totalAnswered) ? candidate.totalAnswered : 0;
  merged.totalCorrect = Number.isFinite(candidate.totalCorrect) ? candidate.totalCorrect : 0;
  merged.streak = Number.isFinite(candidate.streak) ? candidate.streak : 0;
  merged.totalResponseMs = Number.isFinite(candidate.totalResponseMs) ? candidate.totalResponseMs : 0;
  merged.lastResponseMs = Number.isFinite(candidate.lastResponseMs) ? candidate.lastResponseMs : null;
  merged.cardStartedAt = Number.isFinite(candidate.cardStartedAt) ? candidate.cardStartedAt : Date.now();
  merged.itemStats = candidate.itemStats && typeof candidate.itemStats === "object" ? candidate.itemStats : {};
  merged.cellStats = candidate.cellStats && typeof candidate.cellStats === "object" ? candidate.cellStats : {};
  return merged;
}

function saveState() {
  state.savedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (typeof syncToServer === "function") syncToServer(state);
}

function ensureItemStats(itemId) {
  if (!state.itemStats[itemId]) {
    state.itemStats[itemId] = { seen: 0, correct: 0, wrong: 0, streak: 0, lastTurn: -1 };
  }
  const s = state.itemStats[itemId];
  s.seen = Number.isFinite(s.seen) ? s.seen : 0;
  s.correct = Number.isFinite(s.correct) ? s.correct : 0;
  s.wrong = Number.isFinite(s.wrong) ? s.wrong : 0;
  s.streak = Number.isFinite(s.streak) ? s.streak : 0;
  s.lastTurn = Number.isFinite(s.lastTurn) ? s.lastTurn : -1;
  return s;
}

function ensureCellStats(id) {
  if (!state.cellStats[id]) {
    state.cellStats[id] = {
      seen: 0, correct: 0, wrong: 0, streak: 0,
      dueAt: 0, lastTurn: -1,
      totalResponseMs: 0, correctResponseMs: 0, lastResponseMs: null,
    };
  }
  const s = state.cellStats[id];
  s.seen = Number.isFinite(s.seen) ? s.seen : 0;
  s.correct = Number.isFinite(s.correct) ? s.correct : 0;
  s.wrong = Number.isFinite(s.wrong) ? s.wrong : 0;
  s.streak = Number.isFinite(s.streak) ? s.streak : 0;
  s.dueAt = Number.isFinite(s.dueAt) ? s.dueAt : 0;
  s.lastTurn = Number.isFinite(s.lastTurn) ? s.lastTurn : -1;
  s.totalResponseMs = Number.isFinite(s.totalResponseMs) ? s.totalResponseMs : 0;
  s.correctResponseMs = Number.isFinite(s.correctResponseMs) ? s.correctResponseMs : 0;
  s.lastResponseMs = Number.isFinite(s.lastResponseMs) ? s.lastResponseMs : null;
  return s;
}

// ─── Phase Logic ──────────────────────────────────────────────

function getActivePhase() {
  return state.phaseOverride === "auto" ? state.currentPhase : state.phaseOverride;
}

function getPoolForPhase(phase) {
  if (phase === "warmup") return warmupItems;
  if (phase === "matrix") return matrixItems;
  if (phase === "typing") return typingItems;
  if (phase === "listening") return listeningItems;
  return masteryItems;
}

function getCurrentPool() {
  return getPoolForPhase(getActivePhase());
}

function isValidOptionOrder(item) {
  if (!item.options.length) return true;
  return (
    Array.isArray(state.currentOptionOrder) &&
    state.currentOptionOrder.length === item.options.length &&
    item.options.every((opt) => state.currentOptionOrder.includes(opt))
  );
}

const phaseLabels = {
  warmup: { title: "Warm-up", next: "Chart Drill" },
  matrix: { title: "Chart Drill", next: "Type It" },
  typing: { title: "Type It", next: "Listen" },
  listening: { title: "Listen", next: "Speed Mastery" },
  mastery: { title: "Speed Mastery", next: null },
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

  if (state.currentPhase === "warmup") {
    const ready = warmupItems.every((item) => ensureCellStats(item.cellId).correct >= 2);
    if (ready) state.currentPhase = "matrix";
  }
  if (state.currentPhase === "matrix") {
    const allCorrect = allCellIds.every((id) => ensureCellStats(id).correct > 0);
    if (allCorrect) state.currentPhase = "typing";
  }
  if (state.currentPhase === "typing") {
    const typedCorrect = typingItems.every((item) => ensureItemStats(item.id).correct > 0);
    if (typedCorrect) state.currentPhase = "listening";
  }
  if (state.currentPhase === "listening") {
    const listenCorrect = listeningItems.every((item) => ensureItemStats(item.id).correct > 0);
    if (listenCorrect) state.currentPhase = "mastery";
  }

  if (state.currentPhase !== before) {
    showPhaseBanner(before, state.currentPhase);
  }
}

function phaseProgressText() {
  const phase = getActivePhase();
  if (phase === "warmup") {
    const mastered = warmupItems.filter((item) => ensureCellStats(item.cellId).correct >= 2).length;
    return `${mastered} / ${warmupItems.length} steady twice`;
  }
  if (phase === "matrix") {
    const correct = allCellIds.filter((id) => ensureCellStats(id).correct > 0).length;
    return `${correct} / ${allCellIds.length} cells correct`;
  }
  if (phase === "typing") {
    const typed = typingItems.filter((item) => ensureItemStats(item.id).correct > 0).length;
    return `${typed} / ${typingItems.length} typed correctly`;
  }
  if (phase === "listening") {
    const listened = listeningItems.filter((item) => ensureItemStats(item.id).correct > 0).length;
    return `${listened} / ${listeningItems.length} heard correctly`;
  }
  const steady = allCellIds.filter((id) => cellMastery(id) >= 0.8).length;
  return `${steady} / ${allCellIds.length} cells steady`;
}

// ─── Scoring ──────────────────────────────────────────────────

function averageSeenMs(stats) {
  return stats.seen ? stats.totalResponseMs / stats.seen : null;
}

function averageCorrectMs(stats) {
  return stats.correct ? stats.correctResponseMs / stats.correct : null;
}

function speedScoreFromMs(ms) {
  if (!ms) return 0.08;
  const clamped = clamp(ms, 1200, 9000);
  return 1 - (clamped - 1200) / 7800;
}

function cellMastery(id) {
  const stats = ensureCellStats(id);
  const total = stats.correct + stats.wrong;
  if (!total) return 0.08;
  const accuracy = stats.correct / total;
  const speed = speedScoreFromMs(averageCorrectMs(stats) || averageSeenMs(stats));
  const streakBonus = Math.min(0.08, stats.streak * 0.02);
  return clamp(accuracy * 0.72 + speed * 0.22 + streakBonus, 0.05, 0.99);
}

function candidateScore(item, currentTurn) {
  const cell = ensureCellStats(item.cellId);
  const itemSt = ensureItemStats(item.id);
  const dueBonus = cell.dueAt <= currentTurn ? 12 : 0;
  const unseenBonus = cell.seen === 0 ? 8 : 0;
  const weakBonus = (1 - cellMastery(item.cellId)) * 12;
  const wrongBonus = cell.wrong * 2.6;
  const slowBonus = Math.max(0, ((averageCorrectMs(cell) || averageSeenMs(cell) || 5200) - 2600) / 900);
  const cellRepeatPenalty = cell.lastTurn === currentTurn - 1 ? -10 : 0;
  const itemRepeatPenalty = itemSt.lastTurn === currentTurn - 1 ? -4 : 0;
  return dueBonus + unseenBonus + weakBonus + wrongBonus + slowBonus + cellRepeatPenalty + itemRepeatPenalty + Math.random();
}

function pickNextItemId() {
  const pool = getCurrentPool();
  const turn = state.turn;
  const ranked = [...pool]
    .sort((a, b) => candidateScore(b, turn) - candidateScore(a, turn))
    .filter((item) => item.id !== state.currentItemId || pool.length === 1);
  return ranked[0]?.id || pool[0]?.id || null;
}

function currentItem() {
  return state.currentItemId ? itemsById[state.currentItemId] || null : null;
}

function itemMatchesActivePhase(item) {
  return item.phase === getActivePhase();
}

let timerPausedAt = null;
let timerPausedAccumulated = 0;

function togglePauseTimer() {
  if (state.currentSolved) return;
  if (timerPausedAt) {
    timerPausedAccumulated += Date.now() - timerPausedAt;
    timerPausedAt = null;
  } else {
    timerPausedAt = Date.now();
  }
}

function resetPauseTimer() {
  timerPausedAt = null;
  timerPausedAccumulated = 0;
}

function getCardElapsedMs() {
  const raw = Date.now() - (state.cardStartedAt || Date.now());
  const paused = timerPausedAt ? Date.now() - timerPausedAt : 0;
  return raw - timerPausedAccumulated - paused;
}

function nextInterval(responseMs, streak) {
  if (responseMs <= 2500) return 5 + Math.min(4, streak);
  if (responseMs <= 4500) return 3 + Math.min(3, streak);
  return 2 + Math.min(2, streak);
}

function describeSpeed(responseMs, correct) {
  if (!responseMs) return "";
  if (!correct) return `You answered in ${formatDuration(responseMs)}. Misses bring the cell back sooner.`;
  if (responseMs <= 2500) return "Fast enough to push this cell up strongly.";
  if (responseMs <= 4500) return "Correct, but still a bit slow, so this cell is not fully stable yet.";
  return "Correct, but slow. Expect this cell again soon.";
}

// ─── Core Actions ─────────────────────────────────────────────

function recordAnswer(correct) {
  const item = currentItem();
  if (!item) return;

  const itemSt = ensureItemStats(item.id);
  const cellSt = ensureCellStats(item.cellId);
  const responseMs = clamp(getCardElapsedMs(), 450, 15000);

  itemSt.seen += 1;
  itemSt.lastTurn = state.turn;

  cellSt.seen += 1;
  cellSt.lastTurn = state.turn;
  cellSt.totalResponseMs += responseMs;
  cellSt.lastResponseMs = responseMs;

  state.totalAnswered += 1;
  state.totalResponseMs += responseMs;
  state.currentSolved = true;
  state.lastResponseMs = responseMs;

  if (correct) {
    const interval =
      typeof srsNextInterval === "function"
        ? srsNextInterval(cellSt, responseMs, true, { speedTargetMs: 3000, baseInterval: 3, maxInterval: 32 })
        : nextInterval(responseMs, cellSt.streak + 1);
    itemSt.correct += 1;
    itemSt.streak += 1;
    cellSt.correct += 1;
    cellSt.correctResponseMs += responseMs;
    cellSt.streak += 1;
    cellSt.dueAt = state.turn + interval;
    state.totalCorrect += 1;
    state.streak += 1;
  } else {
    itemSt.wrong += 1;
    itemSt.streak = 0;
    cellSt.wrong += 1;
    cellSt.streak = 0;
    const interval =
      typeof srsNextInterval === "function"
        ? srsNextInterval(cellSt, responseMs, false, { speedTargetMs: 3000, lapseInterval: 1 })
        : 1;
    cellSt.dueAt = state.turn + interval;
    state.streak = 0;
  }

  state.turn += 1;
  saveState();
  updatePhaseIfNeeded();
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
  const overlay = document.createElement("div");
  overlay.className = "session-summary-overlay";
  overlay.innerHTML = `
    <div class="session-summary-card">
      <h3>Session check-in</h3>
      <div class="summary-stats">
        <div class="summary-stat"><strong>${sessionCardsAnswered}</strong><span>cards</span></div>
        <div class="summary-stat"><strong>${accuracy}%</strong><span>accuracy</span></div>
        <div class="summary-stat"><strong>${elapsed}m</strong><span>elapsed</span></div>
        <div class="summary-stat"><strong>${state.streak}</strong><span>streak</span></div>
      </div>
      <p class="summary-note">${accuracy >= 85 ? "Strong session. Keep going or take a break." : accuracy >= 65 ? "Solid progress. Consider slowing down on weak cells." : "Lots of misses. A short break might help consolidation."}</p>
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

function submitAnswer(choice) {
  const item = currentItem();
  if (!item || state.currentSolved) return;

  const correct = choice === item.answer;
  state.currentChoice = choice;
  recordAnswer(correct);
  render();

  if (getActivePhase() === "listening" && correct) {
    setTimeout(() => speakFullSentence(item), 500);
  }
}

function submitTyping() {
  const item = currentItem();
  if (!item || state.currentSolved) return;

  const value = el.typingInput.value.trim();
  if (!value) return;

  const correct = normalizeRussian(value) === normalizeRussian(item.answer);
  state.currentChoice = correct ? item.answer : value;
  recordAnswer(correct);
  render();

  if (correct) speakCurrentCard();
}

function startNextCard() {
  updatePhaseIfNeeded();
  state.currentItemId = pickNextItemId();
  const item = currentItem();
  state.currentOptionOrder = item && item.options.length ? shuffle([...item.options]) : [];
  state.currentSolved = false;
  state.currentChoice = null;
  state.hintVisible = false;
  state.listeningFallbackVisible = false;
  state.lastResponseMs = null;
  state.cardStartedAt = Date.now();
  resetPauseTimer();
  saveState();
  render();

  const phase = getActivePhase();
  if (phase === "typing") {
    el.typingInput.value = "";
    setTimeout(() => el.typingInput.focus(), 50);
  }
  if (phase === "listening" && item) {
    setTimeout(() => speakFullSentence(item), 350);
  }
}

function resetSession() {
  state = structuredClone(defaultState);
  saveState();
  startNextCard();
}

// ─── Audio ────────────────────────────────────────────────────

const hasSpeech = "speechSynthesis" in window;

function speakCurrentCard() {
  const item = currentItem();
  if (!item || !hasSpeech) return;
  const utterance = new SpeechSynthesisUtterance(item.speechText);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function speakFullSentence(item) {
  if (!hasSpeech || !item) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(item.sentenceFull);
  u.lang = "ru-RU";
  u.rate = 0.9;
  synth.speak(u);
}

function speakWord(word) {
  if (!hasSpeech || !word) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "ru-RU";
  u.rate = 0.85;
  synth.speak(u);
}

// ─── Rendering ────────────────────────────────────────────────

function render() {
  const phase = getActivePhase();
  const isTyping = phase === "typing";
  const isListening = phase === "listening";

  renderStepNav();
  renderPhaseMeta();
  renderHeaderMetrics();
  renderReferenceMatrix();
  renderPrompt(phase);

  el.typingArea.style.display = isTyping ? "" : "none";
  el.listeningControls.style.display = isListening ? "" : "none";
  el.practiceOptions.style.display = isTyping ? "none" : "";
  el.audioButton.style.display = isListening ? "none" : "";
  el.listenClueBtn.hidden = !isListening || state.currentSolved || state.listeningFallbackVisible || !hasSpeech;

  if (!isTyping) renderOptions();

  renderFeedback(phase);
  renderFamilyMastery();
  renderWeakSpots();
  renderButtons();
}

function renderStepNav() {
  const activePhase = getActivePhase();
  const isAuto = state.phaseOverride === "auto";

  el.stepNav.innerHTML =
    `<button class="step-btn step-auto-btn ${isAuto ? "is-active" : ""}" data-step="auto" aria-pressed="${isAuto}" title="Follow the recommended step automatically">Auto</button>` +
    phaseOrder
      .map((phase) => {
        const meta = phaseMeta[phase];
        const active = activePhase === phase;
        const recommended = isAuto && state.currentPhase === phase;
        return `
          <button class="step-btn ${active ? "is-active" : ""} ${recommended && !active ? "is-recommended" : ""}" data-step="${phase}" aria-pressed="${active}" ${active ? 'aria-current="step"' : ""}>
            <span class="step-num">${meta.num}</span>
            <span class="step-label">${meta.pill}</span>
          </button>`;
      })
      .join("");
}

function renderPhaseMeta() {
  const meta = phaseMeta[getActivePhase()];
  el.phaseTitle.textContent = meta.title;
  el.phaseProgress.textContent = phaseProgressText();
}

function renderHeaderMetrics() {
  const accuracy = state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
  const avgMs = state.totalAnswered ? state.totalResponseMs / state.totalAnswered : 0;
  el.cardsSolved.textContent = `${state.totalAnswered}`;
  el.currentStreak.textContent = `${state.streak}`;
  el.accuracyValue.textContent = `${accuracy}%`;
  el.avgResponseValue.textContent = avgMs ? formatDuration(avgMs) : "0.0s";
}

function renderPrompt(phase) {
  const item = currentItem();
  if (!item) return;

  const owner = ownerById[item.ownerId];
  const showSupport = state.currentSolved || state.hintVisible;

  el.modeBadge.textContent = phaseMeta[phase].badge;

  if (phase === "listening") {
    el.promptLabel.textContent = "Listen and choose";
    if (state.currentSolved) {
      el.promptText.innerHTML = `<span class="listen-revealed" lang="ru">${escapeHTML(item.sentenceFull)}</span>`;
      el.translationLine.textContent = item.translationFull;
    } else if (state.listeningFallbackVisible || !hasSpeech) {
      el.promptText.innerHTML = `<span class="listen-fallback" lang="ru">${formatPrompt(item.sentenceBlank)}</span>`;
      el.translationLine.textContent = "";
    } else {
      el.promptText.innerHTML = '<span class="listen-placeholder">Listen first. Reveal the written clue only if you need it.</span>';
      el.translationLine.textContent = "";
    }
    el.promptChipRow.innerHTML = showSupport
      ? `<span class="prompt-chip"><strong>Owner</strong><span lang="ru">${escapeHTML(owner.label)}</span></span>`
      : "";
    el.subPrompt.textContent = state.currentSolved ? "" : item.subPrompt;
    el.choiceNudge.textContent = state.currentSolved
      ? "The full sentence is shown above."
      : "Pick the possessive that completes the sentence.";
  } else {
    el.promptLabel.textContent = phase === "typing" ? "Type the form" : "Build the phrase";
    el.promptText.innerHTML = formatPrompt(item.prompt);
    el.translationLine.textContent = phase === "typing" && !state.currentSolved ? "" : item.translation;
    el.promptChipRow.innerHTML = renderPromptChips(item, phase, showSupport);
    el.subPrompt.textContent = item.subPrompt;
    el.choiceNudge.textContent = state.currentSolved
      ? state.currentChoice === item.answer
        ? "Correct. Read the feedback, then move to the next card."
        : "Not quite. Read the feedback, then repair it on the next card."
      : phase === "typing"
        ? "Type the correct possessive form and press Enter."
        : "Tap the correct form below.";
  }

  el.hintButton.textContent = state.hintVisible ? "Hide hint" : "Reveal hint";
  el.hintText.textContent = state.hintVisible ? item.hint : "";
}

function renderOptions() {
  const item = currentItem();
  if (!item) return;

  const options = isValidOptionOrder(item) ? state.currentOptionOrder : [...item.options];
  el.optionsGrid.innerHTML = options
    .map((option) => {
      const selected = state.currentChoice === option;
      const correct = option === item.answer;
      let classes = "option-button";
      if (selected) classes += " is-selected";
      if (state.currentSolved && correct) classes += " is-correct";
      if (state.currentSolved && selected && !correct) classes += " is-wrong";
      return `
        <button class="${classes}" type="button" data-option="${escapeAttribute(option)}" lang="ru" aria-pressed="${selected}" ${state.currentSolved ? "disabled" : ""}>
          ${escapeHTML(option)}
        </button>`;
    })
    .join("");
}

function renderFeedback(phase) {
  const item = currentItem();
  if (!item) return;

  if (!state.currentSolved) {
    el.feedbackCard.classList.add("is-hidden");
    el.feedbackCard.classList.remove("is-correct", "is-wrong");
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Pick an answer to see the logic.</p>
      <p class="feedback-body">The explanation will tell you whether you missed the owner, the noun type, or speed.</p>`;
    return;
  }

  const correct = state.currentChoice === item.answer;
  const speedLine = describeSpeed(state.lastResponseMs, correct);
  const contrastLine = describeChoiceContrast(state.currentChoice, item);

  el.feedbackCard.classList.remove("is-hidden");
  el.feedbackCard.classList.toggle("is-correct", correct);
  el.feedbackCard.classList.toggle("is-wrong", !correct);

  if (!correct) {
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Not quite. You chose <strong lang="ru">${escapeHTML(state.currentChoice)}</strong>; correct is <strong lang="ru">${escapeHTML(item.answer)}</strong>.</p>
      <p class="feedback-body">${escapeHTML(contrastLine)} ${escapeHTML(item.explanation)} ${escapeHTML(speedLine)}</p>`;
  } else if (phase === "listening" && correct) {
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Correct! ${formatDuration(state.lastResponseMs)}</p>
      <p class="feedback-body"><span lang="ru">${escapeHTML(item.sentenceFull)}</span> &mdash; ${escapeHTML(item.translationFull)}. ${escapeHTML(speedLine)}</p>`;
  } else {
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Correct in ${formatDuration(state.lastResponseMs)}.</p>
      <p class="feedback-body">${escapeHTML(contrastLine)} ${escapeHTML(speedLine)}</p>`;
  }
}

function renderReferenceMatrix() {
  const item = currentItem();
  const headMarkup = `
    <div class="matrix-head">Person</div>
    ${categories
      .map(
        (cat) => `
        <div class="matrix-head">
          ${categoryMeta[cat].label}
          <span>${categoryMeta[cat].shortLabel}</span>
        </div>`,
      )
      .join("")}`;

  const rowMarkup = ownerRows
    .map((owner) => {
      const family = familyMeta[owner.familyKey];
      const ownerHtml = `<div class="matrix-owner ${family.colorClass}" lang="ru">${escapeHTML(owner.label)}</div>`;
      const cells = categories
        .map((cat) => {
          const id = cellId(owner.id, cat);
          const active = item?.cellId === id ? "is-active" : "";
          const mastery = cellMastery(id);
          const word = owner.forms[cat];
          const label = `${owner.label}, ${categoryMeta[cat].label}: ${word}. ${Math.round(mastery * 100)} percent mastery.`;
          return `
            <button class="matrix-cell ${family.colorClass} ${active}" type="button" style="--mastery: ${mastery}" data-word="${escapeAttribute(word)}" lang="ru" aria-label="${escapeAttribute(label)}">
              <span class="matrix-word">${escapeHTML(word)}</span>
              <span class="matrix-percent">${Math.round(mastery * 100)}%</span>
            </button>`;
        })
        .join("");
      return ownerHtml + cells;
    })
    .join("");

  el.referenceMatrix.innerHTML = headMarkup + rowMarkup;
}

function familyCellIds(familyKey) {
  return ownerRows
    .filter((owner) => owner.familyKey === familyKey)
    .flatMap((owner) => categories.map((cat) => cellId(owner.id, cat)));
}

function familyMastery(familyKey) {
  const ids = familyCellIds(familyKey);
  return ids.reduce((sum, id) => sum + cellMastery(id), 0) / ids.length;
}

function renderFamilyMastery() {
  el.familyMasteryGrid.innerHTML = Object.entries(familyMeta)
    .map(([key, meta]) => {
      const ids = familyCellIds(key);
      const agg = ids.reduce(
        (acc, id) => {
          const s = ensureCellStats(id);
          acc.correct += s.correct;
          acc.wrong += s.wrong;
          acc.correctResponseMs += s.correctResponseMs;
          return acc;
        },
        { correct: 0, wrong: 0, correctResponseMs: 0 },
      );
      const avgMs = agg.correct ? agg.correctResponseMs / agg.correct : null;
      const mastery = familyMastery(key);
      return `
        <article class="family-card ${meta.colorClass}" style="--mastery: ${mastery}">
          <strong>${meta.display}</strong>
          <span>${meta.label}</span>
          <div class="family-track"><span class="family-track-fill"></span></div>
          <small>${agg.correct} right / ${agg.wrong} missed${avgMs ? ` · ${formatDuration(avgMs)} avg` : ""}</small>
        </article>`;
    })
    .join("");
}

function renderWeakSpots() {
  const weakest = [...allCellIds].sort((a, b) => cellMastery(a) - cellMastery(b)).slice(0, 4);
  el.weakSpotList.innerHTML = weakest
    .map((id) => {
      const { ownerId, category } = parseCellId(id);
      const owner = ownerById[ownerId];
      const family = familyMeta[owner.familyKey];
      const noun = canonicalNouns[category];
      const stats = ensureCellStats(id);
      const avgMs = averageCorrectMs(stats) || averageSeenMs(stats);
      return `
        <article class="weak-spot-item ${family.colorClass}">
          <strong class="weak-title">${owner.forms[category]} ${noun.word}</strong>
          <span class="weak-line">${owner.label} + ${categoryMeta[category].label}</span>
          <span class="weak-line">${stats.correct} right / ${stats.wrong} missed${avgMs ? ` · ${formatDuration(avgMs)} avg` : ""}</span>
          <span class="weak-line">${Math.round(cellMastery(id) * 100)}% mastery</span>
        </article>`;
    })
    .join("");
}

function renderButtons() {
  el.nextButton.disabled = !state.currentSolved;
  el.nextButton.parentElement.classList.toggle("is-hidden", !state.currentSolved);
}

// ─── Helpers ──────────────────────────────────────────────────

function renderPromptChips(item, phase, showSupport) {
  const owner = ownerById[item.ownerId];
  const family = familyMeta[owner.familyKey];
  const ownerChip = `<span class="prompt-chip"><strong>Owner</strong><span lang="ru">${escapeHTML(owner.label)}</span></span>`;
  const columnChip = `<span class="prompt-chip"><strong>Column</strong>${escapeHTML(categoryMeta[item.category].label)}</span>`;
  const familyChip = `<span class="prompt-chip ${family.colorClass}"><strong>Family</strong>${escapeHTML(family.label)}</span>`;

  if (phase === "warmup") return `${ownerChip}${columnChip}${familyChip}`;
  if (phase === "matrix") return showSupport ? `${ownerChip}${columnChip}${familyChip}` : `${ownerChip}${columnChip}`;
  if (phase === "typing") return showSupport ? `${ownerChip}${columnChip}${familyChip}` : `${ownerChip}${columnChip}`;
  if (phase === "mastery") return showSupport ? `${ownerChip}${columnChip}${familyChip}` : "";
  return ownerChip;
}

function formatPrompt(prompt) {
  return escapeHTML(prompt).replace("___", '<span class="blank">___</span>');
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeRussian(text) {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("`", "&#96;");
}

function scrollCurrentNavIntoView() {
  const current = document.querySelector(".page-nav-link.is-current");
  if (!current) return;
  current.scrollIntoView({ block: "nearest", inline: "center" });
}

// ─── Event Handlers ───────────────────────────────────────────

el.stepNav.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-step]");
  if (!btn) return;
  const step = btn.dataset.step;
  state.phaseOverride = step;
  saveState();
  startNextCard();
});

el.optionsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (!button) return;
  submitAnswer(button.dataset.option);
});

el.nextButton.addEventListener("click", () => startNextCard());

el.hintButton.addEventListener("click", () => {
  state.hintVisible = !state.hintVisible;
  saveState();
  renderPrompt(getActivePhase());
});

el.audioButton.addEventListener("click", () => speakCurrentCard());

el.typingSubmit.addEventListener("click", () => submitTyping());

el.typingInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (state.currentSolved) {
      startNextCard();
    } else {
      submitTyping();
    }
  }
});

el.listenPlayBtn.addEventListener("click", () => {
  const item = currentItem();
  if (!item) return;
  speakFullSentence(item);
});

el.listenClueBtn.addEventListener("click", () => {
  state.listeningFallbackVisible = true;
  saveState();
  renderPrompt(getActivePhase());
  render();
});

el.referenceMatrix.addEventListener("click", (event) => {
  const cell = event.target.closest(".matrix-cell");
  if (!cell) return;
  const word = cell.dataset.word;
  if (word) speakWord(word);
});

el.resetSessionButton.addEventListener("click", () => {
  if (!window.confirm("Reset all progress? This cannot be undone.")) return;
  resetSession();
});

document.addEventListener("keydown", (event) => {
  if (
    event.target instanceof Element &&
    event.target.closest("input, textarea, button, a, select, summary, [contenteditable='true']")
  ) {
    return;
  }
  const key = event.key;
  const phase = getActivePhase();

  if (key === " " && phase === "listening" && !state.currentSolved) {
    event.preventDefault();
    const item = currentItem();
    if (item) speakFullSentence(item);
    return;
  }

  if (key >= "1" && key <= "9" && !state.currentSolved && (phase === "warmup" || phase === "matrix" || phase === "listening" || phase === "mastery")) {
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
  if (key === "p" && !state.currentSolved) {
    togglePauseTimer();
  }
});

// ─── Initialization ───────────────────────────────────────────

updatePhaseIfNeeded();
if (!currentItem() || !itemMatchesActivePhase(currentItem()) || !isValidOptionOrder(currentItem())) {
  startNextCard();
} else {
  if (!state.currentSolved) state.cardStartedAt = Date.now();
  render();
}

requestAnimationFrame(scrollCurrentNavIntoView);

if (typeof initSync === "function") {
  initSync("possessives", () => state, (serverState) => {
    state = mergeState(serverState);
    saveState();
    render();
  });
}
