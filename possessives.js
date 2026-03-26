const STORAGE_KEY = "russian-possessive-matrix-state-v1";

const categories = ["masc", "fem", "neut", "plur"];
const phaseOrder = ["warmup", "matrix", "mastery"];
const invariantFamilies = new Set(["his", "her", "their"]);

const categoryMeta = {
  masc: {
    label: "Masculine",
    shortLabel: "masc",
    nounLabel: "masculine noun",
  },
  fem: {
    label: "Feminine",
    shortLabel: "fem",
    nounLabel: "feminine noun",
  },
  neut: {
    label: "Neuter",
    shortLabel: "neut",
    nounLabel: "neuter noun",
  },
  plur: {
    label: "Plural",
    shortLabel: "plur",
    nounLabel: "plural noun",
  },
};

const familyMeta = {
  my: {
    label: "мой family",
    display: "мой / моя / моё / мои",
    colorClass: "family-my",
  },
  yourSg: {
    label: "твой family",
    display: "твой / твоя / твоё / твои",
    colorClass: "family-your-sg",
  },
  his: {
    label: "его",
    display: "его",
    colorClass: "family-his",
  },
  her: {
    label: "её",
    display: "её",
    colorClass: "family-her",
  },
  our: {
    label: "наш family",
    display: "наш / наша / наше / наши",
    colorClass: "family-our",
  },
  yourPl: {
    label: "ваш family",
    display: "ваш / ваша / ваше / ваши",
    colorClass: "family-your-pl",
  },
  their: {
    label: "их",
    display: "их",
    colorClass: "family-their",
  },
};

