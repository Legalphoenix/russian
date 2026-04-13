const STORAGE_KEY = "russian-plural-trainer-state-v2";
const LEGACY_STORAGE_KEYS = ["russian-plural-trainer-state-v1"];

const phaseOrder = ["regular", "tricky", "irregular", "mastery"];
const speedTargets = {
  regular: 3200,
  tricky: 4300,
  irregular: 5200,
};

const phaseMeta = {
  regular: {
    title: "Step 1: Regular endings",
    pill: "Regular endings",
    badge: "Form contrast",
    summary: "Manual: Regular endings",
  },
  tricky: {
    title: "Step 2: Stress and tricky shifts",
    pill: "Stress and shifts",
    badge: "Stress contrast",
    summary: "Manual: Stress and tricky shifts",
  },
  irregular: {
    title: "Step 3: Irregular plurals",
    pill: "Irregular plurals",
    badge: "Irregular contrast",
    summary: "Manual: Irregular plurals",
  },
  mastery: {
    title: "Step 4: Mixed mastery",
    pill: "Mixed mastery",
    badge: "Mixed contrast",
    summary: "Manual: Mixed mastery",
  },
};

const rawItems = [
  {
    id: "student",
    singular: "студент",
    plural: "студенты",
    gloss: "student",
    step: "regular",
    family: "regular_masc_consonant",
    note: "Masculine nouns ending in a consonant usually add -ы.",
  },
  {
    id: "museum",
    singular: "музей",
    plural: "музеи",
    gloss: "museum",
    step: "regular",
    family: "regular_masc_soft",
    note: "Remove -й and add -и.",
  },
  {
    id: "car",
    singular: "автомобиль",
    plural: "автомобили",
    gloss: "car",
    step: "regular",
    family: "regular_masc_soft",
    note: "Remove -ь and add -и.",
  },
  {
    id: "actress",
    singular: "актриса",
    plural: "актрисы",
    gloss: "actress",
    step: "regular",
    family: "regular_fem_a",
    note: "Remove -а and add -ы.",
  },
  {
    id: "week",
    singular: "неделя",
    plural: "недели",
    gloss: "week",
    step: "regular",
    family: "regular_fem_ya",
    note: "Remove -я and add -и.",
  },
  {
    id: "station",
    singular: "станция",
    plural: "станции",
    gloss: "station",
    step: "regular",
    family: "regular_fem_ya",
    note: "Remove -я and add -и.",
  },
  {
    id: "door",
    singular: "дверь",
    plural: "двери",
    gloss: "door",
    step: "regular",
    family: "regular_fem_soft",
    note: "Feminine soft-sign nouns usually take -и.",
  },
  {
    id: "cup",
    singular: "чашка",
    plural: "чашки",
    gloss: "cup",
    step: "regular",
    family: "spelling_rule",
    note: "After к we use -и, not -ы.",
  },
  {
    id: "book",
    singular: "книга",
    plural: "книги",
    gloss: "book",
    step: "regular",
    family: "spelling_rule",
    note: "After г we use -и, not -ы.",
  },
  {
    id: "place",
    singular: "место",
    plural: "места",
    gloss: "place",
    step: "regular",
    family: "regular_neut_o",
    note: "Remove -о and add -а.",
  },
  {
    id: "building",
    singular: "здание",
    plural: "здания",
    gloss: "building",
    step: "regular",
    family: "regular_neut_e",
    note: "Remove -е and add -я.",
  },
  {
    id: "table",
    singular: "стол",
    plural: "столы́",
    gloss: "table",
    step: "tricky",
    family: "stress_shift",
    note: "The ending is regular, but the stress moves to the ending.",
  },
  {
    id: "oldman",
    singular: "старик",
    plural: "старики́",
    gloss: "old man",
    step: "tricky",
    family: "stress_shift",
    note: "After к we still use -и, and the stress shifts.",
  },
  {
    id: "game",
    singular: "игра́",
    plural: "и́гры",
    gloss: "game",
    step: "tricky",
    family: "stress_shift",
    note: "Same plural pattern, different stress.",
  },
  {
    id: "hand",
    singular: "рука́",
    plural: "ру́ки",
    gloss: "hand",
    step: "tricky",
    family: "stress_shift",
    note: "After к use -и, and the stress moves to the stem.",
  },
  {
    id: "sister",
    singular: "сестра́",
    plural: "сёстры",
    gloss: "sister",
    step: "tricky",
    family: "stem_change",
    note: "This plural changes both the stem and the stress.",
  },
  {
    id: "window",
    singular: "окно́",
    plural: "о́кна",
    gloss: "window",
    step: "tricky",
    family: "stress_shift",
    note: "Neuter -о noun with a stem-stress plural.",
  },
  {
    id: "sea",
    singular: "мо́ре",
    plural: "моря́",
    gloss: "sea",
    step: "tricky",
    family: "stress_shift",
    note: "Neuter -е noun with -я in the plural and a stress shift.",
  },
  {
    id: "address",
    singular: "адрес",
    plural: "адреса́",
    gloss: "address",
    step: "tricky",
    family: "masc_a_plural",
    note: "Some masculine nouns take -а in the plural.",
  },
  {
    id: "shore",
    singular: "берег",
    plural: "берега́",
    gloss: "shore",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "eye",
    singular: "глаз",
    plural: "глаза́",
    gloss: "eye",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "city",
    singular: "город",
    plural: "города́",
    gloss: "city",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "house",
    singular: "дом",
    plural: "дома́",
    gloss: "house",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "train",
    singular: "поезд",
    plural: "поезда́",
    gloss: "train",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "teacher",
    singular: "учитель",
    plural: "учителя́",
    gloss: "teacher",
    step: "tricky",
    family: "masc_ya_plural",
    note: "Some masculine nouns take -я in the plural.",
  },
  {
    id: "color",
    singular: "цвет",
    plural: "цвета́",
    gloss: "color",
    step: "tricky",
    family: "masc_a_plural",
    note: "Masculine noun with plural in -а.",
  },
  {
    id: "brother",
    singular: "брат",
    plural: "братья",
    gloss: "brother",
    step: "irregular",
    family: "ending_ya",
    note: "This family takes the plural ending -ья.",
  },
  {
    id: "friend",
    singular: "друг",
    plural: "друзья",
    gloss: "friend",
    step: "irregular",
    family: "ending_ya",
    note: "This family takes the plural ending -ья.",
  },
  {
    id: "son",
    singular: "сын",
    plural: "сыновья",
    gloss: "son",
    step: "irregular",
    family: "ending_ya",
    note: "This plural expands to -овья.",
  },
  {
    id: "leaf",
    singular: "лист",
    plural: "листья",
    gloss: "leaf",
    step: "irregular",
    family: "ending_ya",
    note: "This family takes the plural ending -ья.",
  },
  {
    id: "chair",
    singular: "стул",
    plural: "стулья",
    gloss: "chair",
    step: "irregular",
    family: "ending_ya",
    note: "Soft-sign stem with the plural ending -ья.",
  },
  {
    id: "daughter",
    singular: "дочь",
    plural: "дочери",
    gloss: "daughter",
    step: "irregular",
    family: "irregular_fn",
    note: "Completely irregular feminine plural.",
  },
  {
    id: "mother",
    singular: "мать",
    plural: "матери",
    gloss: "mother",
    step: "irregular",
    family: "irregular_fn",
    note: "Completely irregular feminine plural.",
  },
  {
    id: "time",
    singular: "время",
    plural: "времена́",
    gloss: "time",
    step: "irregular",
    family: "irregular_neut",
    note: "Special neuter noun with plural in -ена.",
  },
  {
    id: "tree",
    singular: "дерево",
    plural: "деревья",
    gloss: "tree",
    step: "irregular",
    family: "irregular_neut",
    note: "Special stem plus plural ending -ья.",
  },
  {
    id: "name",
    singular: "имя",
    plural: "имена́",
    gloss: "name",
    step: "irregular",
    family: "irregular_neut",
    note: "Special neuter noun with plural in -ена.",
  },
  {
    id: "knee",
    singular: "колено",
    plural: "колени",
    gloss: "knee",
    step: "irregular",
    family: "irregular_neut",
    note: "Irregular plural in -и.",
  },
  {
    id: "shoulder",
    singular: "плечо",
    plural: "плечи",
    gloss: "shoulder",
    step: "irregular",
    family: "irregular_neut",
    note: "Irregular plural in -и.",
  },
  {
    id: "ear",
    singular: "ухо",
    plural: "уши",
    gloss: "ear",
    step: "irregular",
    family: "irregular_neut",
    note: "Irregular plural with stem change.",
  },
  {
    id: "apple",
    singular: "яблоко",
    plural: "яблоки",
    gloss: "apple",
    step: "irregular",
    family: "irregular_neut",
    note: "This neuter noun uses -и instead of -а.",
  },
  {
    id: "bureau",
    singular: "бюро",
    plural: "бюро",
    gloss: "bureau",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "metro",
    singular: "метро",
    plural: "метро",
    gloss: "metro",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "taxi",
    singular: "такси",
    plural: "такси",
    gloss: "taxi",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "piano",
    singular: "пианино",
    plural: "пианино",
    gloss: "piano",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "radio",
    singular: "радио",
    plural: "радио",
    gloss: "radio",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "whiskey",
    singular: "виски",
    plural: "виски",
    gloss: "whiskey",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "cafe",
    singular: "кафе",
    plural: "кафе",
    gloss: "cafe",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural.",
  },
  {
    id: "coffee",
    singular: "кофе",
    plural: "кофе",
    gloss: "coffee",
    step: "irregular",
    family: "unchanged",
    note: "This noun stays the same in the plural here.",
  },
  {
    id: "child",
    singular: "ребёнок",
    plural: "де́ти",
    gloss: "child",
    step: "irregular",
    family: "very_irregular",
    note: "Very irregular plural. Memorize it as a separate word.",
  },
  {
    id: "person",
    singular: "человек",
    plural: "лю́ди",
    gloss: "person",
    step: "irregular",
    family: "very_irregular",
    note: "Very irregular plural. Memorize it as a separate word.",
  },
];

