const STORAGE_KEY = "russian-form-trainer-state-v1";

const formMeta = {
  был: {
    label: "был",
    lane: "past",
    title: "Masculine singular past",
    cue: "Yesterday + masculine subject",
    note: "Used with он, брат, учитель.",
  },
  была: {
    label: "была",
    lane: "past",
    title: "Feminine singular past",
    cue: "Yesterday + feminine subject",
    note: "Used with она, мама, сестра.",
  },
  было: {
    label: "было",
    lane: "past",
    title: "Neuter singular past",
    cue: "Yesterday + neuter subject",
    note: "Used with neuter nouns like письмо.",
  },
  были: {
    label: "были",
    lane: "past",
    title: "Plural past",
    cue: "Yesterday + plural subject",
    note: "Used with они, дети, друзья, мы.",
  },
  буду: {
    label: "буду",
    lane: "future",
    title: "First-person singular future",
    cue: "Tomorrow + я",
    note: "I will.",
  },
  будешь: {
    label: "будешь",
    lane: "future",
    title: "Second-person singular future",
    cue: "Tomorrow + ты",
    note: "You will, singular.",
  },
  будет: {
    label: "будет",
    lane: "future",
    title: "Third-person singular future",
    cue: "Tomorrow + он / она / оно",
    note: "He, she, or it will.",
  },
  будем: {
    label: "будем",
    lane: "future",
    title: "First-person plural future",
    cue: "Tomorrow + мы",
    note: "We will.",
  },
  будете: {
    label: "будете",
    lane: "future",
    title: "Second-person plural future",
    cue: "Tomorrow + вы",
    note: "You will, plural or polite.",
  },
  будут: {
    label: "будут",
    lane: "future",
    title: "Third-person plural future",
    cue: "Tomorrow + они",
    note: "They will.",
  },
};

const pastForms = ["был", "была", "было", "были"];
const futureForms = ["буду", "будешь", "будет", "будем", "будете", "будут"];
const allForms = [...pastForms, ...futureForms];
const phaseOrder = ["warmup", "sentences", "mastery"];
const phaseMeta = {
  warmup: {
    title: "Step 1: Pattern warm-up",
    pill: "Warm-up",
    badge: "Warm-up",
    summary: "Manual: Warm-up",
  },
  sentences: {
    title: "Step 2: Sentence lab",
    pill: "Sentence lab",
    badge: "Sentence lab",
    summary: "Manual: Sentence lab",
  },
  mastery: {
    title: "Step 3: Mixed mastery loop",
    pill: "Mastery",
    badge: "Mixed review",
    summary: "Manual: Mixed mastery",
  },
};

