const API_BASE = "./api";

const INSTRUCTION_PRESETS = [
  {
    label: "Slow & precise",
    speed: 0.8,
    instructions:
      "Tone: Calm and clear.\nPacing: Slow and deliberate.\nPronunciation: Crisp consonants and clear stress.\nPauses: Small pauses between thought groups.",
  },
  {
    label: "Neutral tutor",
    speed: 1,
    instructions:
      "Tone: Neutral and grounded.\nPacing: Steady.\nPronunciation: Natural sentence rhythm with clear stress.",
  },
  {
    label: "Brisk conversation",
    speed: 1.18,
    instructions:
      "Tone: Conversational.\nPacing: Brisk but natural.\nDelivery: Connect words smoothly without sounding rushed.",
  },
  {
    label: "Stress contrast",
    speed: 0.95,
    instructions:
      "Tone: Focused.\nPacing: Moderate.\nEmphasis: Make the main sentence stress easy to hear.\nPronunciation: Clear vowel reduction and rhythm.",
  },
];

const state = {
  availableVoices: [],
  defaultVoices: [],
  phrases: [],
  variants: [],
  loadedPhraseId: "",
  loadedPhraseSnapshot: null,
  formDirty: false,
  playingVariantId: "",
  cycleToken: 0,
  isGenerating: false,
  isSaving: false,
  ttsReady: false,
  userRecording: null,
  isRecording: false,
  mediaRecorder: null,
  mediaStream: null,
};

const refs = {
  notice: document.getElementById("notice"),
  phraseInput: document.getElementById("phrase-input"),
  noteInput: document.getElementById("note-input"),
  instructionsInput: document.getElementById("instructions-input"),
  presetRow: document.getElementById("preset-row"),
  speedInput: document.getElementById("speed-input"),
  speedValue: document.getElementById("speed-value"),
  voiceGrid: document.getElementById("voice-grid"),
  voiceCount: document.getElementById("voice-count"),
  activePhrasePill: document.getElementById("active-phrase-pill"),
  generateButton: document.getElementById("generate-button"),
  saveButton: document.getElementById("save-button"),
  updateButton: document.getElementById("update-button"),
  newButton: document.getElementById("new-button"),
  recommendedVoicesButton: document.getElementById("recommended-voices-button"),
  allVoicesButton: document.getElementById("all-voices-button"),
  clearVoicesButton: document.getElementById("clear-voices-button"),
  packSummary: document.getElementById("pack-summary"),
  cycleButton: document.getElementById("cycle-button"),
  shuffleButton: document.getElementById("shuffle-button"),
  stopButton: document.getElementById("stop-button"),
  variantList: document.getElementById("variant-list"),
  libraryCount: document.getElementById("library-count"),
  libraryList: document.getElementById("library-list"),
  recordButton: document.getElementById("record-button"),
};

function setNotice(kind, message) {
  refs.notice.className = `notice is-visible notice-${kind}`;
  refs.notice.textContent = message;
}

function formatSpeed(value) {
  const numeric = Number(value);
  return `${numeric.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}x`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function normalizeDraft(candidate) {
  return {
    text: String(candidate?.text || "").trim(),
    note: String(candidate?.note || "").trim(),
    instructions: String(candidate?.instructions || "").trim(),
    speed: Number(candidate?.speed ?? 1),
    voices: Array.isArray(candidate?.voices) ? [...candidate.voices] : [],
  };
}

function getCurrentDraft() {
  return normalizeDraft({
    text: refs.phraseInput.value,
    note: refs.noteInput.value,
    instructions: refs.instructionsInput.value,
    speed: refs.speedInput.value,
    voices: currentVoiceSelection(),
  });
}

function draftsMatch(left, right) {
  return (
    left.text === right.text &&
    left.note === right.note &&
    left.instructions === right.instructions &&
    left.speed === right.speed &&
    left.voices.length === right.voices.length &&
    left.voices.every((voice, index) => voice === right.voices[index])
  );
}

function currentVoiceSelection() {
  return Array.from(refs.voiceGrid.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value);
}

function setVoiceSelection(voices) {
  const selected = new Set(voices);
  refs.voiceGrid.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selected.has(input.value);
  });
  syncComposerMeta();
}