const STRESS_MARK = /\u0301/g;

const sentencePrompts = {
  student: "Это хорошие ____.",
  museum: "В городе есть известные ____.",
  car: "На улице стоят новые ____.",
  actress: "Это известные ____.",
  week: "Впереди трудные ____.",
  station: "Это большие ____.",
  door: "Здесь старые ____.",
  cup: "На столе стоят чистые ____.",
  book: "На полке лежат новые ____.",
  place: "Здесь свободные ____.",
  building: "Это высокие ____.",
  table: "В комнате стоят большие ____.",
  oldman: "Здесь сидят старые ____.",
  game: "Это интересные ____.",
  hand: "У меня холодные ____.",
  sister: "Это мои ____.",
  window: "В доме большие ____.",
  sea: "На карте есть тёплые ____.",
  address: "У нас новые ____.",
  shore: "У реки крутые ____.",
  eye: "У ребёнка большие ____.",
  city: "Это большие ____.",
  house: "Здесь красивые ____.",
  train: "На станции стоят новые ____.",
  teacher: "Это хорошие ____.",
  color: "Это яркие ____.",
  brother: "Это мои ____.",
  friend: "Это мои ____.",
  son: "Это мои ____.",
  leaf: "На дереве зелёные ____.",
  chair: "В комнате мягкие ____.",
  daughter: "Это мои ____.",
  mother: "На фотографии молодые ____.",
  time: "Это трудные ____.",
  tree: "В парке высокие ____.",
  name: "Это знакомые ____.",
  knee: "После бега болят ____.",
  shoulder: "После спорта болят ____.",
  ear: "У зайца длинные ____.",
  apple: "На столе лежат красные ____.",
  bureau: "В здании новые ____.",
  metro: "В больших городах есть ____.",
  taxi: "На улице ждут ____.",
  piano: "В школе стоят старые ____.",
  radio: "В магазине продаются новые ____.",
  whiskey: "В баре есть дорогие ____.",
  cafe: "В центре есть уютные ____.",
  coffee: "В меню есть разные ____.",
  child: "Во дворе играют ____.",
  person: "На фото улыбаются ____.",
};

