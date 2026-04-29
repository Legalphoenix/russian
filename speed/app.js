const STORAGE_KEY = "russian-typing-speed-lab-state-v1";
const GO_TRANSCRIBE_URL = "../hvpt/api/transcribe-go";
const HISTORY_LIMIT = 100;
const TARGET_HISTORY_LIMIT = 40;
const GO_CLIP_MS = 1500;
const GO_RETRY_MS = 260;
const AUTO_RESTART_MS = 120;

const BUILT_IN_TARGETS = [
  { id: "word-byl", kind: "word", text: "был", note: "was, masculine" },
  { id: "word-byla", kind: "word", text: "была", note: "was, feminine" },
  { id: "word-bylo", kind: "word", text: "было", note: "was, neuter" },
  { id: "word-byli", kind: "word", text: "были", note: "were" },
  { id: "word-budu", kind: "word", text: "буду", note: "I will be" },
  { id: "word-budesh", kind: "word", text: "будешь", note: "you will be" },
  { id: "word-budet", kind: "word", text: "будет", note: "he / she / it will be" },
  { id: "word-budem", kind: "word", text: "будем", note: "we will be" },
  { id: "word-budete", kind: "word", text: "будете", note: "you plural / polite will be" },
  { id: "word-budut", kind: "word", text: "будут", note: "they will be" },
  { id: "word-moi", kind: "word", text: "мой", note: "my, masculine" },
  { id: "word-moya", kind: "word", text: "моя", note: "my, feminine" },
  { id: "word-moe", kind: "word", text: "моё", note: "my, neuter" },
  { id: "word-moi-plural", kind: "word", text: "мои", note: "my, plural" },
  { id: "word-tvoi", kind: "word", text: "твой", note: "your, masculine" },
  { id: "word-tvoya", kind: "word", text: "твоя", note: "your, feminine" },
  { id: "word-ego", kind: "word", text: "его", note: "his / its" },
  { id: "word-ee", kind: "word", text: "её", note: "her" },
  { id: "word-nash", kind: "word", text: "наш", note: "our, masculine" },
  { id: "word-vasha", kind: "word", text: "ваша", note: "your, feminine" },
  { id: "word-dom", kind: "word", text: "дом", note: "house" },
  { id: "word-gorod", kind: "word", text: "город", note: "city" },
  { id: "word-drug", kind: "word", text: "друг", note: "friend" },
  { id: "word-rabota", kind: "word", text: "работа", note: "work" },
  { id: "word-shkola", kind: "word", text: "школа", note: "school" },
  { id: "word-komnata", kind: "word", text: "комната", note: "room" },
  { id: "word-pismo", kind: "word", text: "письмо", note: "letter" },
  { id: "word-mashina", kind: "word", text: "машина", note: "car" },
  { id: "word-nedelya", kind: "word", text: "неделя", note: "week" },
  { id: "word-segodnya", kind: "word", text: "сегодня", note: "today" },
  { id: "word-zavtra", kind: "word", text: "завтра", note: "tomorrow" },
  { id: "word-vchera", kind: "word", text: "вчера", note: "yesterday" },
  { id: "word-pozhaluista", kind: "word", text: "пожалуйста", note: "please" },
  { id: "word-spasibo", kind: "word", text: "спасибо", note: "thanks" },
  { id: "word-konechno", kind: "word", text: "конечно", note: "of course" },
  { id: "word-horosho", kind: "word", text: "хорошо", note: "good / well" },
  { id: "word-ploho", kind: "word", text: "плохо", note: "bad / badly" },
  { id: "word-mozhno", kind: "word", text: "можно", note: "one may / possible" },
  { id: "word-nuzhno", kind: "word", text: "нужно", note: "need to" },
  { id: "word-potomu", kind: "word", text: "потому", note: "because part" },
  { id: "sentence-ya-budu-doma", kind: "sentence", text: "Я буду дома завтра.", note: "I will be home tomorrow." },
  { id: "sentence-ona-byla", kind: "sentence", text: "Вчера она была в школе.", note: "Yesterday she was at school." },
  { id: "sentence-my-byli", kind: "sentence", text: "Мы были в магазине.", note: "We were in the shop." },
  { id: "sentence-moya-mashina", kind: "sentence", text: "Это моя новая машина.", note: "This is my new car." },
  { id: "sentence-u-menya-drug", kind: "sentence", text: "У меня есть хороший друг.", note: "I have a good friend." },
  { id: "sentence-budem-rabotat", kind: "sentence", text: "Завтра мы будем работать.", note: "Tomorrow we will work." },
  { id: "sentence-budesh-chitat", kind: "sentence", text: "Ты будешь читать письмо?", note: "Will you read the letter?" },
  { id: "sentence-oni-byli", kind: "sentence", text: "Они были очень заняты.", note: "They were very busy." },
  { id: "sentence-brat-moskva", kind: "sentence", text: "Мой брат живёт в Москве.", note: "My brother lives in Moscow." },
  { id: "sentence-pogoda", kind: "sentence", text: "Сегодня хорошая погода.", note: "The weather is good today." },
  { id: "sentence-hochu-chai", kind: "sentence", text: "Я хочу чай без сахара.", note: "I want tea without sugar." },
  { id: "sentence-mozhno-vody", kind: "sentence", text: "Можно мне воды?", note: "May I have some water?" },
  { id: "sentence-vasha-kniga", kind: "sentence", text: "Это ваша книга?", note: "Is this your book?" },
  { id: "sentence-nash-dom", kind: "sentence", text: "Наш дом рядом с парком.", note: "Our house is near the park." },
  { id: "sentence-posle-raboty", kind: "sentence", text: "После работы я иду домой.", note: "After work I go home." },
  { id: "sentence-v-subbotu", kind: "sentence", text: "В субботу мы будем дома.", note: "On Saturday we will be home." },
  { id: "sentence-eto-ee", kind: "sentence", text: "Это её старая комната.", note: "This is her old room." },
  { id: "sentence-kogda", kind: "sentence", text: "Когда ты будешь готов?", note: "When will you be ready?" },
  { id: "sentence-ne-byl", kind: "sentence", text: "Я не был там вчера.", note: "I was not there yesterday." },
  { id: "sentence-ochen-horosho", kind: "sentence", text: "Это было очень хорошо.", note: "It was very good." },
];