function renderPresets() {
  refs.presetRow.innerHTML = INSTRUCTION_PRESETS.map(
    (preset) =>
      `<button class="preset-chip" type="button" data-preset="${preset.label}">${preset.label}</button>`
  ).join("");
}

function renderVoiceGrid() {
  refs.voiceGrid.innerHTML = state.availableVoices
    .map(
      (voice) => `
        <label class="voice-option">
          <input type="checkbox" value="${voice}" />
          <span>${voice}</span>
        </label>
      `
    )
    .join("");
  setVoiceSelection(state.defaultVoices);
}

function syncComposerMeta() {
  const selectedVoices = currentVoiceSelection();
  const hasLoadedPhrase = Boolean(state.loadedPhraseId);
  refs.voiceCount.textContent = `${selectedVoices.length} voice${selectedVoices.length === 1 ? "" : "s"} selected`;
  refs.speedValue.textContent = formatSpeed(refs.speedInput.value);
  refs.activePhrasePill.textContent = state.formDirty
    ? "Modified draft"
    : hasLoadedPhrase
      ? "Saved phrase"
      : "Unsaved draft";
  refs.saveButton.textContent = hasLoadedPhrase ? "Save as new phrase" : "Save phrase";
  refs.updateButton.hidden = !hasLoadedPhrase;

  const variantReady = state.variants.length > 0 || Boolean(state.userRecording);
  refs.generateButton.disabled = !state.ttsReady || state.isGenerating;
  refs.saveButton.disabled = state.isSaving;
  refs.updateButton.disabled = !hasLoadedPhrase || !state.formDirty || state.isSaving;
  refs.cycleButton.disabled = !variantReady || state.isGenerating;
  refs.shuffleButton.disabled = !variantReady || state.isGenerating;
  refs.stopButton.disabled = !variantReady;
}

function collectPhrasePayload() {
  const payload = getCurrentDraft();
  if (!payload.text) {
    throw new Error("Enter a Russian phrase first.");
  }
  if (!payload.voices.length) {
    throw new Error("Select at least one voice.");
  }
  if (state.userRecording?.serverUrl) {
    payload.recordingUrl = state.userRecording.serverUrl;
  }
  return payload;
}

function syncDraftState({ announce = false } = {}) {
  const previousDirty = state.formDirty;
  state.formDirty = Boolean(
    state.loadedPhraseId &&
      state.loadedPhraseSnapshot &&
      !draftsMatch(getCurrentDraft(), state.loadedPhraseSnapshot)
  );

  if (announce && state.loadedPhraseId && !previousDirty && state.formDirty) {
    setNotice("info", "Loaded phrase changed. Save as new phrase to keep both, or update loaded phrase to overwrite.");
  }

  syncComposerMeta();
}

function setLoadedPhrase(phrase) {
  if (!phrase) {
    state.loadedPhraseId = "";
    state.loadedPhraseSnapshot = null;
    state.formDirty = false;
    return;
  }

  state.loadedPhraseId = phrase.id || "";
  state.loadedPhraseSnapshot = normalizeDraft(phrase);
  state.formDirty = false;
}