const customChoicePools = {
  table: ["сто́лы", "столы", "стола́"],
  oldman: ["ста́рики", "старики", "старикы"],
  game: ["игры́", "игры", "играы"],
  hand: ["руки́", "руки", "рукаы"],
  sister: ["сестры", "сестраы", "сестри"],
  window: ["окна́", "окна", "окны"],
  sea: ["мо́ря", "моря", "мореи"],
  address: ["адреса", "адресы", "адреси"],
  shore: ["берега", "береги", "берегы"],
  eye: ["глаза", "глазы", "глази"],
  city: ["города", "городы", "городи"],
  house: ["дома", "домы", "доми"],
  train: ["поезда", "поезды", "поезди"],
  teacher: ["учителя", "учители", "учительы"],
  color: ["цвета", "цветы", "цвети"],
  brother: ["браты", "брати", "брата"],
  friend: ["други", "другы", "друга"],
  son: ["сыны", "сынья", "сына"],
  leaf: ["листы", "листи", "листа"],
  chair: ["стулы", "стули", "стула"],
  daughter: ["дочи", "дочеры", "дочеря"],
  mother: ["мати", "матеры", "матеря"],
  time: ["времена", "времени", "времены"],
  tree: ["деревы", "дереви", "дерева"],
  name: ["имена", "имени", "имены"],
  knee: ["колена", "колены", "коленья"],
  shoulder: ["плеча", "плечы", "плечья"],
  ear: ["уха", "ухы", "ухья"],
  apple: ["яблока", "яблокы", "яблокя"],
  child: ["ребёнки", "ребёны", "ребёнка"],
  person: ["человеки", "человекы", "человека"],
};