const warmupItems = [
  {
    id: "warmup-byl",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Вчера он ______ дома.",
    subPrompt: "Past cue first. Then identify the subject.",
    answer: "был",
    options: pastForms,
    focus: "Past + masculine singular",
    hint: "Past tense agrees with the subject. Он is masculine singular.",
    explanation: "Because the sentence is in the past and the subject is masculine singular, the correct form is был.",
    speechText: "Вчера он был дома.",
  },
  {
    id: "warmup-byla",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Вчера она ______ дома.",
    subPrompt: "Past cue first. Then identify the subject.",
    answer: "была",
    options: pastForms,
    focus: "Past + feminine singular",
    hint: "Она is feminine singular, so use the feminine past form.",
    explanation: "Она is feminine singular, so the past form must be была.",
    speechText: "Вчера она была дома.",
  },
  {
    id: "warmup-bylo",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Вчера письмо ______ короткое.",
    subPrompt: "Past cue first. Then identify the noun gender.",
    answer: "было",
    options: pastForms,
    focus: "Past + neuter singular",
    hint: "Письмо is neuter singular, so it takes было.",
    explanation: "Письмо is a neuter singular noun. In the past, neuter singular subjects use было.",
    speechText: "Вчера письмо было короткое.",
  },
  {
    id: "warmup-byli",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Вчера они ______ дома.",
    subPrompt: "Past cue first. Then spot number.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural",
    hint: "Plural subjects use были in the past.",
    explanation: "Они is plural, so the past form is были.",
    speechText: "Вчера они были дома.",
  },
  {
    id: "warmup-budu",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Завтра я ______ дома.",
    subPrompt: "Future cue first. Then identify the person.",
    answer: "буду",
    options: futureForms,
    focus: "Future + я",
    hint: "Я takes буду in the future.",
    explanation: "The sentence points forward, and я takes the first-person singular future form буду.",
    speechText: "Завтра я буду дома.",
  },
  {
    id: "warmup-budesh",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Завтра ты ______ дома.",
    subPrompt: "Future cue first. Then identify the person.",
    answer: "будешь",
    options: futureForms,
    focus: "Future + ты",
    hint: "Ты takes будешь.",
    explanation: "Ты is second-person singular, so the future form is будешь.",
    speechText: "Завтра ты будешь дома.",
  },
  {
    id: "warmup-budet",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Сегодня вечером она ______ учиться.",
    subPrompt: "A future time can be tomorrow or later today.",
    answer: "будет",
    options: futureForms,
    focus: "Future + она",
    hint: "Она takes будет in the future.",
    explanation: "The time cue points forward and она is third-person singular, so the correct form is будет.",
    speechText: "Сегодня вечером она будет учиться.",
  },
  {
    id: "warmup-budem",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Завтра мы ______ работать.",
    subPrompt: "The infinitive does not change the future form.",
    answer: "будем",
    options: futureForms,
    focus: "Future + мы",
    hint: "Мы takes будем, even before an infinitive.",
    explanation: "Мы is first-person plural. In compound future, you still choose the form from the subject: будем работать.",
    speechText: "Завтра мы будем работать.",
  },
  {
    id: "warmup-budete",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Завтра вы ______ смотреть фильм?",
    subPrompt: "Future cue first. Then notice whether the subject is вы.",
    answer: "будете",
    options: futureForms,
    focus: "Future + вы",
    hint: "Вы always takes будете in this set, whether plural or polite singular.",
    explanation: "Вы takes the second-person plural future form будете, including in polite singular speech.",
    speechText: "Завтра вы будете смотреть фильм?",
  },
  {
    id: "warmup-budut",
    phase: "warmup",
    mode: "Pattern cue",
    prompt: "Завтра они ______ играть в футбол.",
    subPrompt: "The infinitive stays the same; only the future form changes.",
    answer: "будут",
    options: futureForms,
    focus: "Future + они",
    hint: "Они takes будут.",
    explanation: "Они is third-person plural, so the future form is будут.",
    speechText: "Завтра они будут играть в футбол.",
  },
];