async function fetchJson(url, options = {}) {
  const response = await window.fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

function upsertPhrase(phrase) {
  const existingIndex = state.phrases.findIndex((item) => item.id === phrase.id);
  if (existingIndex >= 0) {
    state.phrases.splice(existingIndex, 1, phrase);
  } else {
    state.phrases.push(phrase);
  }
  state.phrases.sort((left, right) => right.updatedAt - left.updatedAt);
}

function renderVariants() {
  const hasContent = state.variants.length > 0 || state.userRecording;

  if (!hasContent) {
    refs.packSummary.textContent = "Generate a pack to start listening.";
    refs.variantList.innerHTML = `<div class="empty-state">Your voice variants will land here with built-in audio players and quick cycle controls.</div>`;
    syncComposerMeta();
    return;
  }

  const counts = [];
  if (state.variants.length) counts.push(`${state.variants.length} generated`);
  if (state.userRecording) counts.push("your recording");
  refs.packSummary.textContent = counts.join(" + ") + " ready";

  let html = "";

  if (state.userRecording) {
    const isPlaying = state.playingVariantId === "user-recording";
    html += `
      <article class="variant-card variant-card-user ${isPlaying ? "is-playing" : ""}" data-variant-id="user-recording">
        <div class="variant-top">
          <span class="voice-badge voice-badge-user">You</span>
          <span class="variant-meta">Your recording</span>
        </div>
        <div class="variant-actions">
          <button class="mini-button play-variant-button" type="button" data-variant-id="user-recording">Play</button>
          <button class="mini-button re-record-button" type="button">Re-record</button>
          <audio class="audio-player" controls preload="auto" data-variant-id="user-recording" src="${state.userRecording.url}"></audio>
        </div>
      </article>
    `;
  }

  html += state.variants
    .map((variant) => {
      const isPlaying = variant.id === state.playingVariantId;
      return `
        <article class="variant-card ${isPlaying ? "is-playing" : ""}" data-variant-id="${variant.id}">
          <div class="variant-top">
            <span class="voice-badge">${variant.voice}</span>
            <span class="variant-meta">${formatSpeed(variant.speed)} ${variant.cached ? "· cached" : "· fresh"}</span>
          </div>
          <p class="variant-note">Same phrase, new speaker shape. Use cycle mode for quick contrast reps.</p>
          <div class="variant-actions">
            <button class="mini-button play-variant-button" type="button" data-variant-id="${variant.id}">Play</button>
            <audio class="audio-player" controls preload="none" data-variant-id="${variant.id}" src="${variant.url}"></audio>
          </div>
        </article>
      `;
    })
    .join("");

  refs.variantList.innerHTML = html;
  applyPlayingState();
  syncComposerMeta();
}

function renderLibrary() {
  refs.libraryCount.textContent = `${state.phrases.length} saved phrase${state.phrases.length === 1 ? "" : "s"}`;

  if (!state.phrases.length) {
    refs.libraryList.innerHTML = `<div class="empty-state">Save the phrases that still need ear work. They will stay on the server-backed phrase bank for later practice.</div>`;
    return;
  }

  refs.libraryList.innerHTML = state.phrases
    .map((phrase) => {
      const isActive = phrase.id === state.loadedPhraseId;
      const note = phrase.note ? `<p class="library-note">${phrase.note}</p>` : "";
      const instructionNote = phrase.instructions ? "voice direction saved" : "plain delivery";
      return `
        <article class="library-card ${isActive ? "is-active" : ""}" data-phrase-id="${phrase.id}">
          <div class="library-top">
            <span class="library-tag">${phrase.voices.length} voices</span>
            <span class="library-date">${formatDate(phrase.updatedAt)}</span>
          </div>
          <p class="library-text">${phrase.text}</p>
          ${note}
          <p class="library-meta">${formatSpeed(phrase.speed)} · ${instructionNote}</p>
          <div class="library-actions">
            <button class="mini-button" type="button" data-action="load" data-phrase-id="${phrase.id}">Load</button>
            <button class="mini-button" type="button" data-action="practice" data-phrase-id="${phrase.id}">Practice</button>
            <button class="mini-button" type="button" data-action="delete" data-phrase-id="${phrase.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function populateComposer(phrase) {
  refs.phraseInput.value = phrase.text || "";
  refs.noteInput.value = phrase.note || "";
  refs.instructionsInput.value = phrase.instructions || "";
  refs.speedInput.value = phrase.speed || 1;
  setLoadedPhrase(phrase);
  setVoiceSelection(phrase.voices || state.defaultVoices);
  clearUserRecording();
  if (phrase.recordingUrl) {
    state.userRecording = {
      id: "user-recording",
      url: phrase.recordingUrl,
      serverUrl: phrase.recordingUrl,
      phraseText: (phrase.text || "").trim(),
    };
  }
  state.variants = [];
  state.playingVariantId = "";
  renderVariants();
  renderLibrary();
  syncComposerMeta();
}

function clearComposer() {
  stopCycle();
  refs.phraseInput.value = "";
  refs.noteInput.value = "";
  refs.instructionsInput.value = "";
  refs.speedInput.value = "1";
  setLoadedPhrase(null);
  clearUserRecording();
  state.variants = [];
  state.playingVariantId = "";
  setVoiceSelection(state.defaultVoices);
  renderVariants();
  renderLibrary();
  syncComposerMeta();
}

function applyPlayingState() {
  refs.variantList.querySelectorAll(".variant-card").forEach((card) => {
    card.classList.toggle("is-playing", card.dataset.variantId === state.playingVariantId);
  });
}

function stopCycle() {
  state.cycleToken += 1;
  state.playingVariantId = "";
  document.querySelectorAll("audio[data-variant-id]").forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  applyPlayingState();
}

function playSingleVariant(variantId) {
  stopCycle();
  const audio = document.querySelector(`audio[data-variant-id="${variantId}"]`);
  if (!audio) {
    return;
  }
  state.playingVariantId = variantId;
  applyPlayingState();
  audio.currentTime = 0;
  const resetPlaying = () => {
    state.playingVariantId = "";
    applyPlayingState();
    audio.removeEventListener("ended", resetPlaying);
    audio.removeEventListener("pause", resetPlaying);
  };
  audio.addEventListener("ended", resetPlaying);
  audio.addEventListener("pause", resetPlaying);
  audio.play().catch((error) => {
    state.playingVariantId = "";
    applyPlayingState();
    setNotice("error", error.message || "Audio playback failed.");
  });
}

async function playVariantAndWait(variantId, token) {
  const audio = document.querySelector(`audio[data-variant-id="${variantId}"]`);
  if (!audio) {
    return;
  }
  document.querySelectorAll("audio[data-variant-id]").forEach((candidate) => {
    if (candidate !== audio) {
      candidate.pause();
      candidate.currentTime = 0;
    }
  });
  audio.currentTime = 0;
  state.playingVariantId = variantId;
  applyPlayingState();

  await new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
    const handleEnded = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Audio playback failed."));
    };
    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });

  if (token === state.cycleToken) {
    state.playingVariantId = "";
    applyPlayingState();
  }
}

async function cycleVariants({ random = false } = {}) {
  if (!state.variants.length && !state.userRecording) {
    return;
  }

  stopCycle();
  const token = state.cycleToken;
  let items = [...state.variants];
  if (state.userRecording) {
    items.unshift({ id: "user-recording" });
  }
  const queue = random ? shuffle(items) : items;
  setNotice("info", random ? "Shuffle cycle running." : "Cycle running.");

  try {
    for (const variant of queue) {
      if (token !== state.cycleToken) {
        return;
      }
      await playVariantAndWait(variant.id, token);
    }
    if (token === state.cycleToken) {
      setNotice("success", "Cycle complete.");
    }
  } catch (error) {
    setNotice("error", error.message || "Audio playback failed.");
  } finally {
    if (token === state.cycleToken) {
      state.playingVariantId = "";
      applyPlayingState();
    }
  }
}

async function generateCurrentPhrase({ silent = false } = {}) {
  let payload;
  try {
    payload = collectPhrasePayload();
  } catch (error) {
    setNotice("warning", error.message);
    return;
  }

  if (state.userRecording && state.userRecording.phraseText !== payload.text) {
    clearUserRecording();
  }

  state.isGenerating = true;
  syncComposerMeta();
  if (!silent) {
    setNotice("info", "Generating voice pack...");
  }

  try {
    const response = await fetchJson(`${API_BASE}/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.variants = response.variants || [];
    renderVariants();
    if (!silent) {
      setNotice("success", `${state.variants.length} voice variants ready.`);
    }
  } catch (error) {
    setNotice("error", error.message);
  } finally {
    state.isGenerating = false;
    syncComposerMeta();
  }
}

async function saveCurrentPhrase({ mode = "new" } = {}) {
  let payload;
  try {
    payload = collectPhrasePayload();
  } catch (error) {
    setNotice("warning", error.message);
    return;
  }

  state.isSaving = true;
  syncComposerMeta();
  let method = "POST";
  let url = `${API_BASE}/phrases`;
  let progressMessage = "Saving phrase...";
  let successMessage = "Phrase saved.";

  if (mode === "update") {
    if (!state.loadedPhraseId) {
      state.isSaving = false;
      syncComposerMeta();
      setNotice("warning", "Load a saved phrase first.");
      return;
    }
    method = "PUT";
    url = `${API_BASE}/phrases/${state.loadedPhraseId}`;
    progressMessage = "Updating loaded phrase...";
    successMessage = "Loaded phrase updated.";
  } else if (state.loadedPhraseId) {
    progressMessage = "Saving new phrase...";
    successMessage = "Saved as new phrase.";
  }

  setNotice("info", progressMessage);

  try {
    const response = await fetchJson(url, {
      method,
      body: JSON.stringify(payload),
    });
    const savedPhrase = response.phrase;
    setLoadedPhrase(savedPhrase);
    upsertPhrase(savedPhrase);
    renderLibrary();
    syncComposerMeta();
    setNotice("success", successMessage);
  } catch (error) {
    setNotice("error", error.message);
  } finally {
    state.isSaving = false;
    syncComposerMeta();
  }
}

async function deletePhrase(phraseId) {
  const phrase = state.phrases.find((item) => item.id === phraseId);
  if (!phrase) {
    return;
  }
  if (!window.confirm(`Delete "${phrase.text}" from the saved bank?`)) {
    return;
  }

  try {
    await fetchJson(`${API_BASE}/phrases/${phraseId}`, { method: "DELETE" });
    state.phrases = state.phrases.filter((item) => item.id !== phraseId);
    if (state.loadedPhraseId === phraseId) {
      clearComposer();
    } else {
      renderLibrary();
      setNotice("success", "Phrase deleted.");
    }
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function loadPhrase(phraseId, { practice = false } = {}) {
  const phrase = state.phrases.find((item) => item.id === phraseId);
  if (!phrase) {
    return;
  }
  populateComposer(phrase);
  setNotice("info", "Phrase loaded.");
  if (practice) {
    await generateCurrentPhrase({ silent: true });
    if (state.variants.length) {
      setNotice("success", "Saved phrase loaded and generated.");
    }
  }
}

function clearUserRecording() {
  if (state.userRecording) {
    if (state.userRecording.blob) {
      URL.revokeObjectURL(state.userRecording.url);
    }
    state.userRecording = null;
  }
}

function updateRecordButton() {
  if (!refs.recordButton) return;
  if (state.isRecording) {
    refs.recordButton.innerHTML = '<span class="record-dot is-recording"></span> Stop recording';
    refs.recordButton.classList.add("is-recording");
  } else {
    refs.recordButton.innerHTML = '<span class="record-dot"></span> Record yourself';
    refs.recordButton.classList.remove("is-recording");
  }
}

async function startRecording() {
  if (state.isRecording) {
    stopRecording();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaStream = stream;
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      state.mediaStream = null;
      state.mediaRecorder = null;
      state.isRecording = false;
      updateRecordButton();

      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      clearUserRecording();
      setNotice("info", "Uploading recording...");

      try {
        const response = await window.fetch(`${API_BASE}/recording`, {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: blob,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");

        state.userRecording = {
          id: "user-recording",
          url: result.url,
          serverUrl: result.url,
          phraseText: refs.phraseInput.value.trim(),
        };
        renderVariants();
        setNotice("success", "Recording saved to server.");
      } catch (uploadError) {
        state.userRecording = {
          id: "user-recording",
          blob,
          url: URL.createObjectURL(blob),
          phraseText: refs.phraseInput.value.trim(),
        };
        renderVariants();
        setNotice("warning", "Recording saved locally (server upload failed).");
      }
    };

    state.mediaRecorder = recorder;
    state.isRecording = true;
    updateRecordButton();
    recorder.start();
    setNotice("info", 'Recording... Click "Stop recording" when done.');
  } catch (error) {
    state.isRecording = false;
    updateRecordButton();
    setNotice("error", "Microphone access denied or not available.");
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
}

function bindEvents() {
  renderPresets();

  refs.presetRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) {
      return;
    }
    const preset = INSTRUCTION_PRESETS.find((item) => item.label === button.dataset.preset);
    if (!preset) {
      return;
    }
    refs.instructionsInput.value = preset.instructions;
    refs.speedInput.value = String(preset.speed);
    refs.presetRow.querySelectorAll("[data-preset]").forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
    });
    syncDraftState({ announce: true });
  });

  [refs.phraseInput, refs.noteInput, refs.instructionsInput].forEach((input) => {
    input.addEventListener("input", () => {
      syncDraftState({ announce: true });
    });
  });
  refs.speedInput.addEventListener("input", () => {
    syncDraftState({ announce: true });
  });
  refs.voiceGrid.addEventListener("change", () => {
    syncDraftState({ announce: true });
  });

  refs.generateButton.addEventListener("click", () => {
    generateCurrentPhrase();
  });
  refs.saveButton.addEventListener("click", () => {
    saveCurrentPhrase({ mode: "new" });
  });
  refs.updateButton.addEventListener("click", () => {
    saveCurrentPhrase({ mode: "update" });
  });
  refs.newButton.addEventListener("click", () => {
    clearComposer();
    setNotice("info", "Fresh draft ready.");
  });

  refs.recommendedVoicesButton.addEventListener("click", () => {
    setVoiceSelection(state.defaultVoices);
  });
  refs.allVoicesButton.addEventListener("click", () => {
    setVoiceSelection(state.availableVoices);
  });
  refs.clearVoicesButton.addEventListener("click", () => {
    setVoiceSelection([]);
  });

  refs.cycleButton.addEventListener("click", () => {
    cycleVariants({ random: false });
  });
  refs.shuffleButton.addEventListener("click", () => {
    cycleVariants({ random: true });
  });
  refs.stopButton.addEventListener("click", () => {
    stopCycle();
    setNotice("info", "Playback stopped.");
  });

  refs.recordButton.addEventListener("click", () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  refs.variantList.addEventListener("click", (event) => {
    const reRecordBtn = event.target.closest(".re-record-button");
    if (reRecordBtn) {
      startRecording();
      return;
    }
    const button = event.target.closest(".play-variant-button");
    if (!button) {
      return;
    }
    playSingleVariant(button.dataset.variantId);
  });

  refs.libraryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const phraseId = button.dataset.phraseId;
    const action = button.dataset.action;
    if (action === "load") {
      loadPhrase(phraseId);
      return;
    }
    if (action === "practice") {
      loadPhrase(phraseId, { practice: true });
      return;
    }
    if (action === "delete") {
      deletePhrase(phraseId);
    }
  });
}