const ownerRows = [
  {
    id: "ya",
    label: "Я",
    englishPossessive: "my",
    familyKey: "my",
    forms: { masc: "мой", fem: "моя", neut: "моё", plur: "мои" },
  },
  {
    id: "ty",
    label: "Ты",
    englishPossessive: "your",
    familyKey: "yourSg",
    forms: { masc: "твой", fem: "твоя", neut: "твоё", plur: "твои" },
  },
  {
    id: "on",
    label: "Он",
    englishPossessive: "his",
    familyKey: "his",
    forms: { masc: "его", fem: "его", neut: "его", plur: "его" },
  },
  {
    id: "ona",
    label: "Она",
    englishPossessive: "her",
    familyKey: "her",
    forms: { masc: "её", fem: "её", neut: "её", plur: "её" },
  },
  {
    id: "ono",
    label: "Оно",
    englishPossessive: "its",
    familyKey: "his",
    forms: { masc: "его", fem: "его", neut: "его", plur: "его" },
  },
  {
    id: "my",
    label: "Мы",
    englishPossessive: "our",
    familyKey: "our",
    forms: { masc: "наш", fem: "наша", neut: "наше", plur: "наши" },
  },
  {
    id: "vy",
    label: "Вы",
    englishPossessive: "your",
    familyKey: "yourPl",
    forms: { masc: "ваш", fem: "ваша", neut: "ваше", plur: "ваши" },
  },
  {
    id: "oni",
    label: "Они",
    englishPossessive: "their",
    familyKey: "their",
    forms: { masc: "их", fem: "их", neut: "их", plur: "их" },
  },
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

const canonicalNouns = Object.fromEntries(categories.map((category) => [category, nounBuckets[category][0]]));

const phaseMeta = {
  warmup: {
    title: "Step 1: Ending warm-up",
    pill: "Warm-up",
    badge: "Ending warm-up",
    summary: "Manual: Warm-up",
  },
  matrix: {
    title: "Step 2: Chart lab",
    pill: "Chart lab",
    badge: "Chart lab",
    summary: "Manual: Chart lab",
  },
  mastery: {
    title: "Step 3: Timed mastery loop",
    pill: "Mastery",
    badge: "Timed mastery",
    summary: "Manual: Timed mastery",
  },
};

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
    ownerId: "on",
    category: "masc",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "ona",
    category: "fem",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "ono",
    category: "neut",
    options: ["его", "её", "их"],
    mode: "Invariant family",
    subPrompt: "This row does not change by noun type. Just choose whose.",
  },
  {
    ownerId: "oni",
    category: "plur",
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

const allItems = [...warmupItems, ...matrixItems, ...masteryItems];
const itemsById = Object.fromEntries(allItems.map((item) => [item.id, item]));
const allCellIds = ownerRows.flatMap((owner) => categories.map((category) => cellId(owner.id, category)));

const el = {
  cardsSolved: document.querySelector("#cardsSolved"),
  currentStreak: document.querySelector("#currentStreak"),
  accuracyValue: document.querySelector("#accuracyValue"),
  avgResponseValue: document.querySelector("#avgResponseValue"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  referenceMatrix: document.querySelector("#referenceMatrix"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phasePill: document.querySelector("#phasePill"),
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
  familyMasteryGrid: document.querySelector("#familyMasteryGrid"),
  weakSpotList: document.querySelector("#weakSpotList"),
  audioButton: document.querySelector("#audioButton"),
  phaseOverrideSelect: document.querySelector("#phaseOverrideSelect"),
  settingsSummary: document.querySelector("#settingsSummary"),
  memoryNote: document.querySelector("#memoryNote"),
};

const defaultState = {
  currentPhase: "warmup",
  phaseOverride: "auto",
  turn: 0,
  currentItemId: null,
  currentOptionOrder: [],
  currentSolved: false,
  currentChoice: null,
  hintVisible: false,
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

function makeItem({ phase, ownerId, category, noun, options, mode, subPrompt }) {
  const owner = ownerById[ownerId];
  return {
    id: `${phase}-${ownerId}-${category}-${noun.key}`,
    phase,
    cellId: cellId(ownerId, category),
    ownerId,
    category,
    noun,
    answer: owner.forms[category],
    options: [...options],
    mode,
    prompt: `___ ${noun.word}`,
    translation: `${owner.englishPossessive} ${noun.gloss}`,
    subPrompt,
    hint: buildHint(owner, category, noun),
    explanation: buildExplanation(owner, category, noun),
    speechText: `Это ${owner.forms[category]} ${noun.word}.`,
  };
}

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
  merged.phaseOverride = candidate.phaseOverride === "auto" || phaseOrder.includes(candidate.phaseOverride) ? candidate.phaseOverride : "auto";
  merged.currentItemId = itemsById[candidate.currentItemId] ? candidate.currentItemId : null;
  merged.currentOptionOrder = Array.isArray(candidate.currentOptionOrder) ? candidate.currentOptionOrder : [];
  merged.currentSolved = Boolean(candidate.currentSolved);
  merged.currentChoice = typeof candidate.currentChoice === "string" ? candidate.currentChoice : null;
  merged.hintVisible = Boolean(candidate.hintVisible);
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
}

function ensureItemStats(itemId) {
  if (!state.itemStats[itemId]) {
    state.itemStats[itemId] = {
      seen: 0,
      lastTurn: -1,
    };
  }
  return state.itemStats[itemId];
}

function ensureCellStats(id) {
  if (!state.cellStats[id]) {
    state.cellStats[id] = {
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      dueAt: 0,
      lastTurn: -1,
      totalResponseMs: 0,
      correctResponseMs: 0,
      lastResponseMs: null,
    };
  }

  const stats = state.cellStats[id];
  stats.seen = Number.isFinite(stats.seen) ? stats.seen : 0;
  stats.correct = Number.isFinite(stats.correct) ? stats.correct : 0;
  stats.wrong = Number.isFinite(stats.wrong) ? stats.wrong : 0;
  stats.streak = Number.isFinite(stats.streak) ? stats.streak : 0;
  stats.dueAt = Number.isFinite(stats.dueAt) ? stats.dueAt : 0;
  stats.lastTurn = Number.isFinite(stats.lastTurn) ? stats.lastTurn : -1;
  stats.totalResponseMs = Number.isFinite(stats.totalResponseMs) ? stats.totalResponseMs : 0;
  stats.correctResponseMs = Number.isFinite(stats.correctResponseMs) ? stats.correctResponseMs : 0;
  stats.lastResponseMs = Number.isFinite(stats.lastResponseMs) ? stats.lastResponseMs : null;
  return stats;
}

function getActivePhase() {
  return state.phaseOverride === "auto" ? state.currentPhase : state.phaseOverride;
}

function getPoolForPhase(phase) {
  if (phase === "warmup") return warmupItems;
  if (phase === "matrix") return matrixItems;
  return masteryItems;
}

function getCurrentPool() {
  return getPoolForPhase(getActivePhase());
}

function isValidOptionOrder(item) {
  return (
    Array.isArray(state.currentOptionOrder) &&
    state.currentOptionOrder.length === item.options.length &&
    item.options.every((option) => state.currentOptionOrder.includes(option))
  );
}

function updatePhaseIfNeeded() {
  if (state.currentPhase === "warmup") {
    const ready = warmupItems.every((item) => ensureCellStats(item.cellId).correct > 0);
    if (ready) state.currentPhase = "matrix";
  }

  if (state.currentPhase === "matrix") {
    const allSeen = allCellIds.every((id) => ensureCellStats(id).seen > 0);
    if (allSeen) state.currentPhase = "mastery";
  }
}

function phaseProgressText() {
  const activePhase = getActivePhase();

  if (activePhase === "warmup") {
    const mastered = warmupItems.filter((item) => ensureCellStats(item.cellId).correct > 0).length;
    return `${mastered} / ${warmupItems.length} mastered`;
  }

  if (activePhase === "matrix") {
    const seen = allCellIds.filter((id) => ensureCellStats(id).seen > 0).length;
    return `${seen} / ${allCellIds.length} cells seen`;
  }

  const steady = allCellIds.filter((id) => cellMastery(id) >= 0.8).length;
  return `${steady} / ${allCellIds.length} cells steady`;
}

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
  const itemStats = ensureItemStats(item.id);
  const dueBonus = cell.dueAt <= currentTurn ? 12 : 0;
  const unseenBonus = cell.seen === 0 ? 8 : 0;
  const weakBonus = (1 - cellMastery(item.cellId)) * 12;
  const wrongBonus = cell.wrong * 2.6;
  const slowBonus = Math.max(0, ((averageCorrectMs(cell) || averageSeenMs(cell) || 5200) - 2600) / 900);
  const cellRepeatPenalty = cell.lastTurn === currentTurn - 1 ? -10 : 0;
  const itemRepeatPenalty = itemStats.lastTurn === currentTurn - 1 ? -4 : 0;

  return dueBonus + unseenBonus + weakBonus + wrongBonus + slowBonus + cellRepeatPenalty + itemRepeatPenalty + Math.random();
}

function pickNextItemId() {
  const pool = getCurrentPool();
  const currentTurn = state.turn;
  const ranked = [...pool]
    .sort((a, b) => candidateScore(b, currentTurn) - candidateScore(a, currentTurn))
    .filter((item) => item.id !== state.currentItemId || pool.length === 1);

  return ranked[0]?.id || pool[0]?.id || null;
}

function currentItem() {
  return state.currentItemId ? itemsById[state.currentItemId] || null : null;
}

function itemMatchesActivePhase(item) {
  return item.phase === getActivePhase();
}

function startNextCard() {
  updatePhaseIfNeeded();
  state.currentItemId = pickNextItemId();
  const item = currentItem();
  state.currentOptionOrder = item ? shuffle([...item.options]) : [];
  state.currentSolved = false;
  state.currentChoice = null;
  state.hintVisible = false;
  state.lastResponseMs = null;
  state.cardStartedAt = Date.now();
  saveState();
  render();
}

function renderPhaseMeta() {
  const meta = phaseMeta[getActivePhase()];
  el.phaseTitle.textContent = meta.title;
  el.phasePill.textContent = meta.pill;
  el.phaseProgress.textContent = phaseProgressText();
}

function renderHeaderMetrics() {
  const accuracy = state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
  const averageMs = state.totalAnswered ? state.totalResponseMs / state.totalAnswered : 0;

  el.cardsSolved.textContent = `${state.totalAnswered}`;
  el.currentStreak.textContent = `${state.streak}`;
  el.accuracyValue.textContent = `${accuracy}%`;
  el.avgResponseValue.textContent = averageMs ? formatDuration(averageMs) : "0.0s";
}

function renderPrompt() {
  const item = currentItem();
  if (!item) return;

  const owner = ownerById[item.ownerId];
  const family = familyMeta[owner.familyKey];

  el.modeBadge.textContent = phaseMeta[getActivePhase()].badge;
  el.promptLabel.textContent = "Build the phrase";
  el.promptText.innerHTML = formatPrompt(item.prompt);
  el.translationLine.textContent = item.translation;
  el.promptChipRow.innerHTML = `
    <span class="prompt-chip"><strong>Owner</strong>${owner.label}</span>
    <span class="prompt-chip"><strong>Column</strong>${categoryMeta[item.category].label}</span>
    <span class="prompt-chip ${family.colorClass}"><strong>Family</strong>${familyMeta[owner.familyKey].label}</span>
  `;
  el.subPrompt.textContent = item.subPrompt;
  el.choiceNudge.textContent = state.currentSolved
    ? "Good. Read the feedback, then move to the next card."
    : "Tap the correct form below.";
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
        <button
          class="${classes}"
          type="button"
          data-option="${option}"
          ${state.currentSolved ? "disabled" : ""}
        >
          ${option}
        </button>
      `;
    })
    .join("");
}

function renderFeedback() {
  const item = currentItem();
  if (!item) return;

  if (!state.currentSolved) {
    el.feedbackCard.classList.add("is-hidden");
    el.feedbackCard.classList.remove("is-correct", "is-wrong");
    el.feedbackCard.innerHTML = `
      <p class="feedback-title">Pick an answer to see the logic.</p>
      <p class="feedback-body">The explanation will tell you whether you missed the owner, the noun type, or speed.</p>
    `;
    return;
  }

  const correct = state.currentChoice === item.answer;
  const speedLine = describeSpeed(state.lastResponseMs, correct);

  el.feedbackCard.classList.remove("is-hidden");
  el.feedbackCard.classList.toggle("is-correct", correct);
  el.feedbackCard.classList.toggle("is-wrong", !correct);
  el.feedbackCard.innerHTML = `
    <p class="feedback-title">${correct ? `Correct in ${formatDuration(state.lastResponseMs)}.` : `Use ${item.answer}.`}</p>
    <p class="feedback-body">${item.explanation} ${speedLine}</p>
  `;
}

function renderReferenceMatrix() {
  const item = currentItem();
  const headMarkup = `
    <div class="matrix-head">Person</div>
    ${categories
      .map(
        (category) => `
          <div class="matrix-head">
            ${categoryMeta[category].label}
            <span>${categoryMeta[category].shortLabel}</span>
          </div>
        `,
      )
      .join("")}
  `;

  const rowMarkup = ownerRows
    .map((owner) => {
      const family = familyMeta[owner.familyKey];
      const ownerMarkup = `<div class="matrix-owner ${family.colorClass}">${owner.label}</div>`;
      const cellMarkup = categories
        .map((category) => {
          const id = cellId(owner.id, category);
          const active = item?.cellId === id ? "is-active" : "";
          const mastery = cellMastery(id);
          return `
            <div class="matrix-cell ${family.colorClass} ${active}" style="--mastery: ${mastery}">
              <span class="matrix-word">${owner.forms[category]}</span>
              <span class="matrix-percent">${Math.round(mastery * 100)}% mastery</span>
            </div>
          `;
        })
        .join("");

      return ownerMarkup + cellMarkup;
    })
    .join("");

  el.referenceMatrix.innerHTML = headMarkup + rowMarkup;
}

function familyCellIds(familyKey) {
  return ownerRows
    .filter((owner) => owner.familyKey === familyKey)
    .flatMap((owner) => categories.map((category) => cellId(owner.id, category)));
}

function familyMastery(familyKey) {
  const ids = familyCellIds(familyKey);
  const total = ids.reduce((sum, id) => sum + cellMastery(id), 0);
  return total / ids.length;
}

function renderFamilyMastery() {
  el.familyMasteryGrid.innerHTML = Object.entries(familyMeta)
    .map(([familyKey, meta]) => {
      const ids = familyCellIds(familyKey);
      const aggregate = ids.reduce(
        (acc, id) => {
          const stats = ensureCellStats(id);
          acc.correct += stats.correct;
          acc.wrong += stats.wrong;
          acc.correctResponseMs += stats.correctResponseMs;
          return acc;
        },
        { correct: 0, wrong: 0, correctResponseMs: 0 },
      );
      const averageMs = aggregate.correct ? aggregate.correctResponseMs / aggregate.correct : null;
      const mastery = familyMastery(familyKey);

      return `
        <article class="family-card ${meta.colorClass}" style="--mastery: ${mastery}">
          <strong>${meta.display}</strong>
          <span>${meta.label}</span>
          <div class="family-track"><span class="family-track-fill"></span></div>
          <small>${aggregate.correct} right / ${aggregate.wrong} missed${averageMs ? ` · ${formatDuration(averageMs)} avg` : ""}</small>
        </article>
      `;
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
      const averageMs = averageCorrectMs(stats) || averageSeenMs(stats);

      return `
        <article class="weak-spot-item ${family.colorClass}">
          <strong class="weak-title">${owner.forms[category]} ${noun.word}</strong>
          <span class="weak-line">${owner.label} + ${categoryMeta[category].label}</span>
          <span class="weak-line">${stats.correct} right / ${stats.wrong} missed${averageMs ? ` · ${formatDuration(averageMs)} avg` : ""}</span>
          <span class="weak-line">${Math.round(cellMastery(id) * 100)}% mastery</span>
        </article>
      `;
    })
    .join("");
}

function renderButtons() {
  el.nextButton.disabled = !state.currentSolved;
  el.nextButton.parentElement.classList.toggle("is-hidden", !state.currentSolved);
}

function renderSettings() {
  el.phaseOverrideSelect.value = state.phaseOverride;
  el.settingsSummary.textContent = state.phaseOverride === "auto" ? "Automatic step" : phaseMeta[state.phaseOverride].summary;
  el.memoryNote.textContent =
    state.phaseOverride === "auto"
      ? "Progress, current card, and settings resume automatically on this device."
      : "Manual step is active. Switch back to Automatic whenever you want the trainer to choose the next step.";
}

function render() {
  renderPhaseMeta();
  renderHeaderMetrics();
  renderReferenceMatrix();
  renderPrompt();
  renderOptions();
  renderFeedback();
  renderFamilyMastery();
  renderWeakSpots();
  renderButtons();
  renderSettings();
}

function submitAnswer(choice) {
  const item = currentItem();
  if (!item || state.currentSolved) return;

  const itemStats = ensureItemStats(item.id);
  const cellStats = ensureCellStats(item.cellId);
  const responseMs = clamp(Date.now() - (state.cardStartedAt || Date.now()), 450, 15000);
  const correct = choice === item.answer;

  itemStats.seen += 1;
  itemStats.lastTurn = state.turn;

  cellStats.seen += 1;
  cellStats.lastTurn = state.turn;
  cellStats.totalResponseMs += responseMs;
  cellStats.lastResponseMs = responseMs;

  state.totalAnswered += 1;
  state.totalResponseMs += responseMs;
  state.currentChoice = choice;
  state.currentSolved = true;
  state.lastResponseMs = responseMs;

  if (correct) {
    cellStats.correct += 1;
    cellStats.correctResponseMs += responseMs;
    cellStats.streak += 1;
    cellStats.dueAt = state.turn + nextInterval(responseMs, cellStats.streak);
    state.totalCorrect += 1;
    state.streak += 1;
  } else {
    cellStats.wrong += 1;
    cellStats.streak = 0;
    cellStats.dueAt = state.turn + 1;
    state.streak = 0;
  }

  state.turn += 1;
  saveState();
  updatePhaseIfNeeded();
  render();
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

function speakCurrentCard() {
  const item = currentItem();
  if (!item || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(item.speechText);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function resetSession() {
  state = structuredClone(defaultState);
  saveState();
  startNextCard();
}

function formatPrompt(prompt) {
  return prompt.replace("___", '<span class="blank">___</span>');
}

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

el.phaseOverrideSelect.addEventListener("change", (event) => {
  state.phaseOverride = event.target.value;
  saveState();
  startNextCard();
});

el.resetSessionButton.addEventListener("click", () => {
  resetSession();
});

updatePhaseIfNeeded();
if (!currentItem() || !itemMatchesActivePhase(currentItem()) || !isValidOptionOrder(currentItem())) {
  startNextCard();
} else {
  if (!state.currentSolved) state.cardStartedAt = Date.now();
  render();
}