const refs = {
  totalAttempts: document.getElementById("total-attempts"),
  overallAverage: document.getElementById("overall-average"),
  overallBest: document.getElementById("overall-best"),
  targetTitle: document.getElementById("target-title"),
  targetNote: document.getElementById("target-note"),
  randomButton: document.getElementById("random-button"),
  startButtons: Array.from(document.querySelectorAll("[data-start-mode]")),
  flowButtons: Array.from(document.querySelectorAll("[data-flow-mode]")),
  timerCard: document.querySelector(".timer-card"),
  timerStatus: document.getElementById("timer-status"),
  liveTimer: document.getElementById("live-timer"),
  startButton: document.getElementById("start-button"),
  voiceButton: document.getElementById("voice-button"),
  stopButton: document.getElementById("stop-button"),
  voiceStatus: document.getElementById("voice-status"),
  answerInput: document.getElementById("answer-input"),
  lastResult: document.getElementById("last-result"),
  targetAttempts: document.getElementById("target-attempts"),
  targetAverage: document.getElementById("target-average"),
  targetBest: document.getElementById("target-best"),
  targetCpm: document.getElementById("target-cpm"),
  targetHistory: document.getElementById("target-history"),
  resetTargetButton: document.getElementById("reset-target-button"),
  libraryButtons: Array.from(document.querySelectorAll("[data-library-kind]")),
  addForm: document.getElementById("add-form"),
  addKind: document.getElementById("add-kind"),
  addText: document.getElementById("add-text"),
  addNote: document.getElementById("add-note"),
  targetList: document.getElementById("target-list"),
  resetAllButton: document.getElementById("reset-all-button"),
  overallHistory: document.getElementById("overall-history"),
};

let state = loadState();
let attempt = createAttempt();
let voice = createVoiceState();
let autoTimer = 0;

render();
wireEvents();
syncStartMode();

function createAttempt() {
  return {
    running: false,
    targetId: "",
    startedAt: 0,
    interval: 0,
  };
}

function createVoiceState() {
  return {
    armed: false,
    recording: false,
    stream: null,
    recorder: null,
    stopTimer: 0,
    chunks: [],
    lastTranscript: "",
  };
}