const sentenceItems = [
  {
    id: "sentence-1",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра вечером вы ______ дома?",
    answer: "будете",
    options: futureForms,
    focus: "Future + вы",
    hint: "The subject is вы. In the future, that maps to будете.",
    explanation: "The time cue is future and the subject is вы, so the correct form is будете.",
    speechText: "Завтра вечером вы будете дома?",
  },
  {
    id: "sentence-2",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера моя мама ______ в кафе.",
    answer: "была",
    options: pastForms,
    focus: "Past + feminine singular",
    hint: "Мама is feminine singular.",
    explanation: "Because мама is feminine singular, the past form is была.",
    speechText: "Вчера моя мама была в кафе.",
  },
  {
    id: "sentence-3",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра они ______ играть в футбол.",
    answer: "будут",
    options: futureForms,
    focus: "Future + они",
    hint: "Third-person plural future takes будут.",
    explanation: "The sentence is future and the subject is они, so choose будут.",
    speechText: "Завтра они будут играть в футбол.",
  },
  {
    id: "sentence-4",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера письмо ______ очень короткое.",
    answer: "было",
    options: pastForms,
    focus: "Past + neuter singular",
    hint: "Письмо is neuter singular.",
    explanation: "Письмо is neuter, so the correct past form is было.",
    speechText: "Вчера письмо было очень короткое.",
  },
  {
    id: "sentence-5",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра я ______ дома.",
    answer: "буду",
    options: futureForms,
    focus: "Future + я",
    hint: "Я takes буду.",
    explanation: "The future form for я is буду.",
    speechText: "Завтра я буду дома.",
  },
  {
    id: "sentence-6",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера вечером мы ______ дома.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural",
    hint: "Мы is plural in the past.",
    explanation: "Past tense with a plural subject uses были.",
    speechText: "Вчера вечером мы были дома.",
  },
  {
    id: "sentence-7",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра утром дети ______ в школе.",
    answer: "будут",
    options: futureForms,
    focus: "Future + plural noun",
    hint: "Дети is plural, so future takes будут.",
    explanation: "Дети is a plural subject. In the future, plural third person takes будут.",
    speechText: "Завтра утром дети будут в школе.",
  },
  {
    id: "sentence-8",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера она ______ очень уставшая.",
    answer: "была",
    options: pastForms,
    focus: "Past + feminine singular",
    hint: "Она is feminine singular.",
    explanation: "The subject is feminine singular, so the correct past form is была.",
    speechText: "Вчера она была очень уставшая.",
  },
  {
    id: "sentence-9",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра вечером вы ______ смотреть фильм?",
    answer: "будете",
    options: futureForms,
    focus: "Future + вы + infinitive",
    hint: "Вы still takes будете before an infinitive.",
    explanation: "In the compound future, the subject still controls the future form: вы будете смотреть.",
    speechText: "Завтра вечером вы будете смотреть фильм?",
  },
  {
    id: "sentence-10",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера дети ______ в школе.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural noun",
    hint: "Дети is plural.",
    explanation: "Plural subjects use были in the past.",
    speechText: "Вчера дети были в школе.",
  },
  {
    id: "sentence-11",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра вечером ты ______ дома?",
    answer: "будешь",
    options: futureForms,
    focus: "Future + ты",
    hint: "Ты takes будешь.",
    explanation: "The future form for ты is будешь.",
    speechText: "Завтра вечером ты будешь дома?",
  },
  {
    id: "sentence-12",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера мой учитель ______ очень добрый.",
    answer: "был",
    options: pastForms,
    focus: "Past + masculine singular",
    hint: "Учитель is masculine singular here.",
    explanation: "Мой учитель is masculine singular, so the correct past form is был.",
    speechText: "Вчера мой учитель был очень добрый.",
  },
  {
    id: "sentence-13",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра мы ______ работать.",
    answer: "будем",
    options: futureForms,
    focus: "Future + мы + infinitive",
    hint: "Мы maps to будем.",
    explanation: "The subject is мы, so use the first-person plural future form будем.",
    speechText: "Завтра мы будем работать.",
  },
  {
    id: "sentence-14",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера вечером мои друзья ______ на вечеринке.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural noun",
    hint: "Друзья is plural.",
    explanation: "Мои друзья is a plural subject, so the past form is были.",
    speechText: "Вчера вечером мои друзья были на вечеринке.",
  },
  {
    id: "sentence-15",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра я ______ в университете.",
    answer: "буду",
    options: futureForms,
    focus: "Future + я",
    hint: "Я takes буду.",
    explanation: "The correct future form for я is буду.",
    speechText: "Завтра я буду в университете.",
  },
  {
    id: "sentence-16",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера вечером моя сестра ______ в магазине.",
    answer: "была",
    options: pastForms,
    focus: "Past + feminine singular",
    hint: "Сестра is feminine singular.",
    explanation: "Моя сестра is feminine singular, so use была.",
    speechText: "Вчера вечером моя сестра была в магазине.",
  },
  {
    id: "sentence-17",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра они ______ в парке.",
    answer: "будут",
    options: futureForms,
    focus: "Future + они",
    hint: "They will = будут.",
    explanation: "Они is third-person plural, so choose будут.",
    speechText: "Завтра они будут в парке.",
  },
  {
    id: "sentence-18",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера мы ______ на встрече.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural",
    hint: "Мы is plural in the past.",
    explanation: "Plural past tense takes были, so the answer is были.",
    speechText: "Вчера мы были на встрече.",
  },
  {
    id: "sentence-19",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера я ______ дома.",
    options: pastForms,
    focus: "Past + speaker gender",
    hint: "With я in the past, choose by the speaker’s gender.",
    explanation: "Past tense with я depends on the speaker. The app uses your selected speaker setting for the target answer and will show the other valid form too.",
  },
  {
    id: "sentence-20",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра вечером она ______ готовить ужин.",
    answer: "будет",
    options: futureForms,
    focus: "Future + она + infinitive",
    hint: "Она takes будет.",
    explanation: "The subject is она, so the future form is будет: она будет готовить.",
    speechText: "Завтра вечером она будет готовить ужин.",
  },
  {
    id: "sentence-21",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Завтра утром ты ______ работать.",
    answer: "будешь",
    options: futureForms,
    focus: "Future + ты + infinitive",
    hint: "Ты maps to будешь.",
    explanation: "The future form for ты is будешь, even before an infinitive.",
    speechText: "Завтра утром ты будешь работать.",
  },
  {
    id: "sentence-22",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера мои друзья ______ в городе.",
    answer: "были",
    options: pastForms,
    focus: "Past + plural noun",
    hint: "Plural subject = были.",
    explanation: "Мои друзья is plural, so the past form is были.",
    speechText: "Вчера мои друзья были в городе.",
  },
  {
    id: "sentence-23",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Сегодня вечером моя сестра ______ учиться.",
    answer: "будет",
    options: futureForms,
    focus: "Future + она",
    hint: "A later-today cue still points to the future.",
    explanation: "Сегодня вечером still points forward from now, and моя сестра is third-person singular, so use будет.",
    speechText: "Сегодня вечером моя сестра будет учиться.",
  },
  {
    id: "sentence-24",
    phase: "sentences",
    mode: "Sentence lab",
    prompt: "Вчера утром мой брат ______ на работе.",
    answer: "был",
    options: pastForms,
    focus: "Past + masculine singular",
    hint: "Брат is masculine singular.",
    explanation: "Мой брат is masculine singular, so the correct past form is был.",
    speechText: "Вчера утром мой брат был на работе.",
  },
];