async function init() {
  bindEvents();
  refs.stopButton.disabled = true;
  refs.cycleButton.disabled = true;
  refs.shuffleButton.disabled = true;

  try {
    const bootstrap = await fetchJson(`${API_BASE}/bootstrap`);
    state.availableVoices = bootstrap.availableVoices || [];
    state.defaultVoices = bootstrap.defaultVoices || [];
    state.phrases = bootstrap.phrases || [];
    state.ttsReady = Boolean(bootstrap.ttsReady);

    renderVoiceGrid();
    refs.speedInput.value = String(bootstrap.defaultSpeed || 1);
    renderLibrary();
    renderVariants();
    syncComposerMeta();

    if (state.ttsReady) {
      setNotice("info", "AI-generated audio is ready. Build a phrase, choose your voice pack, and generate.");
    } else {
      setNotice(
        "warning",
        "The page is live, but OpenAI TTS is not configured yet on the server. Saving phrases still works; generation stays disabled until OPENAI_API_KEY is set."
      );
    }
  } catch (error) {
    state.availableVoices = ["cedar", "marin", "ash", "verse"];
    state.defaultVoices = ["cedar", "marin", "ash", "verse"];
    renderVoiceGrid();
    renderLibrary();
    renderVariants();
    syncComposerMeta();
    setNotice("error", error.message || "Failed to load HVPT Voice Lab.");
  }
}

init();