function createDefaultState() {
  return {
    version: 1,
    selectedId: "word-byl",
    libraryKind: "word",
    startMode: "manual",
    flowMode: "same",
    customTargets: [],
    stats: {},
    totals: {
      attempts: 0,
      totalMs: 0,
      bestMs: 0,
      lastMs: 0,
    },
    history: [],
    savedAt: 0,
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return coerceState(parsed);
  } catch {
    return createDefaultState();
  }
}

function coerceState(raw) {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== "object") return fallback;
  const startMode = ["auto", "manual", "voice"].includes(raw.startMode) ? raw.startMode : "manual";
  const flowMode = ["same", "random"].includes(raw.flowMode) ? raw.flowMode : "same";
  const libraryKind = raw.libraryKind === "sentence" ? "sentence" : "word";
  const customTargets = Array.isArray(raw.customTargets)
    ? raw.customTargets
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: sanitizeId(item.id) || createCustomId(),
          kind: item.kind === "sentence" ? "sentence" : "word",
          text: String(item.text || "").trim().slice(0, 240),
          note: String(item.note || "").trim().slice(0, 160),
          createdAt: Math.max(0, Number(item.createdAt) || Date.now()),
        }))
        .filter((item) => item.text)
    : [];

  const next = {
    ...fallback,
    selectedId: sanitizeId(raw.selectedId) || fallback.selectedId,
    libraryKind,
    startMode,
    flowMode,
    customTargets,
    stats: raw.stats && typeof raw.stats === "object" ? raw.stats : {},
    totals: sanitizeTotals(raw.totals),
    history: sanitizeHistory(raw.history),
    savedAt: Math.max(0, Number(raw.savedAt) || 0),
  };

  if (!findTarget(next.selectedId, next)) {
    next.selectedId = firstTargetForKind(next.libraryKind, next)?.id || "word-byl";
  }
  return next;
}

function sanitizeTotals(raw) {
  return {
    attempts: Math.max(0, Number(raw?.attempts) || 0),
    totalMs: Math.max(0, Number(raw?.totalMs) || 0),
    bestMs: Math.max(0, Number(raw?.bestMs) || 0),
    lastMs: Math.max(0, Number(raw?.lastMs) || 0),
  };
}

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      targetId: sanitizeId(item.targetId),
      text: String(item.text || "").trim().slice(0, 240),
      kind: item.kind === "sentence" ? "sentence" : "word",
      ms: Math.max(0, Number(item.ms) || 0),
      cpm: Math.max(0, Number(item.cpm) || 0),
      startedBy: ["auto", "manual", "voice"].includes(item.startedBy) ? item.startedBy : "manual",
      at: Math.max(0, Number(item.at) || Date.now()),
    }))
    .filter((item) => item.targetId && item.ms)
    .slice(0, HISTORY_LIMIT);
}

function sanitizeId(value) {
  return String(value || "").replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 120);
}