const itemsById = Object.fromEntries([...warmupItems, ...sentenceItems].map((item) => [item.id, item]));

const el = {
  pastChipRow: document.querySelector("#pastChipRow"),
  futureChipRow: document.querySelector("#futureChipRow"),
  speakerGenderControl: document.querySelector("#speakerGenderControl"),
  cardsSolved: document.querySelector("#cardsSolved"),
  currentStreak: document.querySelector("#currentStreak"),
  accuracyValue: document.querySelector("#accuracyValue"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phasePill: document.querySelector("#phasePill"),
  phaseProgress: document.querySelector("#phaseProgress"),
  modeBadge: document.querySelector("#modeBadge"),
  promptLabel: document.querySelector("#promptLabel"),
  promptText: document.querySelector("#promptText"),
  subPrompt: document.querySelector("#subPrompt"),
  choiceNudge: document.querySelector("#choiceNudge"),
  hintButton: document.querySelector("#hintButton"),
  hintText: document.querySelector("#hintText"),
  feedbackCard: document.querySelector("#feedbackCard"),
  nextButton: document.querySelector("#nextButton"),
  optionsGrid: document.querySelector("#optionsGrid"),
  masteryGrid: document.querySelector("#masteryGrid"),
  weakSpotList: document.querySelector("#weakSpotList"),
  audioButton: document.querySelector("#audioButton"),
  phaseOverrideSelect: document.querySelector("#phaseOverrideSelect"),
  settingsSummary: document.querySelector("#settingsSummary"),
  memoryNote: document.querySelector("#memoryNote"),
};

const defaultState = {
  speakerGender: "masculine",
  currentPhase: "warmup",
  phaseOverride: "auto",
  turn: 0,
  currentItemId: null,
  currentOptionOrder: [],
  currentSolved: false,
  currentChoice: null,
  hintVisible: false,
  savedAt: null,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  itemStats: {},
  formStats: allForms.reduce((acc, form) => {
    acc[form] = { correct: 0, wrong: 0 };
    return acc;
  }, {}),
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(candidate) {
  const merged = structuredClone(defaultState);
  Object.assign(merged, candidate);
  merged.currentPhase = phaseOrder.includes(candidate.currentPhase) ? candidate.currentPhase : "warmup";
  merged.phaseOverride = candidate.phaseOverride === "auto" || phaseOrder.includes(candidate.phaseOverride) ? candidate.phaseOverride : "auto";
  merged.currentOptionOrder = Array.isArray(candidate.currentOptionOrder)
    ? candidate.currentOptionOrder.filter((option) => allForms.includes(option))
    : [];
  merged.savedAt = typeof candidate.savedAt === "number" ? candidate.savedAt : null;
  merged.itemStats = { ...defaultState.itemStats, ...(candidate.itemStats || {}) };
  merged.formStats = allForms.reduce((acc, form) => {
    acc[form] = {
      correct: candidate.formStats?.[form]?.correct || 0,
      wrong: candidate.formStats?.[form]?.wrong || 0,
    };
    return acc;
  }, {});
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
      correct: 0,
      wrong: 0,
      streak: 0,
      dueAt: 0,
      lastTurn: -1,
    };
  }
  return state.itemStats[itemId];
}