const items = rawItems.map((item) => ({
  ...item,
  sentence: sentencePrompts[item.id] || "Это ____.",
}));

function stripStress(text) {
  return text.normalize("NFD").replace(STRESS_MARK, "").normalize("NFC");
}

function uniqueOptions(list) {
  return [...new Set(list.filter(Boolean))];
}

function makeStemChoice(word, replacement) {
  return `${word}${replacement}`;
}

function replaceEnding(word, ending, replacement) {
  if (!word.endsWith(ending)) return `${word}${replacement}`;
  return `${word.slice(0, -ending.length)}${replacement}`;
}

function familyChoicePool(item) {
  const word = stripStress(item.singular);

  switch (item.family) {
    case "regular_masc_consonant":
      return [makeStemChoice(word, "ы"), makeStemChoice(word, "и"), makeStemChoice(word, "а"), word];
    case "regular_masc_soft": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "и"), makeStemChoice(stem, "ы"), makeStemChoice(stem, "я"), word];
    }
    case "regular_fem_a": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "ы"), makeStemChoice(stem, "и"), makeStemChoice(stem, "я"), word];
    }
    case "regular_fem_ya": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "и"), makeStemChoice(stem, "ы"), makeStemChoice(stem, "я"), word];
    }
    case "regular_fem_soft": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "и"), makeStemChoice(stem, "ы"), makeStemChoice(stem, "я"), word];
    }
    case "spelling_rule": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "и"), makeStemChoice(stem, "ы"), makeStemChoice(stem, "я"), word];
    }
    case "regular_neut_o": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "а"), makeStemChoice(stem, "и"), makeStemChoice(stem, "ы"), word];
    }
    case "regular_neut_e": {
      const stem = word.slice(0, -1);
      return [makeStemChoice(stem, "я"), makeStemChoice(stem, "и"), makeStemChoice(stem, "а"), word];
    }
    case "masc_a_plural":
      return [makeStemChoice(word, "а"), makeStemChoice(word, "ы"), makeStemChoice(word, "и"), word];
    case "masc_ya_plural": {
      const stem = word.endsWith("ь") ? word.slice(0, -1) : word;
      return [makeStemChoice(stem, "я"), makeStemChoice(stem, "и"), makeStemChoice(stem, "а"), word];
    }
    case "unchanged":
      return [word, makeStemChoice(word, "ы"), makeStemChoice(word, "и"), makeStemChoice(word, "а")];
    default:
      return [stripStress(item.plural), replaceEnding(word, word.slice(-1), "ы"), replaceEnding(word, word.slice(-1), "и"), word];
  }
}

function choiceSetForItem(item) {
  const baseChoices = customChoicePools[item.id] || familyChoicePool(item);
  return uniqueOptions([
    item.plural,
    ...baseChoices,
    stripStress(item.plural),
    stripStress(item.singular),
    replaceEnding(stripStress(item.singular), stripStress(item.singular).slice(-1), "а"),
    replaceEnding(stripStress(item.singular), stripStress(item.singular).slice(-1), "я"),
  ]).slice(0, 4);
}

const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));

const dashboardGroups = [
  {
    id: "regular",
    label: "Regular endings",
    note: "consonant, -й, -ь, -а, -я, -о, -е",
    match: (item) => item.step === "regular",
  },
  {
    id: "tricky",
    label: "Stress and -а / -я",
    note: "stress shifts and masculine plurals in -а / -я",
    match: (item) => item.step === "tricky",
  },
  {
    id: "irregular",
    label: "Irregular families",
    note: "special stems, -ья, very irregular nouns",
    match: (item) => item.step === "irregular" && item.family !== "unchanged",
  },
  {
    id: "frozen",
    label: "Unchanged forms",
    note: "same singular and plural form",
    match: (item) => item.family === "unchanged",
  },
];