function saveState() {
  state.savedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getAllTargets(sourceState = state) {
  return BUILT_IN_TARGETS.concat(sourceState.customTargets);
}

function findTarget(id, sourceState = state) {
  return getAllTargets(sourceState).find((target) => target.id === id) || null;
}

function getSelectedTarget() {
  return findTarget(state.selectedId) || BUILT_IN_TARGETS[0];
}

function firstTargetForKind(kind, sourceState = state) {
  return getAllTargets(sourceState).find((target) => target.kind === kind) || null;
}

function getStats(targetId) {
  const key = sanitizeId(targetId);
  const raw = state.stats[key];
  if (!raw || typeof raw !== "object") {
    state.stats[key] = createTargetStats();
    return state.stats[key];
  }
  raw.attempts = Math.max(0, Number(raw.attempts) || 0);
  raw.totalMs = Math.max(0, Number(raw.totalMs) || 0);
  raw.bestMs = Math.max(0, Number(raw.bestMs) || 0);
  raw.lastMs = Math.max(0, Number(raw.lastMs) || 0);
  raw.totalCpm = Math.max(0, Number(raw.totalCpm) || 0);
  raw.history = sanitizeHistory(raw.history).slice(0, TARGET_HISTORY_LIMIT);
  return raw;
}

function createTargetStats() {
  return {
    attempts: 0,
    totalMs: 0,
    bestMs: 0,
    lastMs: 0,
    totalCpm: 0,
    history: [],
  };
}

function wireEvents() {
  refs.startButtons.forEach((button) => {
    button.addEventListener("click", () => setStartMode(button.dataset.startMode));
  });

  refs.flowButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.flowMode = button.dataset.flowMode === "random" ? "random" : "same";
      saveState();
      render();
    });
  });

  refs.libraryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.libraryKind = button.dataset.libraryKind === "sentence" ? "sentence" : "word";
      saveState();
      render();
    });
  });

  refs.randomButton.addEventListener("click", () => {
    selectRandomTarget(state.libraryKind);
    if (state.startMode === "auto" && !attempt.running) scheduleAutoStart();
  });

  refs.startButton.addEventListener("click", () => {
    if (!attempt.running) startAttempt("manual");
  });

  refs.voiceButton.addEventListener("click", () => {
    if (voice.armed) {
      disarmVoice("GO listener stopped.");
      renderControls();
      return;
    }
    armVoice();
  });

  refs.stopButton.addEventListener("click", () => {
    setStartMode("manual");
    stopAttempt("Stopped.");
  });

  refs.answerInput.addEventListener("input", handleTypingInput);
  refs.answerInput.addEventListener("keydown", handleInputKeydown);

  refs.addForm.addEventListener("submit", handleAddTarget);

  refs.targetList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-target-id]");
    if (!row) return;
    selectTarget(row.dataset.targetId);
  });

  refs.resetTargetButton.addEventListener("click", () => {
    const target = getSelectedTarget();
    if (!window.confirm(`Reset history for "${target.text}"?`)) return;
    delete state.stats[target.id];
    saveState();
    render();
  });

  refs.resetAllButton.addEventListener("click", () => {
    if (!window.confirm("Reset all typing speed history?")) return;
    state.stats = {};
    state.totals = createDefaultState().totals;
    state.history = [];
    saveState();
    render();
  });
}

function setStartMode(mode) {
  const nextMode = ["auto", "manual", "voice"].includes(mode) ? mode : "manual";
  clearTimeout(autoTimer);
  if (nextMode !== "voice") disarmVoice("");
  state.startMode = nextMode;
  saveState();
  renderControls();
  syncStartMode();
}

function syncStartMode() {
  if (state.startMode === "auto" && !attempt.running) {
    scheduleAutoStart();
  }
}

function scheduleAutoStart() {
  clearTimeout(autoTimer);
  autoTimer = window.setTimeout(() => {
    if (state.startMode === "auto" && !attempt.running) startAttempt("auto");
  }, AUTO_RESTART_MS);
}

function startAttempt(startedBy) {
  if (attempt.running) return;
  const target = getSelectedTarget();
  clearTimeout(autoTimer);
  attempt = createAttempt();
  attempt.running = true;
  attempt.targetId = target.id;
  attempt.startedAt = performance.now();
  attempt.interval = window.setInterval(updateLiveTimer, 40);
  refs.answerInput.value = "";
  refs.answerInput.placeholder = target.kind === "word" ? "Type the word." : "Type the sentence.";
  refs.timerStatus.textContent = startedBy === "voice" ? "GO heard" : "Running";
  refs.timerCard.dataset.state = "running";
  refs.answerInput.focus({ preventScroll: true });
  refs.answerInput.dataset.startedBy = startedBy;
  updateLiveTimer();
  renderControls();
}

function stopAttempt(message) {
  clearTimeout(autoTimer);
  if (attempt.interval) window.clearInterval(attempt.interval);
  attempt = createAttempt();
  refs.liveTimer.textContent = "0.00s";
  refs.timerStatus.textContent = message || "Ready";
  refs.timerCard.dataset.state = "idle";
  refs.answerInput.value = "";
  refs.answerInput.placeholder = "Waiting to start.";
  renderControls();
}

function handleTypingInput() {
  if (!attempt.running) return;
  const target = findTarget(attempt.targetId);
  if (!target) return;
  if (normalizeForMatch(refs.answerInput.value) === normalizeForMatch(target.text)) {
    finishAttempt();
  }
}

function handleInputKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) return;
  if (!attempt.running && state.startMode === "manual") {
    event.preventDefault();
    startAttempt("manual");
    return;
  }
  if (attempt.running) event.preventDefault();
}

function finishAttempt() {
  if (!attempt.running) return;
  const target = findTarget(attempt.targetId);
  if (!target) {
    stopAttempt("Ready");
    return;
  }
  const elapsedMs = Math.max(1, performance.now() - attempt.startedAt);
  const startedBy = refs.answerInput.dataset.startedBy || state.startMode;
  if (attempt.interval) window.clearInterval(attempt.interval);
  attempt = createAttempt();
  refs.answerInput.value = "";
  refs.liveTimer.textContent = formatMs(elapsedMs);
  recordAttempt(target, elapsedMs, startedBy);

  if (state.flowMode === "random") {
    selectRandomTarget(target.kind, { save: false });
  }

  saveState();
  render();
  refs.timerStatus.textContent = "Ready";

  if (state.startMode === "auto") {
    scheduleAutoStart();
  } else if (state.startMode === "voice" && voice.armed) {
    window.setTimeout(listenForGo, GO_RETRY_MS);
  } else {
    refs.timerStatus.textContent = "Ready";
    refs.timerCard.dataset.state = "idle";
  }
}

function updateLiveTimer() {
  if (!attempt.running) return;
  refs.liveTimer.textContent = formatMs(performance.now() - attempt.startedAt);
}

function recordAttempt(target, ms, startedBy) {
  const cpm = calculateCpm(target.text, ms);
  const entry = {
    targetId: target.id,
    text: target.text,
    kind: target.kind,
    ms: Math.round(ms),
    cpm,
    startedBy,
    at: Date.now(),
  };

  const stats = getStats(target.id);
  stats.attempts += 1;
  stats.totalMs += ms;
  stats.totalCpm += cpm;
  stats.bestMs = stats.bestMs ? Math.min(stats.bestMs, ms) : ms;
  stats.lastMs = ms;
  stats.history = [entry].concat(stats.history || []).slice(0, TARGET_HISTORY_LIMIT);

  state.totals.attempts += 1;
  state.totals.totalMs += ms;
  state.totals.bestMs = state.totals.bestMs ? Math.min(state.totals.bestMs, ms) : ms;
  state.totals.lastMs = ms;
  state.history = [entry].concat(state.history || []).slice(0, HISTORY_LIMIT);
}

function calculateCpm(text, ms) {
  const charCount = normalizeForMatch(text).replace(/\s/g, "").length;
  return Math.round((charCount / Math.max(ms, 1)) * 60000);
}

function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFC")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function selectTarget(targetId) {
  const target = findTarget(targetId);
  if (!target) return;
  clearTimeout(autoTimer);
  stopAttempt("Ready");
  state.selectedId = target.id;
  state.libraryKind = target.kind;
  saveState();
  render();
  if (state.startMode === "auto") scheduleAutoStart();
  if (state.startMode === "voice" && voice.armed) listenForGo();
}

function selectRandomTarget(kind, options = {}) {
  const targets = getAllTargets().filter((target) => target.kind === kind);
  if (!targets.length) return;
  const selected = getSelectedTarget();
  const pool = targets.length > 1 ? targets.filter((target) => target.id !== selected.id) : targets;
  const next = pool[Math.floor(Math.random() * pool.length)];
  state.selectedId = next.id;
  state.libraryKind = next.kind;
  if (options.save !== false) saveState();
  render();
}

async function armVoice() {
  if (state.startMode !== "voice") setStartMode("voice");
  voice.armed = true;
  renderControls();
  await listenForGo();
}