function getConfiguredAnswer(item) {
  if (item.id !== "sentence-19") return item.answer;
  return state.speakerGender === "feminine" ? "была" : "был";
}

function getSpeechText(item) {
  if (item.speechText) return item.speechText;
  if (item.id === "sentence-19") {
    return state.speakerGender === "feminine" ? "Вчера я была дома." : "Вчера я был дома.";
  }
  return item.prompt.replace("______", getConfiguredAnswer(item));
}

function formatPrompt(prompt) {
  return prompt.replace("______", '<span class="blank">______</span>');
}

function renderFormChips() {
  const pastMarkup = pastForms
    .map(
      (form) => `
        <div class="form-chip">
          <strong>${form}</strong>
          <span>${formMeta[form].title}</span>
        </div>
      `,
    )
    .join("");

  const futureMarkup = futureForms
    .map(
      (form) => `
        <div class="form-chip">
          <strong>${form}</strong>
          <span>${formMeta[form].title}</span>
        </div>
      `,
    )
    .join("");

  el.pastChipRow.innerHTML = pastMarkup;
  el.futureChipRow.innerHTML = futureMarkup;
}

function getPoolForPhase(phase) {
  if (phase === "warmup") return warmupItems;
  if (phase === "sentences") return sentenceItems;
  return [...warmupItems, ...sentenceItems];
}

function getActivePhase() {
  return state.phaseOverride === "auto" ? state.currentPhase : state.phaseOverride;
}

function getCurrentPool() {
  return getPoolForPhase(getActivePhase());
}

function getOptionSetForItem(item) {
  return getActivePhase() === "mastery" ? allForms : item.options;
}

function isValidOptionOrder(item) {
  const optionSet = getOptionSetForItem(item);
  return (
    Array.isArray(state.currentOptionOrder) &&
    state.currentOptionOrder.length === optionSet.length &&
    optionSet.every((option) => state.currentOptionOrder.includes(option))
  );
}

function phaseProgressText() {
  const activePhase = getActivePhase();

  if (activePhase === "warmup") {
    const mastered = warmupItems.filter((item) => (state.itemStats[item.id]?.correct || 0) > 0).length;
    return `${mastered} / ${warmupItems.length} mastered`;
  }

  if (activePhase === "sentences") {
    const seen = sentenceItems.filter((item) => (state.itemStats[item.id]?.seen || 0) > 0).length;
    return `${seen} / ${sentenceItems.length} seen`;
  }

  const masteredForms = allForms.filter((form) => formMastery(form) >= 0.72).length;
  return `${masteredForms} / ${allForms.length} forms steady`;
}