const el = {
  cardsSolved: document.querySelector("#cardsSolved"),
  accuracyValue: document.querySelector("#accuracyValue"),
  avgCorrectSpeed: document.querySelector("#avgCorrectSpeed"),
  steadyNouns: document.querySelector("#steadyNouns"),
  fastCorrectRate: document.querySelector("#fastCorrectRate"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phasePill: document.querySelector("#phasePill"),
  phaseProgress: document.querySelector("#phaseProgress"),
  modeBadge: document.querySelector("#modeBadge"),
  timerChip: document.querySelector("#timerChip"),
  sentenceText: document.querySelector("#sentenceText"),
  promptWord: document.querySelector("#promptWord"),
  promptGloss: document.querySelector("#promptGloss"),
  promptDirection: document.querySelector("#promptDirection"),
  hintButton: document.querySelector("#hintButton"),
  hintText: document.querySelector("#hintText"),
  optionsGrid: document.querySelector("#optionsGrid"),
  feedbackCard: document.querySelector("#feedbackCard"),
  nextButton: document.querySelector("#nextButton"),
  patternGrid: document.querySelector("#patternGrid"),
  weakList: document.querySelector("#weakList"),
  drillCard: document.querySelector("#drillCard"),
  phaseOverrideSelect: document.querySelector("#phaseOverrideSelect"),
  settingsSummary: document.querySelector("#settingsSummary"),
  memoryNote: document.querySelector("#memoryNote"),
};

const defaultState = {
  currentPhase: "regular",
  phaseOverride: "auto",
  turn: 0,
  currentItemId: null,
  currentOptionOrder: [],
  currentSolved: false,
  currentChoice: null,
  currentHintVisible: false,
  currentStartedAt: null,
  currentResponseMs: null,
  totalAnswered: 0,
  totalCorrect: 0,
  totalCorrectMs: 0,
  totalFastCorrect: 0,
  savedAt: null,
  itemStats: {},
};

let state = loadState();
let timerHandle = null;

function loadState() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return mergeState(JSON.parse(raw));
    }
    return structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(candidate) {
  const merged = structuredClone(defaultState);
  Object.assign(merged, candidate);
  merged.currentPhase = phaseOrder.includes(candidate.currentPhase) ? candidate.currentPhase : "regular";
  merged.phaseOverride = candidate.phaseOverride === "auto" || phaseOrder.includes(candidate.phaseOverride) ? candidate.phaseOverride : "auto";
  merged.currentOptionOrder = Array.isArray(candidate.currentOptionOrder) ? candidate.currentOptionOrder : [];
  merged.currentStartedAt = typeof candidate.currentStartedAt === "number" ? candidate.currentStartedAt : null;
  merged.currentResponseMs = typeof candidate.currentResponseMs === "number" ? candidate.currentResponseMs : null;
  merged.savedAt = typeof candidate.savedAt === "number" ? candidate.savedAt : null;
  merged.itemStats = candidate.itemStats || {};
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
      dueAt: 0,
      lastTurn: -1,
      totalCorrectMs: 0,
      bestMs: null,
      fastCorrect: 0,
    };
  }
  return state.itemStats[itemId];
}

function getPoolForPhase(phase) {
  if (phase === "mastery") return items;
  return items.filter((item) => item.step === phase);
}

function getActivePhase() {
  return state.phaseOverride === "auto" ? state.currentPhase : state.phaseOverride;
}

function speedTargetForItem(item) {
  return speedTargets[item.step] || 3600;
}

function formatMs(ms) {
  if (!ms) return "0.0s";
  const seconds = ms / 1000;
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
}

function currentItem() {
  return state.currentItemId ? itemsById[state.currentItemId] : null;
}

function currentElapsedMs() {
  if (state.currentSolved) return state.currentResponseMs || 0;
  if (!state.currentStartedAt) return 0;
  return Date.now() - state.currentStartedAt;
}