async function listenForGo() {
  if (!voice.armed || attempt.running || state.startMode !== "voice" || voice.recording) return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    refs.voiceStatus.textContent = "Mic recording is not available in this browser.";
    voice.armed = false;
    renderControls();
    return;
  }

  try {
    if (!voice.stream) {
      voice.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const options = getRecorderOptions();
    const recorder = new MediaRecorder(voice.stream, options);
    voice.recorder = recorder;
    voice.chunks = [];
    voice.recording = true;
    refs.timerStatus.textContent = "Listening for GO";
    refs.timerCard.dataset.state = "voice";
    refs.voiceStatus.textContent = "Listening...";
    renderControls();

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) voice.chunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      const chunks = voice.chunks.slice();
      const mimeType = recorder.mimeType || options.mimeType || "audio/webm";
      voice.recording = false;
      voice.recorder = null;
      clearTimeout(voice.stopTimer);
      transcribeGoClip(chunks, mimeType);
    }, { once: true });

    recorder.start();
    voice.stopTimer = window.setTimeout(() => {
      if (voice.recorder && voice.recorder.state !== "inactive") voice.recorder.stop();
    }, GO_CLIP_MS);
  } catch (error) {
    voice.armed = false;
    refs.voiceStatus.textContent = micErrorMessage(error);
    releaseVoiceStream();
    renderControls();
  }
}

async function transcribeGoClip(chunks, mimeType) {
  if (!voice.armed || state.startMode !== "voice" || attempt.running) return;
  if (!chunks.length) {
    refs.voiceStatus.textContent = "No audio captured.";
    window.setTimeout(listenForGo, GO_RETRY_MS);
    return;
  }

  refs.voiceStatus.textContent = "Transcribing...";
  try {
    const blob = new Blob(chunks, { type: mimeType });
    const response = await fetch(GO_TRANSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
      body: blob,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "OpenAI transcription failed.");
    }
    if (!voice.armed || state.startMode !== "voice" || attempt.running) return;
    voice.lastTranscript = String(payload.transcript || "");
    if (payload.hasGo) {
      refs.voiceStatus.textContent = voice.lastTranscript ? `Heard: ${voice.lastTranscript}` : "GO heard.";
      startAttempt("voice");
      return;
    }
    refs.voiceStatus.textContent = voice.lastTranscript ? `Heard: ${voice.lastTranscript}` : "Listening...";
    window.setTimeout(listenForGo, GO_RETRY_MS);
  } catch (error) {
    refs.voiceStatus.textContent = transcriptionErrorMessage(error);
    window.setTimeout(() => {
      if (voice.armed && state.startMode === "voice" && !attempt.running) listenForGo();
    }, 1200);
  }
}

function disarmVoice(message) {
  voice.armed = false;
  clearTimeout(voice.stopTimer);
  if (voice.recorder && voice.recorder.state !== "inactive") {
    try {
      voice.recorder.stop();
    } catch {
      // Recorder may already be stopping.
    }
  }
  voice.recording = false;
  voice.recorder = null;
  releaseVoiceStream();
  if (message) refs.voiceStatus.textContent = message;
}

function releaseVoiceStream() {
  if (!voice.stream) return;
  voice.stream.getTracks().forEach((track) => track.stop());
  voice.stream = null;
}

function getRecorderOptions() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported?.(candidate));
  return mimeType ? { mimeType } : {};
}

function micErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Mic permission was blocked.";
  }
  return "Could not start the microphone.";
}

function transcriptionErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("OPENAI_API_KEY") || message.includes("configured")) {
    return "OpenAI transcription is not configured on the server.";
  }
  return message || "OpenAI transcription failed.";
}

function handleAddTarget(event) {
  event.preventDefault();
  const text = refs.addText.value.trim();
  if (!text) return;
  const kind = refs.addKind.value === "sentence" ? "sentence" : "word";
  const target = {
    id: createCustomId(),
    kind,
    text: text.slice(0, 240),
    note: refs.addNote.value.trim().slice(0, 160),
    createdAt: Date.now(),
  };
  state.customTargets.push(target);
  state.selectedId = target.id;
  state.libraryKind = target.kind;
  refs.addText.value = "";
  refs.addNote.value = "";
  refs.addKind.value = kind;
  saveState();
  render();
  if (state.startMode === "auto") scheduleAutoStart();
  if (state.startMode === "voice" && voice.armed) listenForGo();
}

function createCustomId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function render() {
  const target = getSelectedTarget();
  const stats = getStats(target.id);

  refs.targetTitle.textContent = target.text;
  refs.targetNote.textContent = target.note || (target.kind === "word" ? "Custom word" : "Custom sentence");
  refs.answerInput.classList.toggle("is-word", target.kind === "word");
  refs.answerInput.rows = target.kind === "word" ? 1 : 2;

  renderControls();
  renderOverallStats();
  renderTargetStats(target, stats);
  renderTargetList();
  renderHistory();
}