const phaseLabels = {
  warmup: { title: "Warm-up", next: "Sentence Lab" },
  sentences: { title: "Sentence Lab", next: "Mixed Mastery" },
  mastery: { title: "Mixed Mastery", next: null },
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
    const ready = warmupItems.every((item) => (state.itemStats[item.id]?.correct || 0) > 0);
    if (ready) state.currentPhase = "sentences";
  }

  if (state.currentPhase === "sentences") {
    const allSeen = sentenceItems.every((item) => (state.itemStats[item.id]?.seen || 0) > 0);
    if (allSeen) state.currentPhase = "mastery";
  }

  if (state.currentPhase !== before && state.phaseOverride === "auto") {
    showPhaseBanner(before, state.currentPhase);
  }
}

function candidateScore(item, currentTurn) {
  const stats = ensureItemStats(item.id);
  const target = getConfiguredAnswer(item);
  const form = state.formStats[target];
  const dueBonus = stats.dueAt <= currentTurn ? 12 : 0;
  const unseenBonus = stats.seen === 0 ? 8 : 0;
  const wrongBonus = stats.wrong * 3;
  const weakFormBonus = Math.max(0, form.wrong - form.correct + 2);
  const recencyPenalty = stats.lastTurn === currentTurn - 1 ? -8 : 0;
  return dueBonus + unseenBonus + wrongBonus + weakFormBonus + recencyPenalty + Math.random();
}

function pickNextItemId() {
  const pool = getCurrentPool();
  const currentTurn = state.turn;
  const ranked = [...pool]
    .sort((a, b) => candidateScore(b, currentTurn) - candidateScore(a, currentTurn))
    .filter((item) => ensureItemStats(item.id).lastTurn !== currentTurn);

  return ranked[0]?.id || pool[0]?.id || null;
}

function currentItem() {
  if (!state.currentItemId) return null;
  return itemsById[state.currentItemId];
}

function itemMatchesActivePhase(item) {
  const activePhase = getActivePhase();
  if (activePhase === "mastery") return true;
  return item.phase === activePhase;
}

function startNextCard() {
  updatePhaseIfNeeded();
  state.currentItemId = pickNextItemId();
  const item = currentItem();
  state.currentOptionOrder = item ? shuffle([...getOptionSetForItem(item)]) : [];
  state.currentSolved = false;
  state.currentChoice = null;
  state.hintVisible = false;
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
  const total = state.totalAnswered;
  const accuracy = total ? Math.round((state.totalCorrect / total) * 100) : 0;
  el.cardsSolved.textContent = `${total}`;
  el.currentStreak.textContent = `${state.streak}`;
  el.accuracyValue.textContent = `${accuracy}%`;
}