function avgCorrectMsForStats(stats) {
  return stats.correct ? stats.totalCorrectMs / stats.correct : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function itemMastery(item) {
  const stats = ensureItemStats(item.id);
  if (!stats.seen) return 0.08;

  const accuracyScore = stats.correct / stats.seen;
  const avgCorrectMs = avgCorrectMsForStats(stats);
  const speedScore = avgCorrectMs ? clamp(speedTargetForItem(item) / avgCorrectMs, 0.28, 1) : 0.18;
  const repetitionBonus = Math.min(0.1, stats.correct * 0.03);
  return clamp(0.68 * accuracyScore + 0.24 * speedScore + repetitionBonus, 0.05, 1);
}

function itemIsSteady(item) {
  const stats = ensureItemStats(item.id);
  return stats.correct >= 2 && itemMastery(item) >= 0.78;
}

function updatePhaseIfNeeded() {
  if (state.currentPhase === "regular" && getPoolForPhase("regular").every((item) => ensureItemStats(item.id).seen > 0)) {
    state.currentPhase = "tricky";
  }

  if (state.currentPhase === "tricky" && getPoolForPhase("tricky").every((item) => ensureItemStats(item.id).seen > 0)) {
    state.currentPhase = "irregular";
  }

  if (state.currentPhase === "irregular" && getPoolForPhase("irregular").every((item) => ensureItemStats(item.id).seen > 0)) {
    state.currentPhase = "mastery";
  }
}

function phaseProgressText() {
  const activePhase = getActivePhase();
  if (activePhase === "mastery") {
    const steady = items.filter(itemIsSteady).length;
    return `${steady} / ${items.length} steady`;
  }

  const phaseItems = getPoolForPhase(activePhase);
  const seen = phaseItems.filter((item) => ensureItemStats(item.id).seen > 0).length;
  return `${seen} / ${phaseItems.length} seen`;
}

function sentenceWithAnswer(item, answer, className) {
  return item.sentence.replace("____", `<span class="${className}">${answer}</span>`);
}

function renderSentence(item) {
  return state.currentSolved
    ? sentenceWithAnswer(item, item.plural, "sentence-fill")
    : sentenceWithAnswer(item, "____", "sentence-blank");
}

function buildOptionOrder(item) {
  return shuffle(choiceSetForItem(item));
}

function isValidOptionOrder(item) {
  const validChoices = new Set(choiceSetForItem(item));
  return (
    Array.isArray(state.currentOptionOrder) &&
    state.currentOptionOrder.length === 4 &&
    state.currentOptionOrder.includes(item.plural) &&
    state.currentOptionOrder.every((option) => validChoices.has(option))
  );
}

function expectedEndingLabel(item) {
  const plain = stripStress(item.plural);
  if (stripStress(item.singular) === plain && item.family === "unchanged") return "the unchanged form";
  if (plain.endsWith("ья")) return "-ья";
  if (plain.endsWith("ена")) return "-ена";
  if (plain.endsWith("ы")) return "-ы";
  if (plain.endsWith("и")) return "-и";
  if (plain.endsWith("а")) return "-а";
  if (plain.endsWith("я")) return "-я";
  return "this special plural";
}

function explainWrongChoice(item, choice) {
  const picked = stripStress(choice || "");
  const correct = stripStress(item.plural);
  const singular = stripStress(item.singular);

  if (!choice) return item.note;
  if (picked === singular && correct !== singular) {
    return `${choice} leaves the noun in the singular.`;
  }
  if (picked === correct && choice !== item.plural) {
    return "The letters are close, but the stress or spelling is still off.";
  }
  if (picked.endsWith("ы") && !correct.endsWith("ы")) {
    return `${choice} uses -ы, but this noun needs ${expectedEndingLabel(item)}.`;
  }
  if (picked.endsWith("и") && !correct.endsWith("и")) {
    return `${choice} uses -и, but this noun needs ${expectedEndingLabel(item)}.`;
  }
  if (picked.endsWith("а") && !correct.endsWith("а")) {
    return `${choice} uses -а, but this noun needs ${expectedEndingLabel(item)}.`;
  }
  if (picked.endsWith("я") && !correct.endsWith("я")) {
    return `${choice} uses -я, but this noun needs ${expectedEndingLabel(item)}.`;
  }
  return `${choice} follows a different plural pattern from ${item.plural}.`;
}

function itemMatchesActivePhase(item) {
  const activePhase = getActivePhase();
  if (activePhase === "mastery") return true;
  return item.step === activePhase;
}

function candidateScore(item, currentTurn) {
  const stats = ensureItemStats(item.id);
  const dueBonus = stats.dueAt <= currentTurn ? 12 : 0;
  const unseenBonus = stats.seen === 0 ? 9 : 0;
  const wrongBonus = stats.wrong * 3;
  const avgCorrectMs = avgCorrectMsForStats(stats);
  const slowBonus = avgCorrectMs ? Math.max(0, avgCorrectMs / speedTargetForItem(item) - 1) * 4 : 0;
  const masteryBonus = Math.max(0, 1 - itemMastery(item)) * 5;
  const recencyPenalty = stats.lastTurn === currentTurn - 1 ? -8 : 0;
  return dueBonus + unseenBonus + wrongBonus + slowBonus + masteryBonus + recencyPenalty + Math.random();
}

function pickNextItemId() {
  const pool = getPoolForPhase(getActivePhase());
  const currentTurn = state.turn;
  const ranked = [...pool]
    .sort((a, b) => candidateScore(b, currentTurn) - candidateScore(a, currentTurn))
    .filter((item) => ensureItemStats(item.id).lastTurn !== currentTurn);

  return ranked[0]?.id || pool[0]?.id || null;
}

function scrollCardIntoView() {
  if (window.innerWidth >= 720) return;
  requestAnimationFrame(() => {
    el.drillCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function scrollNextIntoView() {
  if (window.innerWidth >= 720) return;
  requestAnimationFrame(() => {
    el.nextButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function startNextCard() {
  updatePhaseIfNeeded();
  state.currentItemId = pickNextItemId();
  const item = currentItem();
  state.currentOptionOrder = item ? buildOptionOrder(item) : [];
  state.currentSolved = false;
  state.currentChoice = null;
  state.currentHintVisible = false;
  state.currentStartedAt = Date.now();
  state.currentResponseMs = null;
  saveState();
  render();
}

function renderHeaderMetrics() {
  const accuracy = state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
  const avgCorrect = state.totalCorrect ? state.totalCorrectMs / state.totalCorrect : 0;
  const fastRate = state.totalCorrect ? Math.round((state.totalFastCorrect / state.totalCorrect) * 100) : 0;
  const steady = items.filter(itemIsSteady).length;

  el.cardsSolved.textContent = `${state.totalAnswered}`;
  el.accuracyValue.textContent = `${accuracy}%`;
  el.avgCorrectSpeed.textContent = formatMs(avgCorrect);
  el.steadyNouns.textContent = `${steady}`;
  el.fastCorrectRate.textContent = `${fastRate}%`;
}

function renderPhaseMeta() {
  const meta = phaseMeta[getActivePhase()];
  el.phaseTitle.textContent = meta.title;
  el.phasePill.textContent = meta.pill;
  el.phaseProgress.textContent = phaseProgressText();
  el.modeBadge.textContent = meta.badge;
}

function renderTimerChip() {
  const item = currentItem();
  if (!item) return;
  const elapsed = currentElapsedMs();
  el.timerChip.textContent = state.currentSolved ? formatMs(elapsed) : `Timer ${formatMs(elapsed)}`;
}

function renderPrompt() {
  const item = currentItem();
  if (!item) return;

  el.sentenceText.innerHTML = renderSentence(item);
  el.promptWord.textContent = item.singular;
  el.promptGloss.textContent = item.gloss;
  el.promptDirection.textContent = state.currentSolved
    ? "Review why this ending won."
    : "Base form for reference.";
  el.hintButton.textContent = state.currentHintVisible ? "Hide rule" : "Reveal rule";
  el.hintText.textContent = state.currentHintVisible ? item.note : "";
  renderTimerChip();
}

function renderOptions() {
  const item = currentItem();
  if (!item) return;

  const answer = item.plural;
  const options = isValidOptionOrder(item) ? state.currentOptionOrder : buildOptionOrder(item);
  el.optionsGrid.innerHTML = options
    .map((option) => {
      const selected = state.currentChoice === option;
      let classes = "option-button";
      if (selected) classes += " is-selected";
      if (state.currentSolved && option === answer) classes += " is-correct";
      if (state.currentSolved && selected && option !== answer) classes += " is-wrong";

      return `
        <button class="${classes}" type="button" data-option="${option}" ${state.currentSolved ? "disabled" : ""}>
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
      <p class="feedback-title">Pick the form that truly fits the sentence.</p>
      <p class="feedback-body">You are training retrieval, not just spotting the only familiar-looking word.</p>
    `;
    return;
  }

  const responseMs = state.currentResponseMs || 0;
  const fastTarget = speedTargetForItem(item);
  const isCorrect = state.currentChoice === item.plural;
  const contrastLine = isCorrect
    ? `You beat the close distractors. ${item.note}`
    : `You picked ${state.currentChoice}. ${explainWrongChoice(item, state.currentChoice)} ${item.note}`;
  const speedLine = isCorrect
    ? responseMs <= fastTarget
      ? `Correct in ${formatMs(responseMs)}. That was within the fast target of ${formatMs(fastTarget)}.`
      : `Correct in ${formatMs(responseMs)}. Right answer, but slower than the fast target of ${formatMs(fastTarget)}.`
    : `You answered in ${formatMs(responseMs)}. The fast target for this noun is ${formatMs(fastTarget)}.`;

  el.feedbackCard.classList.remove("is-hidden");
  el.feedbackCard.classList.toggle("is-correct", isCorrect);
  el.feedbackCard.classList.toggle("is-wrong", !isCorrect);
  el.feedbackCard.innerHTML = `
    <p class="feedback-title">${isCorrect ? `Correct: ${item.plural}` : `Use ${item.plural}`}</p>
    <p class="feedback-sentence">${sentenceWithAnswer(item, item.plural, "sentence-fill")}</p>
    <p class="feedback-body">${speedLine} ${contrastLine}</p>
  `;
}

function renderButtons() {
  el.nextButton.disabled = !state.currentSolved;
  el.nextButton.parentElement.classList.toggle("is-hidden", !state.currentSolved);
}

function renderPatternGrid() {
  el.patternGrid.innerHTML = dashboardGroups
    .map((group) => {
      const groupItems = items.filter(group.match);
      const averageMastery =
        groupItems.reduce((total, item) => total + itemMastery(item), 0) / groupItems.length;

      const correctTimes = groupItems
        .map((item) => avgCorrectMsForStats(ensureItemStats(item.id)))
        .filter(Boolean);
      const avgSpeed = correctTimes.length
        ? formatMs(correctTimes.reduce((sum, ms) => sum + ms, 0) / correctTimes.length)
        : "0.0s";

      return `
        <article class="pattern-card">
          <strong>${group.label}</strong>
          <div class="pattern-meta">${group.note}</div>
          <div class="mastery-track"><span class="mastery-fill" style="width: ${Math.round(averageMastery * 100)}%"></span></div>
          <div class="pattern-meta">${Math.round(averageMastery * 100)}% mastery · avg ${avgSpeed}</div>
        </article>
      `;
    })
    .join("");
}

function renderWeakList() {
  const weakest = [...items]
    .sort((a, b) => itemMastery(a) - itemMastery(b))
    .slice(0, 4);

  el.weakList.innerHTML = weakest
    .map((item) => {
      const stats = ensureItemStats(item.id);
      const avg = avgCorrectMsForStats(stats);
      return `
        <article class="weak-item">
          <strong>${item.singular}</strong>
          <div class="weak-forms">${item.singular} → ${item.plural}</div>
          <div class="weak-note">${Math.round(itemMastery(item) * 100)}% mastery${avg ? ` · avg ${formatMs(avg)}` : ""}</div>
          <div class="weak-note">${item.note}</div>
        </article>
      `;
    })
    .join("");
}

function renderSettings() {
  el.phaseOverrideSelect.value = state.phaseOverride;
  el.settingsSummary.textContent = state.phaseOverride === "auto" ? "Automatic step" : phaseMeta[state.phaseOverride].summary;
  el.memoryNote.textContent =
    state.phaseOverride === "auto"
      ? "Progress, timing history, and the current card resume automatically on this device."
      : "Manual step is active. Switch back to Automatic whenever you want the trainer to pick the next training stage.";
}

function render() {
  renderHeaderMetrics();
  renderPhaseMeta();
  renderPrompt();
  renderOptions();
  renderFeedback();
  renderButtons();
  renderPatternGrid();
  renderWeakList();
  renderSettings();
}

function startTimerLoop() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    if (!state.currentSolved) renderTimerChip();
  }, 100);
}

function submitAnswer(choice) {
  const item = currentItem();
  if (!item || state.currentSolved) return;

  const stats = ensureItemStats(item.id);
  const responseMs = currentElapsedMs();
  const correct = choice === item.plural;

  state.totalAnswered += 1;
  state.currentChoice = choice;
  state.currentSolved = true;
  state.currentResponseMs = responseMs;
  stats.seen += 1;
  stats.lastTurn = state.turn;

  if (correct) {
    stats.correct += 1;
    stats.totalCorrectMs += responseMs;
    stats.bestMs = stats.bestMs === null ? responseMs : Math.min(stats.bestMs, responseMs);
    state.totalCorrect += 1;
    state.totalCorrectMs += responseMs;

    if (responseMs <= speedTargetForItem(item)) {
      stats.fastCorrect += 1;
      state.totalFastCorrect += 1;
    }

    stats.dueAt = state.turn + 4 + Math.min(4, stats.correct);
  } else {
    stats.wrong += 1;
    stats.dueAt = state.turn + 2;
  }

  state.turn += 1;
  saveState();
  updatePhaseIfNeeded();
  render();
  scrollNextIntoView();
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resetSession() {
  state = structuredClone(defaultState);
  saveState();
  startNextCard();
  scrollCardIntoView();
}

el.optionsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (!button) return;
  submitAnswer(button.dataset.option);
});

el.nextButton.addEventListener("click", () => {
  startNextCard();
  scrollCardIntoView();
});

el.hintButton.addEventListener("click", () => {
  state.currentHintVisible = !state.currentHintVisible;
  saveState();
  renderPrompt();
});

el.phaseOverrideSelect.addEventListener("change", (event) => {
  state.phaseOverride = event.target.value;
  saveState();
  startNextCard();
  scrollCardIntoView();
});

el.resetSessionButton.addEventListener("click", () => {
  if (!window.confirm("Reset all progress? This cannot be undone.")) return;
  resetSession();
});

updatePhaseIfNeeded();
if (!currentItem() || !itemMatchesActivePhase(currentItem()) || !isValidOptionOrder(currentItem())) {
  startNextCard();
} else {
  if (!state.currentSolved) {
    state.currentStartedAt = Date.now();
    state.currentResponseMs = null;
    saveState();
  }
  render();
}
startTimerLoop();