function renderControls() {
  refs.startButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.startMode === state.startMode));
  });
  refs.flowButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.flowMode === state.flowMode));
  });
  refs.libraryButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.libraryKind === state.libraryKind));
  });

  refs.startButton.classList.toggle("hidden", state.startMode !== "manual");
  refs.voiceButton.classList.toggle("hidden", state.startMode !== "voice");
  refs.voiceButton.textContent = voice.armed ? "Stop GO listener" : "Listen for GO";
  refs.voiceButton.disabled = attempt.running;

  if (attempt.running) {
    refs.timerCard.dataset.state = "running";
  } else if (voice.armed && state.startMode === "voice") {
    refs.timerCard.dataset.state = "voice";
  } else if (refs.timerCard.dataset.state !== "idle") {
    refs.timerCard.dataset.state = "idle";
  }

  if (state.startMode !== "voice") {
    refs.voiceStatus.textContent = "";
  } else if (!voice.armed && !refs.voiceStatus.textContent) {
    refs.voiceStatus.textContent = "GO mode uses server-side OpenAI transcription.";
  }
}

function renderOverallStats() {
  const totals = state.totals;
  refs.totalAttempts.textContent = String(totals.attempts);
  refs.overallAverage.textContent = totals.attempts ? formatMs(totals.totalMs / totals.attempts) : "--";
  refs.overallBest.textContent = totals.bestMs ? formatMs(totals.bestMs) : "--";

  const last = state.history[0];
  if (last) {
    refs.lastResult.innerHTML = `<span>Last · ${escapeHtml(last.text)}</span><strong>${formatMs(last.ms)} · ${last.cpm} cpm</strong>`;
  } else {
    refs.lastResult.innerHTML = "<span>Last</span><strong>--</strong>";
  }
}

function renderTargetStats(target, stats) {
  refs.targetAttempts.textContent = String(stats.attempts);
  refs.targetAverage.textContent = stats.attempts ? formatMs(stats.totalMs / stats.attempts) : "--";
  refs.targetBest.textContent = stats.bestMs ? formatMs(stats.bestMs) : "--";
  refs.targetCpm.textContent = stats.attempts ? String(Math.round(stats.totalCpm / stats.attempts)) : "--";
  refs.targetHistory.innerHTML = stats.history.length
    ? stats.history
        .slice(0, 8)
        .map((entry) => `<li><span>${formatShortDate(entry.at)} · ${entry.startedBy}</span><strong>${formatMs(entry.ms)} · ${entry.cpm} cpm</strong></li>`)
        .join("")
    : `<li class="empty-state">No timings for ${escapeHtml(target.text)} yet.</li>`;
}

function renderTargetList() {
  const targets = getAllTargets().filter((target) => target.kind === state.libraryKind);
  refs.targetList.innerHTML = targets
    .map((target) => {
      const stats = getStats(target.id);
      const average = stats.attempts ? `${formatMs(stats.totalMs / stats.attempts)} avg` : "No reps";
      const selectedClass = target.id === state.selectedId ? " is-selected" : "";
      return `
        <button class="target-row${selectedClass}" type="button" data-target-id="${escapeHtml(target.id)}">
          <span class="target-main">
            <span class="target-text">${escapeHtml(target.text)}</span>
            <span class="target-meta">${escapeHtml(target.note || (target.kind === "word" ? "Word" : "Sentence"))}</span>
          </span>
          <span class="target-speed">${average}</span>
        </button>
      `;
    })
    .join("");
}

function renderHistory() {
  refs.overallHistory.innerHTML = state.history.length
    ? state.history
        .slice(0, 14)
        .map((entry) => {
          return `
            <div class="overall-item">
              <div>
                <strong>${escapeHtml(entry.text)}</strong>
                <span>${formatShortDate(entry.at)} · ${entry.kind} · ${entry.startedBy}</span>
              </div>
              <strong>${formatMs(entry.ms)} · ${entry.cpm} cpm</strong>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">No timings yet.</div>`;
}

function formatMs(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(2)}s`;
}

function formatShortDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