function renderGenderControl() {
  el.speakerGenderControl.querySelectorAll(".segment").forEach((button) => {
    const active = button.dataset.gender === state.speakerGender;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderPrompt() {
  const item = currentItem();
  if (!item) return;

  el.modeBadge.textContent = phaseMeta[getActivePhase()].badge;
  el.promptLabel.textContent = getActivePhase() === "warmup" ? "Russian cue" : "Russian sentence";
  el.promptText.innerHTML = formatPrompt(item.prompt);
  el.subPrompt.textContent = item.subPrompt || "";
  el.choiceNudge.textContent = state.currentSolved
    ? "Good. Review the explanation, then tap Next card."
    : "Tap the correct form below.";
  el.hintButton.textContent = state.hintVisible ? "Hide hint" : "Reveal hint";
  el.hintText.textContent = state.hintVisible ? item.hint : "";
}

function renderOptions() {
  const item = currentItem();
  if (!item) return;

  const answer = getConfiguredAnswer(item);
  const options = isValidOptionOrder(item) ? state.currentOptionOrder : [...getOptionSetForItem(item)];
  el.optionsGrid.innerHTML = options
    .map((option) => {
      const selected = state.currentChoice === option;
      let classes = "option-button";

      if (selected) classes += " is-selected";
      if (state.currentSolved && option === answer) classes += " is-correct";
      if (state.currentSolved && selected && option !== answer) classes += " is-wrong";

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
      <p class="feedback-body">The explanation will tell you exactly what cue to notice next time.</p>
    `;
    return;
  }

  const answer = getConfiguredAnswer(item);
  const correct = state.currentChoice === answer;
  const alternate =
    item.id === "sentence-19"
      ? state.speakerGender === "feminine"
        ? "Masculine speakers would say я был."
        : "Feminine speakers would say я была."
      : "";

  el.feedbackCard.classList.remove("is-hidden");
  el.feedbackCard.classList.toggle("is-correct", correct);
  el.feedbackCard.classList.toggle("is-wrong", !correct);
  el.feedbackCard.innerHTML = `
    <p class="feedback-title">${correct ? "Correct." : `Use ${answer}.`}</p>
    <p class="feedback-body">${item.explanation}${alternate ? ` ${alternate}` : ""}</p>
  `;
}

function renderMastery() {
  el.masteryGrid.innerHTML = allForms
    .map((form) => {
      const score = formMastery(form);
      const stats = state.formStats[form];
      return `
        <article class="mastery-tile">
          <strong>${form}</strong>
          <div>${formMeta[form].cue}</div>
          <div class="mastery-track"><span class="mastery-fill" style="width: ${Math.round(score * 100)}%"></span></div>
          <small>${stats.correct} right / ${stats.wrong} missed</small>
        </article>
      `;
    })
    .join("");
}

function renderWeakSpots() {
  const weakest = [...allForms]
    .sort((a, b) => formMastery(a) - formMastery(b))
    .slice(0, 3);

  el.weakSpotList.innerHTML = weakest
    .map((form) => `
      <article class="weak-spot-item">
        <strong>${form}</strong>
        <span>${formMeta[form].cue}</span>
        <span>${formMeta[form].note}</span>
      </article>
    `)
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
      : "Manual step is active. Switch back to Automatic whenever you want the trainer to choose the next step for you.";
}

function render() {
  renderPhaseMeta();
  renderHeaderMetrics();
  renderGenderControl();
  renderSettings();
  renderPrompt();
  renderOptions();
  renderFeedback();
  renderMastery();
  renderWeakSpots();
  renderButtons();
}

function formMastery(form) {
  const stats = state.formStats[form];
  const total = stats.correct + stats.wrong;
  if (!total) return 0.12;
  return Math.max(0.08, stats.correct / total);
}

function submitAnswer(choice) {
  const item = currentItem();
  if (!item || state.currentSolved) return;

  const answer = getConfiguredAnswer(item);
  const stats = ensureItemStats(item.id);
  const correct = choice === answer;

  stats.seen += 1;
  stats.lastTurn = state.turn;
  state.totalAnswered += 1;
  state.currentChoice = choice;
  state.currentSolved = true;

  if (correct) {
    stats.correct += 1;
    stats.streak += 1;
    stats.dueAt = state.turn + 4 + Math.min(4, stats.streak);
    state.totalCorrect += 1;
    state.streak += 1;
    state.formStats[answer].correct += 1;
  } else {
    stats.wrong += 1;
    stats.streak = 0;
    stats.dueAt = state.turn + 2;
    state.streak = 0;
    state.formStats[answer].wrong += 1;
  }

  state.turn += 1;
  saveState();
  updatePhaseIfNeeded();
  render();
}

function speakCurrentCard() {
  const item = currentItem();
  if (!item || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(getSpeechText(item));
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

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
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
});

el.speakerGenderControl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gender]");
  if (!button) return;
  const nextGender = button.dataset.gender;
  if (nextGender === state.speakerGender) return;
  state.speakerGender = nextGender;
  saveState();
  render();
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

renderFormChips();

updatePhaseIfNeeded();
if (!currentItem() || !itemMatchesActivePhase(currentItem()) || !isValidOptionOrder(currentItem())) {
  startNextCard();
} else {
  render();
}
