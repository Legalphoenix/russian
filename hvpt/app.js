const API_BASE = "./api";
const ACTIVE_DECK_KEY = "hvpt:activeDeckId";
const ACTIVE_GROUP_KEY = "hvpt:activeGroup";
const DEFAULT_PRESET_LABEL = "Stress contrast";

const INSTRUCTION_PRESETS = [
  {
    label: "Slow & precise",
    speed: 1,
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
    speed: 1,
    instructions:
      "Tone: Conversational.\nPacing: Brisk but natural.\nDelivery: Connect words smoothly without sounding rushed.",
  },
  {
    label: "Stress contrast",
    speed: 1,
    instructions:
      "Tone: Focused.\nPacing: Moderate.\nEmphasis: Make the main sentence stress easy to hear.\nPronunciation: Clear vowel reduction and rhythm.",
  },
];

const state = {
  availableVoices: [],
  defaultVoices: [],
  decks: [],
  activeDeckId: "",
  activeGroupId: "", // "" = All
  variants: [],
  loadedPhraseId: "",
  loadedPhraseSnapshot: null,
  formDirty: false,
  mode: "single", // "single" | "batch"
  playingVariantId: "",
  cycleToken: 0,
  isGenerating: false,
  isSaving: false,
  ttsReady: false,
  userRecording: null,
  isRecording: false,
  mediaRecorder: null,
  mediaStream: null,
  drillActive: false,
  drillToken: 0,
  drillPlayingPhraseId: "",
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
  drillStartButton: document.getElementById("drill-start-button"),
  drillStopButton: document.getElementById("drill-stop-button"),
  drillStatus: document.getElementById("drill-status"),
  drillAudio: document.getElementById("drill-audio"),
  deckSelect: document.getElementById("deck-select"),
  deckMenuButton: document.getElementById("deck-menu-button"),
  deckMenu: document.getElementById("deck-menu"),
  modeSingleButton: document.getElementById("mode-single-button"),
  modeBatchButton: document.getElementById("mode-batch-button"),
  singleMode: document.getElementById("single-mode"),
  batchMode: document.getElementById("batch-mode"),
  batchInput: document.getElementById("batch-input"),
  batchCount: document.getElementById("batch-count"),
  batchGroupCheck: document.getElementById("batch-group-check"),
  batchGroupField: document.getElementById("batch-group-field"),
  batchGroupSelect: document.getElementById("batch-group-select"),
  singleActions: document.getElementById("single-actions"),
  batchActions: document.getElementById("batch-actions"),
  batchSaveButton: document.getElementById("batch-save-button"),
  batchClearButton: document.getElementById("batch-clear-button"),
  groupChips: document.getElementById("group-chips"),
  groupNewButton: document.getElementById("group-new-button"),
  groupManageButton: document.getElementById("group-manage-button"),
  modalRoot: document.getElementById("modal-root"),
  modalTitle: document.getElementById("modal-title"),
  modalBody: document.getElementById("modal-body"),
  modalActions: document.getElementById("modal-actions"),
};

// ───── helpers ─────

function setNotice(kind, message) {
  refs.notice.className = `notice is-visible notice-${kind}`;
  refs.notice.textContent = message;
}

function formatSpeed(value) {
  const numeric = Number(value);
  return `${numeric.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}x`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function getActiveDeck() {
  return state.decks.find((d) => d.id === state.activeDeckId) || state.decks[0] || null;
}

function getActivePhrases() {
  const deck = getActiveDeck();
  return deck ? deck.phrases : [];
}

function getActiveGroups() {
  const deck = getActiveDeck();
  return deck ? deck.groups : [];
}

function getFilteredPhrases() {
  const phrases = getActivePhrases();
  if (!state.activeGroupId) return phrases;
  const group = getActiveGroups().find((g) => g.id === state.activeGroupId);
  if (!group) return phrases;
  const phraseById = new Map(phrases.map((p) => [p.id, p]));
  return group.phraseIds.map((id) => phraseById.get(id)).filter(Boolean);
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

function getDefaultInstructions() {
  const preset = INSTRUCTION_PRESETS.find((p) => p.label === DEFAULT_PRESET_LABEL);
  return preset ? preset.instructions : "";
}

// ───── renders ─────

function renderPresets() {
  refs.presetRow.innerHTML = INSTRUCTION_PRESETS.map(
    (preset) =>
      `<button class="preset-chip${preset.label === DEFAULT_PRESET_LABEL ? " is-active" : ""}" type="button" data-preset="${escapeHtml(preset.label)}">${escapeHtml(preset.label)}</button>`
  ).join("");
}

function renderVoiceGrid() {
  refs.voiceGrid.innerHTML = state.availableVoices
    .map(
      (voice) => `
        <label class="voice-option">
          <input type="checkbox" value="${escapeHtml(voice)}" />
          <span>${escapeHtml(voice)}</span>
        </label>
      `
    )
    .join("");
  setVoiceSelection(state.defaultVoices);
}

function renderDeckSelect() {
  refs.deckSelect.innerHTML = state.decks
    .map(
      (deck) =>
        `<option value="${escapeHtml(deck.id)}"${deck.id === state.activeDeckId ? " selected" : ""}>${escapeHtml(deck.name)} (${deck.phrases.length})</option>`
    )
    .join("");
}

function renderGroupChips() {
  const deck = getActiveDeck();
  if (!deck) {
    refs.groupChips.innerHTML = "";
    refs.groupManageButton.hidden = true;
    return;
  }
  const groups = deck.groups;
  refs.groupManageButton.hidden = groups.length === 0;

  const allSelected = state.activeGroupId === "" ? " is-active" : "";
  const chips = [
    `<button class="group-chip${allSelected}" type="button" data-group-filter="">
       <span class="group-chip-name">All</span>
       <span class="group-chip-count">${deck.phrases.length}</span>
     </button>`,
  ];
  for (const group of groups) {
    const isActive = state.activeGroupId === group.id ? " is-active" : "";
    chips.push(
      `<button class="group-chip${isActive}" type="button" data-group-filter="${escapeHtml(group.id)}" title="${escapeHtml(group.name)}">
         <span class="group-chip-name">${escapeHtml(group.name)}</span>
         <span class="group-chip-count">${group.phraseIds.length}</span>
         <span class="group-chip-drill" data-group-drill="${escapeHtml(group.id)}" role="button" aria-label="Start drill on ${escapeHtml(group.name)}" title="Start drill">▶</span>
       </button>`
    );
  }
  refs.groupChips.innerHTML = chips.join("");
}

function syncComposerMeta() {
  const selectedVoices = currentVoiceSelection();
  const hasLoadedPhrase = Boolean(state.loadedPhraseId);
  refs.voiceCount.textContent = `${selectedVoices.length} voice${selectedVoices.length === 1 ? "" : "s"} selected`;
  refs.speedValue.textContent = formatSpeed(refs.speedInput.value);

  const isBatch = state.mode === "batch";
  refs.activePhrasePill.textContent = isBatch
    ? "Batch mode"
    : state.formDirty
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

function collectPhrasePayload({ allowMissingVoices = false } = {}) {
  const payload = getCurrentDraft();
  if (!payload.text) {
    throw new Error("Enter a phrase first.");
  }
  if (!payload.voices.length && !allowMissingVoices) {
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
  const deck = getActiveDeck();
  if (!deck) return;
  const existingIndex = deck.phrases.findIndex((item) => item.id === phrase.id);
  if (existingIndex >= 0) {
    deck.phrases.splice(existingIndex, 1, phrase);
  } else {
    deck.phrases.unshift(phrase);
  }
  deck.phrases.sort((left, right) => right.updatedAt - left.updatedAt);
}

function replaceDeck(updated) {
  const idx = state.decks.findIndex((d) => d.id === updated.id);
  if (idx >= 0) state.decks.splice(idx, 1, updated);
  else state.decks.push(updated);
}

function upsertGroup(group) {
  const deck = getActiveDeck();
  if (!deck) return;
  const idx = deck.groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) deck.groups.splice(idx, 1, group);
  else deck.groups.push(group);
}

function removeGroupLocal(groupId) {
  const deck = getActiveDeck();
  if (!deck) return;
  deck.groups = deck.groups.filter((g) => g.id !== groupId);
  if (state.activeGroupId === groupId) state.activeGroupId = "";
}

// ───── variants ─────

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
          <audio class="audio-player" controls preload="auto" data-variant-id="user-recording" src="${escapeHtml(state.userRecording.url)}"></audio>
        </div>
      </article>
    `;
  }

  html += state.variants
    .map((variant) => {
      const isPlaying = variant.id === state.playingVariantId;
      return `
        <article class="variant-card ${isPlaying ? "is-playing" : ""}" data-variant-id="${escapeHtml(variant.id)}">
          <div class="variant-top">
            <span class="voice-badge">${escapeHtml(variant.voice)}</span>
            <span class="variant-meta">${formatSpeed(variant.speed)} ${variant.cached ? "· cached" : "· fresh"}</span>
          </div>
          <p class="variant-note">Same phrase, new speaker shape. Use cycle mode for quick contrast reps.</p>
          <div class="variant-actions">
            <button class="mini-button play-variant-button" type="button" data-variant-id="${escapeHtml(variant.id)}">Play</button>
            <audio class="audio-player" controls preload="none" data-variant-id="${escapeHtml(variant.id)}" src="${escapeHtml(variant.url)}"></audio>
          </div>
        </article>
      `;
    })
    .join("");

  refs.variantList.innerHTML = html;
  applyPlayingState();
  syncComposerMeta();

  refs.variantList.querySelectorAll("audio.audio-player").forEach((audio) => {
    audio.addEventListener("error", () => {
      const card = audio.closest(".variant-card");
      if (card) {
        const meta = card.querySelector(".variant-meta");
        if (meta) meta.textContent = "Format not supported on this browser";
        card.style.opacity = "0.5";
      }
    }, { once: true });
  });
}

// ───── library ─────

function renderLibrary() {
  const deck = getActiveDeck();
  const deckPhrases = deck ? deck.phrases : [];
  const deckGroups = deck ? deck.groups : [];
  const filteredPhrases = getFilteredPhrases();

  const activeGroup = deckGroups.find((g) => g.id === state.activeGroupId);
  const phraseCountLabel = activeGroup
    ? `${filteredPhrases.length} in "${activeGroup.name}" · ${deckPhrases.length} total`
    : `${deckPhrases.length} saved phrase${deckPhrases.length === 1 ? "" : "s"}`;
  refs.libraryCount.textContent = phraseCountLabel;

  renderDeckSelect();
  renderGroupChips();

  if (!deckPhrases.length) {
    refs.libraryList.innerHTML = `<div class="empty-state">Save the phrases that still need ear work. They will stay on the server-backed phrase bank for later practice.</div>`;
    syncDrillUI();
    return;
  }
  if (!filteredPhrases.length) {
    refs.libraryList.innerHTML = `<div class="empty-state">No phrases in this group yet. Click the "+" on any phrase below to add it to a group.</div>`;
    syncDrillUI();
    return;
  }

  const groupLookup = new Map(deckGroups.map((g) => [g.id, g]));

  refs.libraryList.innerHTML = filteredPhrases
    .map((phrase) => {
      const isActive = phrase.id === state.loadedPhraseId;
      const isDrillPlaying = state.drillPlayingPhraseId === phrase.id;
      const note = phrase.note ? `<p class="library-note">${escapeHtml(phrase.note)}</p>` : "";
      const instructionNote = phrase.instructions ? "voice direction saved" : "plain delivery";
      const badges = deckGroups
        .filter((g) => g.phraseIds.includes(phrase.id))
        .map(
          (g) =>
            `<button class="group-badge" type="button" data-action="toggle-group" data-phrase-id="${escapeHtml(phrase.id)}" data-group-id="${escapeHtml(g.id)}" title="Remove from ${escapeHtml(g.name)}">${escapeHtml(g.name)} ×</button>`
        )
        .join("");
      return `
        <article class="library-card ${isActive ? "is-active" : ""} ${isDrillPlaying ? "is-drill-playing" : ""}" data-phrase-id="${escapeHtml(phrase.id)}">
          <div class="library-top">
            <div class="library-top-left">
              <span class="library-tag">${phrase.voices.length} voice${phrase.voices.length === 1 ? "" : "s"}</span>
            </div>
            <span class="library-date">${formatDate(phrase.updatedAt)}</span>
          </div>
          <p class="library-text">${escapeHtml(phrase.text)}</p>
          ${note}
          <p class="library-meta">${formatSpeed(phrase.speed)} · ${instructionNote}</p>
          <div class="library-groups">
            ${badges}
            <button class="group-badge group-badge-add" type="button" data-action="open-group-popover" data-phrase-id="${escapeHtml(phrase.id)}" title="Add to a group">+ Group</button>
          </div>
          <div class="library-actions">
            <button class="mini-button" type="button" data-action="load" data-phrase-id="${escapeHtml(phrase.id)}">Load</button>
            <button class="mini-button" type="button" data-action="practice" data-phrase-id="${escapeHtml(phrase.id)}">Practice</button>
            <button class="mini-button is-danger" type="button" data-action="delete" data-phrase-id="${escapeHtml(phrase.id)}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
  syncDrillUI();
}

// ───── composer ─────

function applyPreset(label) {
  const preset = INSTRUCTION_PRESETS.find((p) => p.label === label);
  if (!preset) return;
  refs.instructionsInput.value = preset.instructions;
  refs.speedInput.value = String(preset.speed);
  refs.presetRow.querySelectorAll("[data-preset]").forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate.dataset.preset === label);
  });
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
  refs.presetRow.querySelectorAll("[data-preset]").forEach((candidate) => {
    candidate.classList.remove("is-active");
  });
  renderVariants();
  renderLibrary();
  syncComposerMeta();
}

function clearComposer({ keepPreset = true } = {}) {
  stopCycle();
  refs.phraseInput.value = "";
  refs.noteInput.value = "";
  if (keepPreset) {
    applyPreset(DEFAULT_PRESET_LABEL);
  } else {
    refs.instructionsInput.value = "";
    refs.speedInput.value = "1";
  }
  setLoadedPhrase(null);
  clearUserRecording();
  state.variants = [];
  state.playingVariantId = "";
  setVoiceSelection(state.defaultVoices);
  renderVariants();
  renderLibrary();
  syncComposerMeta();
}

function setMode(mode) {
  state.mode = mode;
  const isBatch = mode === "batch";
  refs.modeSingleButton.classList.toggle("is-active", !isBatch);
  refs.modeBatchButton.classList.toggle("is-active", isBatch);
  refs.modeSingleButton.setAttribute("aria-selected", String(!isBatch));
  refs.modeBatchButton.setAttribute("aria-selected", String(isBatch));
  refs.singleMode.hidden = isBatch;
  refs.batchMode.hidden = !isBatch;
  refs.singleActions.hidden = isBatch;
  refs.batchActions.hidden = !isBatch;
  if (isBatch) {
    refreshBatchCount();
    refreshBatchGroupOptions();
  }
  syncComposerMeta();
}

// ───── batch parsing ─────

function parseBatchInput(raw) {
  const lines = raw.split(/\r?\n/);
  const result = [];
  const errors = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let text = trimmed;
    let note = "";
    const separators = ["\t", "|", "=", "—", " - "];
    for (const sep of separators) {
      const idx = trimmed.indexOf(sep);
      if (idx > 0) {
        text = trimmed.slice(0, idx).trim();
        note = trimmed.slice(idx + sep.length).trim();
        break;
      }
    }
    if (!text) {
      errors.push(`Line ${index + 1}: empty phrase.`);
      return;
    }
    result.push({ text, note });
  });
  return { items: result, errors };
}

function refreshBatchCount() {
  const { items, errors } = parseBatchInput(refs.batchInput.value);
  const parts = [`${items.length} phrase${items.length === 1 ? "" : "s"} detected`];
  if (errors.length) parts.push(`${errors.length} skipped`);
  refs.batchCount.textContent = parts.join(" · ") + ".";
  refs.batchSaveButton.disabled = items.length === 0;
}

function refreshBatchGroupOptions() {
  const groups = getActiveGroups();
  refs.batchGroupSelect.innerHTML = groups.length
    ? groups.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.name)}</option>`).join("") +
      `<option value="__new__">+ New group…</option>`
    : `<option value="__new__">+ New group…</option>`;
}

// ───── play / cycle ─────

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
  if (!audio) return;
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
  if (!audio) return;
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
  if (!state.variants.length && !state.userRecording) return;
  if (state.drillActive) stopDrill();
  stopCycle();
  const token = state.cycleToken;
  let items = [...state.variants];
  if (state.userRecording) items.unshift({ id: "user-recording" });
  const queue = random ? shuffle(items) : items;
  setNotice("info", random ? "Shuffle cycle running." : "Cycle running.");

  try {
    for (const variant of queue) {
      if (token !== state.cycleToken) return;
      await playVariantAndWait(variant.id, token);
    }
    if (token === state.cycleToken) setNotice("success", "Cycle complete.");
  } catch (error) {
    setNotice("error", error.message || "Audio playback failed.");
  } finally {
    if (token === state.cycleToken) {
      state.playingVariantId = "";
      applyPlayingState();
    }
  }
}

// ───── generate / save ─────

async function generateCurrentPhrase({ silent = false } = {}) {
  const deck = getActiveDeck();
  if (!deck) {
    setNotice("warning", "Create a deck first.");
    return;
  }
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
  if (!silent) setNotice("info", "Generating voice pack...");

  try {
    const response = await fetchJson(`${API_BASE}/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.variants = response.variants || [];
    renderVariants();
    if (!silent) setNotice("success", `${state.variants.length} voice variants ready.`);
  } catch (error) {
    setNotice("error", error.message);
  } finally {
    state.isGenerating = false;
    syncComposerMeta();
  }
}

async function saveCurrentPhrase({ mode = "new" } = {}) {
  const deck = getActiveDeck();
  if (!deck) {
    setNotice("warning", "Create a deck first.");
    return;
  }
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
  let url = `${API_BASE}/decks/${deck.id}/phrases`;
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
    url = `${API_BASE}/decks/${deck.id}/phrases/${state.loadedPhraseId}`;
    progressMessage = "Updating loaded phrase...";
    successMessage = "Loaded phrase updated.";
  } else if (state.loadedPhraseId) {
    progressMessage = "Saving new phrase...";
    successMessage = "Saved as new phrase.";
  }

  setNotice("info", progressMessage);

  try {
    const response = await fetchJson(url, { method, body: JSON.stringify(payload) });
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

async function saveBatchPhrases() {
  const deck = getActiveDeck();
  if (!deck) {
    setNotice("warning", "Create a deck first.");
    return;
  }
  const { items, errors } = parseBatchInput(refs.batchInput.value);
  if (!items.length) {
    setNotice("warning", "Add at least one phrase to the batch.");
    return;
  }

  const instructions = refs.instructionsInput.value.trim();
  const speed = Number(refs.speedInput.value);
  const voices = currentVoiceSelection();
  if (!voices.length) {
    setNotice("warning", "Select at least one voice for the batch.");
    return;
  }

  const payload = {
    phrases: items.map((item) => ({
      text: item.text,
      note: item.note,
      instructions,
      speed,
      voices,
    })),
  };

  // Resolve group target before we mutate state, so a failed group create
  // doesn't leave the user wondering why phrases saved but didn't land anywhere.
  let targetGroupId = null;
  if (refs.batchGroupCheck.checked) {
    const selectValue = refs.batchGroupSelect.value;
    if (selectValue === "__new__" || !selectValue) {
      const name = window.prompt("Name for the new group:", "");
      if (!name || !name.trim()) {
        setNotice("info", "Batch cancelled.");
        return;
      }
      try {
        const created = await createGroup(name.trim());
        targetGroupId = created?.id || null;
      } catch (error) {
        setNotice("error", error.message);
        return;
      }
    } else {
      targetGroupId = selectValue;
    }
  }

  state.isSaving = true;
  syncComposerMeta();
  setNotice("info", `Saving ${items.length} phrase${items.length === 1 ? "" : "s"}...`);

  try {
    const response = await fetchJson(`${API_BASE}/decks/${deck.id}/phrases/batch`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const saved = response.phrases || [];
    for (const phrase of saved) upsertPhrase(phrase);

    if (targetGroupId && saved.length) {
      const deckNow = getActiveDeck();
      const group = deckNow?.groups.find((g) => g.id === targetGroupId);
      if (group) {
        const merged = Array.from(new Set([...group.phraseIds, ...saved.map((p) => p.id)]));
        try {
          const updated = await fetchJson(`${API_BASE}/decks/${deck.id}/groups/${group.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: group.name, phraseIds: merged }),
          });
          upsertGroup(updated.group);
        } catch (error) {
          setNotice("warning", `Saved ${saved.length} phrase(s), but adding to the group failed: ${error.message}`);
          renderLibrary();
          return;
        }
      }
    }

    refs.batchInput.value = "";
    refreshBatchCount();
    const extra = errors.length ? ` (${errors.length} line${errors.length === 1 ? "" : "s"} skipped)` : "";
    setNotice("success", `Saved ${saved.length} phrase${saved.length === 1 ? "" : "s"}${extra}.`);
    renderLibrary();
  } catch (error) {
    setNotice("error", error.message);
  } finally {
    state.isSaving = false;
    syncComposerMeta();
  }
}

async function deletePhrase(phraseId) {
  const deck = getActiveDeck();
  if (!deck) return;
  const phrase = deck.phrases.find((item) => item.id === phraseId);
  if (!phrase) return;
  if (!window.confirm(`Delete "${phrase.text}" from "${deck.name}"?`)) return;

  try {
    await fetchJson(`${API_BASE}/decks/${deck.id}/phrases/${phraseId}`, { method: "DELETE" });
    deck.phrases = deck.phrases.filter((item) => item.id !== phraseId);
    for (const group of deck.groups) {
      group.phraseIds = group.phraseIds.filter((id) => id !== phraseId);
    }
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
  const deck = getActiveDeck();
  if (!deck) return;
  const phrase = deck.phrases.find((item) => item.id === phraseId);
  if (!phrase) return;
  setMode("single");
  populateComposer(phrase);
  setNotice("info", "Phrase loaded.");
  if (practice) {
    await generateCurrentPhrase({ silent: true });
    if (state.variants.length) setNotice("success", "Saved phrase loaded and generated.");
  }
}

// ───── recording ─────

function clearUserRecording() {
  if (state.userRecording) {
    if (state.userRecording.blob) URL.revokeObjectURL(state.userRecording.url);
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
    const recorderOptions = {};
    for (const mime of ["audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"]) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(mime)) {
        recorderOptions.mimeType = mime;
        break;
      }
    }
    const recorder = new MediaRecorder(stream, recorderOptions);
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

        const deck = getActiveDeck();
        if (deck && state.loadedPhraseId && state.loadedPhraseSnapshot) {
          try {
            const savePayload = { ...state.loadedPhraseSnapshot, recordingUrl: result.url };
            await fetchJson(`${API_BASE}/decks/${deck.id}/phrases/${state.loadedPhraseId}`, {
              method: "PUT",
              body: JSON.stringify(savePayload),
            });
            const localPhrase = deck.phrases.find((p) => p.id === state.loadedPhraseId);
            if (localPhrase) localPhrase.recordingUrl = result.url;
            setNotice("success", "Recording saved and linked to phrase.");
          } catch (autoSaveError) {
            setNotice("success", "Recording saved. Save the phrase to keep it permanently.");
          }
        } else {
          setNotice("success", "Recording saved. Save the phrase to keep it permanently.");
        }
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

// ───── drill ─────

function syncDrillUI() {
  const filtered = getFilteredPhrases();
  refs.drillStartButton.disabled = filtered.length === 0 || state.drillActive;
  refs.drillStopButton.hidden = !state.drillActive;
  refs.drillStartButton.hidden = state.drillActive;

  const deck = getActiveDeck();
  const group = deck?.groups.find((g) => g.id === state.activeGroupId);
  refs.drillStartButton.textContent = group
    ? `▶ Drill "${group.name}" (${filtered.length})`
    : `▶ Start drill (${filtered.length})`;
}

function setDrillStatus(message) {
  if (!message) {
    refs.drillStatus.classList.remove("is-visible");
    refs.drillStatus.textContent = "";
    return;
  }
  refs.drillStatus.textContent = message;
  refs.drillStatus.classList.add("is-visible");
}

function stopDrill() {
  state.drillToken += 1;
  state.drillActive = false;
  state.drillPlayingPhraseId = "";
  refs.drillAudio.pause();
  refs.drillAudio.removeAttribute("src");
  setDrillStatus("");
  renderLibrary();
  syncDrillUI();
}

async function startDrillWithPhrases(phrases, label) {
  if (!phrases.length) {
    setNotice("warning", "No phrases to drill.");
    return;
  }
  stopCycle();
  state.drillActive = true;
  state.drillToken += 1;
  const token = state.drillToken;
  syncDrillUI();
  renderLibrary();
  const base = label ? `Drill: ${label}` : "Drill";
  setDrillStatus(`${base} — ${phrases.length} phrase${phrases.length === 1 ? "" : "s"}.`);

  try {
    while (state.drillActive && token === state.drillToken) {
      const phraseOrder = shuffle(phrases);
      for (const phrase of phraseOrder) {
        if (token !== state.drillToken) return;

        state.drillPlayingPhraseId = phrase.id;
        renderLibrary();

        const voicePool = phrase.voices && phrase.voices.length ? phrase.voices : state.defaultVoices;
        const voice = voicePool[Math.floor(Math.random() * voicePool.length)];

        setDrillStatus(`Playing: "${phrase.text.slice(0, 50)}${phrase.text.length > 50 ? "..." : ""}" — ${voice}`);

        let audioUrl;
        try {
          const response = await fetchJson(`${API_BASE}/generate`, {
            method: "POST",
            body: JSON.stringify({
              text: phrase.text,
              note: phrase.note || "",
              instructions: phrase.instructions || "",
              speed: phrase.speed || 1,
              voices: [voice],
            }),
          });
          if (!response.variants || !response.variants.length) continue;
          audioUrl = response.variants[0].url;
        } catch (genError) {
          setDrillStatus(`Skipping "${phrase.text.slice(0, 30)}..." — generation failed.`);
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        if (token !== state.drillToken) return;

        await new Promise((resolve, reject) => {
          const audio = refs.drillAudio;
          const cleanup = () => {
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("error", onErr);
          };
          const onEnd = () => { cleanup(); resolve(); };
          const onErr = () => { cleanup(); reject(new Error("Playback failed.")); };
          audio.addEventListener("ended", onEnd, { once: true });
          audio.addEventListener("error", onErr, { once: true });
          audio.src = audioUrl;
          audio.play().catch((e) => { cleanup(); reject(e); });
        });

        if (token !== state.drillToken) return;

        await new Promise((r) => setTimeout(r, 800));
      }
    }
  } catch (error) {
    if (token === state.drillToken) setNotice("error", error.message || "Drill playback error.");
  } finally {
    if (token === state.drillToken) {
      state.drillActive = false;
      state.drillPlayingPhraseId = "";
      setDrillStatus("");
      renderLibrary();
      syncDrillUI();
      setNotice("success", "Drill finished.");
    }
  }
}

function startDrillOnCurrentView() {
  const deck = getActiveDeck();
  const group = deck?.groups.find((g) => g.id === state.activeGroupId);
  const phrases = getFilteredPhrases();
  startDrillWithPhrases(phrases, group ? group.name : null);
}

function startDrillOnGroup(groupId) {
  const deck = getActiveDeck();
  const group = deck?.groups.find((g) => g.id === groupId);
  if (!group) return;
  const phraseById = new Map(deck.phrases.map((p) => [p.id, p]));
  const phrases = group.phraseIds.map((id) => phraseById.get(id)).filter(Boolean);
  startDrillWithPhrases(phrases, group.name);
}

// ───── decks ─────

async function createDeck() {
  const name = window.prompt("New deck name (e.g. French, Spanish):", "");
  if (!name || !name.trim()) return;
  try {
    const response = await fetchJson(`${API_BASE}/decks`, {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
    state.decks.push(response.deck);
    state.activeDeckId = response.deck.id;
    state.activeGroupId = "";
    persistDeckSelection();
    setNotice("success", `Deck "${response.deck.name}" created.`);
    clearComposer();
    renderLibrary();
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function renameDeck() {
  const deck = getActiveDeck();
  if (!deck) return;
  const name = window.prompt("Rename deck to:", deck.name);
  if (!name || !name.trim() || name.trim() === deck.name) return;
  try {
    const response = await fetchJson(`${API_BASE}/decks/${deck.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim() }),
    });
    replaceDeck(response.deck);
    renderLibrary();
    setNotice("success", `Deck renamed to "${response.deck.name}".`);
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function deleteDeck() {
  const deck = getActiveDeck();
  if (!deck) return;
  if (state.decks.length <= 1) {
    setNotice("warning", "You need at least one deck.");
    return;
  }
  if (!window.confirm(`Delete deck "${deck.name}" and all its ${deck.phrases.length} phrases? This cannot be undone.`)) return;
  try {
    await fetchJson(`${API_BASE}/decks/${deck.id}`, { method: "DELETE" });
    state.decks = state.decks.filter((d) => d.id !== deck.id);
    state.activeDeckId = state.decks[0]?.id || "";
    state.activeGroupId = "";
    persistDeckSelection();
    clearComposer();
    renderLibrary();
    setNotice("success", `Deck "${deck.name}" deleted.`);
  } catch (error) {
    setNotice("error", error.message);
  }
}

function switchDeck(deckId) {
  if (!state.decks.find((d) => d.id === deckId)) return;
  state.activeDeckId = deckId;
  state.activeGroupId = "";
  persistDeckSelection();
  clearComposer();
  renderLibrary();
}

function persistDeckSelection() {
  try {
    if (state.activeDeckId) window.localStorage.setItem(ACTIVE_DECK_KEY, state.activeDeckId);
    else window.localStorage.removeItem(ACTIVE_DECK_KEY);
  } catch {}
}

// ───── groups ─────

async function createGroup(nameOverride) {
  const deck = getActiveDeck();
  if (!deck) return null;
  const name = nameOverride ?? window.prompt("New group name:", "");
  if (!name || !name.trim()) return null;
  const response = await fetchJson(`${API_BASE}/decks/${deck.id}/groups`, {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  });
  upsertGroup(response.group);
  renderLibrary();
  refreshBatchGroupOptions();
  setNotice("success", `Group "${response.group.name}" created.`);
  return response.group;
}

async function deleteGroup(groupId) {
  const deck = getActiveDeck();
  if (!deck) return;
  const group = deck.groups.find((g) => g.id === groupId);
  if (!group) return;
  if (!window.confirm(`Delete group "${group.name}"? (Phrases stay in the deck.)`)) return;
  try {
    await fetchJson(`${API_BASE}/decks/${deck.id}/groups/${groupId}`, { method: "DELETE" });
    removeGroupLocal(groupId);
    renderLibrary();
    refreshBatchGroupOptions();
    setNotice("success", `Group "${group.name}" deleted.`);
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function renameGroup(groupId) {
  const deck = getActiveDeck();
  if (!deck) return;
  const group = deck.groups.find((g) => g.id === groupId);
  if (!group) return;
  const name = window.prompt("Rename group to:", group.name);
  if (!name || !name.trim() || name.trim() === group.name) return;
  try {
    const response = await fetchJson(`${API_BASE}/decks/${deck.id}/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim(), phraseIds: group.phraseIds }),
    });
    upsertGroup(response.group);
    renderLibrary();
    refreshBatchGroupOptions();
    setNotice("success", `Group renamed to "${response.group.name}".`);
  } catch (error) {
    setNotice("error", error.message);
  }
}

async function togglePhraseInGroup(phraseId, groupId) {
  const deck = getActiveDeck();
  if (!deck) return;
  const group = deck.groups.find((g) => g.id === groupId);
  if (!group) return;
  const next = group.phraseIds.includes(phraseId)
    ? group.phraseIds.filter((id) => id !== phraseId)
    : [...group.phraseIds, phraseId];
  try {
    const response = await fetchJson(`${API_BASE}/decks/${deck.id}/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ name: group.name, phraseIds: next }),
    });
    upsertGroup(response.group);
    renderLibrary();
  } catch (error) {
    setNotice("error", error.message);
  }
}

// ───── modal ─────

function openModal({ title, body, actions = [] }) {
  refs.modalTitle.textContent = title;
  if (typeof body === "string") refs.modalBody.innerHTML = body;
  else {
    refs.modalBody.innerHTML = "";
    refs.modalBody.appendChild(body);
  }
  refs.modalActions.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.primary ? "primary-button" : "ghost-button";
    button.textContent = action.label;
    button.addEventListener("click", async () => {
      await action.onClick();
    });
    refs.modalActions.appendChild(button);
  });
  refs.modalRoot.hidden = false;
}

function closeModal() {
  refs.modalRoot.hidden = true;
  refs.modalBody.innerHTML = "";
  refs.modalActions.innerHTML = "";
}

function openGroupPopover(phraseId, anchor) {
  closeGroupPopover();
  const deck = getActiveDeck();
  if (!deck) return;
  const popover = document.createElement("div");
  popover.className = "group-popover";
  popover.id = "group-popover";
  const itemsHtml = deck.groups.length
    ? deck.groups
        .map(
          (g) => `
          <label class="group-popover-item">
            <input type="checkbox" data-phrase-id="${escapeHtml(phraseId)}" data-group-id="${escapeHtml(g.id)}" ${g.phraseIds.includes(phraseId) ? "checked" : ""} />
            <span>${escapeHtml(g.name)}</span>
          </label>
        `
        )
        .join("")
    : `<p class="group-popover-empty">No groups yet.</p>`;
  popover.innerHTML = `
    <div class="group-popover-list">${itemsHtml}</div>
    <button class="mini-button group-popover-new" type="button" data-phrase-id="${escapeHtml(phraseId)}">+ New group with this phrase</button>
  `;
  document.body.appendChild(popover);

  const rect = anchor.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 6;
  const maxLeft = window.innerWidth - 280 - 12;
  const left = Math.max(12, Math.min(rect.left + window.scrollX, maxLeft));
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;

  setTimeout(() => {
    document.addEventListener("click", handlePopoverDocClick, { once: false });
  }, 0);
}

function closeGroupPopover() {
  const popover = document.getElementById("group-popover");
  if (popover) popover.remove();
  document.removeEventListener("click", handlePopoverDocClick);
}

function handlePopoverDocClick(event) {
  const popover = document.getElementById("group-popover");
  if (!popover) return;
  if (popover.contains(event.target)) return;
  if (event.target.closest('[data-action="open-group-popover"]')) return;
  closeGroupPopover();
}

function openManageGroupsModal() {
  const deck = getActiveDeck();
  if (!deck) return;
  const container = document.createElement("div");
  container.className = "manage-groups-list";
  if (!deck.groups.length) {
    container.innerHTML = `<p class="empty-state">No groups yet. Create one from the "+ New group" button.</p>`;
  } else {
    container.innerHTML = deck.groups
      .map(
        (g) => `
        <div class="manage-group-row" data-group-id="${escapeHtml(g.id)}">
          <div>
            <strong>${escapeHtml(g.name)}</strong>
            <span class="subpanel-note"> · ${g.phraseIds.length} phrase${g.phraseIds.length === 1 ? "" : "s"}</span>
          </div>
          <div class="inline-actions">
            <button class="mini-button" type="button" data-manage-action="rename" data-group-id="${escapeHtml(g.id)}">Rename</button>
            <button class="mini-button" type="button" data-manage-action="drill" data-group-id="${escapeHtml(g.id)}">Drill</button>
            <button class="mini-button is-danger" type="button" data-manage-action="delete" data-group-id="${escapeHtml(g.id)}">Delete</button>
          </div>
        </div>
      `
      )
      .join("");
  }
  openModal({
    title: `Manage groups — ${deck.name}`,
    body: container,
    actions: [{ label: "Close", onClick: closeModal }],
  });

  container.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-manage-action]");
    if (!button) return;
    const groupId = button.dataset.groupId;
    const action = button.dataset.manageAction;
    if (action === "rename") {
      closeModal();
      await renameGroup(groupId);
      openManageGroupsModal();
    } else if (action === "delete") {
      closeModal();
      await deleteGroup(groupId);
      if (getActiveDeck()?.groups.length) openManageGroupsModal();
    } else if (action === "drill") {
      closeModal();
      startDrillOnGroup(groupId);
    }
  });
}

// ───── events ─────

function bindEvents() {
  renderPresets();

  refs.presetRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    applyPreset(button.dataset.preset);
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

  refs.generateButton.addEventListener("click", () => generateCurrentPhrase());
  refs.saveButton.addEventListener("click", () => saveCurrentPhrase({ mode: "new" }));
  refs.updateButton.addEventListener("click", () => saveCurrentPhrase({ mode: "update" }));
  refs.newButton.addEventListener("click", () => {
    clearComposer();
    setNotice("info", "Fresh draft ready.");
  });

  refs.recommendedVoicesButton.addEventListener("click", () => setVoiceSelection(state.defaultVoices));
  refs.allVoicesButton.addEventListener("click", () => setVoiceSelection(state.availableVoices));
  refs.clearVoicesButton.addEventListener("click", () => setVoiceSelection([]));

  refs.cycleButton.addEventListener("click", () => cycleVariants({ random: false }));
  refs.shuffleButton.addEventListener("click", () => cycleVariants({ random: true }));
  refs.stopButton.addEventListener("click", () => {
    stopCycle();
    setNotice("info", "Playback stopped.");
  });

  refs.recordButton.addEventListener("click", () => {
    if (state.isRecording) stopRecording();
    else startRecording();
  });

  refs.variantList.addEventListener("click", (event) => {
    const reRecordBtn = event.target.closest(".re-record-button");
    if (reRecordBtn) { startRecording(); return; }
    const button = event.target.closest(".play-variant-button");
    if (!button) return;
    playSingleVariant(button.dataset.variantId);
  });

  refs.libraryList.addEventListener("click", (event) => {
    const toggle = event.target.closest('[data-action="toggle-group"]');
    if (toggle) {
      togglePhraseInGroup(toggle.dataset.phraseId, toggle.dataset.groupId);
      return;
    }
    const popoverBtn = event.target.closest('[data-action="open-group-popover"]');
    if (popoverBtn) {
      event.stopPropagation();
      openGroupPopover(popoverBtn.dataset.phraseId, popoverBtn);
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const phraseId = button.dataset.phraseId;
    const action = button.dataset.action;
    if (action === "load") loadPhrase(phraseId);
    else if (action === "practice") loadPhrase(phraseId, { practice: true });
    else if (action === "delete") deletePhrase(phraseId);
  });

  document.body.addEventListener("click", (event) => {
    const popover = document.getElementById("group-popover");
    if (!popover) return;
    const newBtn = event.target.closest(".group-popover-new");
    if (newBtn && popover.contains(newBtn)) {
      const phraseId = newBtn.dataset.phraseId;
      closeGroupPopover();
      (async () => {
        const created = await createGroup();
        if (created) {
          try {
            await togglePhraseInGroup(phraseId, created.id);
          } catch {}
        }
      })();
    }
  });

  document.body.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".group-popover-item input[type=checkbox]");
    if (!checkbox) return;
    togglePhraseInGroup(checkbox.dataset.phraseId, checkbox.dataset.groupId);
  });

  refs.drillStartButton.addEventListener("click", () => startDrillOnCurrentView());
  refs.drillStopButton.addEventListener("click", () => {
    stopDrill();
    setNotice("info", "Drill stopped.");
  });

  // Deck switcher.
  refs.deckSelect.addEventListener("change", () => switchDeck(refs.deckSelect.value));
  refs.deckMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !refs.deckMenu.hidden;
    refs.deckMenu.hidden = isOpen;
    refs.deckMenuButton.setAttribute("aria-expanded", String(!isOpen));
  });
  document.addEventListener("click", (event) => {
    if (!refs.deckMenu.hidden && !refs.deckMenu.contains(event.target) && event.target !== refs.deckMenuButton) {
      refs.deckMenu.hidden = true;
      refs.deckMenuButton.setAttribute("aria-expanded", "false");
    }
  });
  refs.deckMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-deck-action]");
    if (!button) return;
    refs.deckMenu.hidden = true;
    refs.deckMenuButton.setAttribute("aria-expanded", "false");
    const action = button.dataset.deckAction;
    if (action === "new") createDeck();
    else if (action === "rename") renameDeck();
    else if (action === "delete") deleteDeck();
  });

  // Mode toggle.
  refs.modeSingleButton.addEventListener("click", () => setMode("single"));
  refs.modeBatchButton.addEventListener("click", () => setMode("batch"));
  refs.batchInput.addEventListener("input", refreshBatchCount);
  refs.batchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const el = refs.batchInput;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.slice(0, start) + "\t" + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + 1;
    refreshBatchCount();
  });
  refs.batchSaveButton.addEventListener("click", () => saveBatchPhrases());
  refs.batchClearButton.addEventListener("click", () => {
    refs.batchInput.value = "";
    refreshBatchCount();
  });
  refs.batchGroupCheck.addEventListener("change", () => {
    refs.batchGroupField.hidden = !refs.batchGroupCheck.checked;
    if (refs.batchGroupCheck.checked) refreshBatchGroupOptions();
  });

  // Group chips + actions.
  refs.groupChips.addEventListener("click", (event) => {
    const drill = event.target.closest("[data-group-drill]");
    if (drill) {
      event.stopPropagation();
      startDrillOnGroup(drill.dataset.groupDrill);
      return;
    }
    const chip = event.target.closest("[data-group-filter]");
    if (!chip) return;
    state.activeGroupId = chip.dataset.groupFilter;
    renderLibrary();
  });
  refs.groupNewButton.addEventListener("click", () => createGroup());
  refs.groupManageButton.addEventListener("click", () => openManageGroupsModal());

  // Modal dismiss.
  refs.modalRoot.addEventListener("click", (event) => {
    if (event.target.dataset.modalDismiss !== undefined) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !refs.modalRoot.hidden) closeModal();
  });
}

// ───── init ─────

function restoreDeckSelection() {
  try {
    const saved = window.localStorage.getItem(ACTIVE_DECK_KEY);
    if (saved && state.decks.find((d) => d.id === saved)) state.activeDeckId = saved;
  } catch {}
  if (!state.activeDeckId && state.decks.length) state.activeDeckId = state.decks[0].id;
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
    state.decks = bootstrap.decks || [];
    state.ttsReady = Boolean(bootstrap.ttsReady);
    restoreDeckSelection();

    renderVoiceGrid();
    applyPreset(DEFAULT_PRESET_LABEL);
    refs.speedInput.value = "1";
    renderLibrary();
    renderVariants();
    syncComposerMeta();
    syncDrillUI();
    setMode("single");

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
    state.decks = [];
    renderVoiceGrid();
    applyPreset(DEFAULT_PRESET_LABEL);
    renderLibrary();
    renderVariants();
    syncComposerMeta();
    setMode("single");
    setNotice("error", error.message || "Failed to load HVPT Voice Lab.");
  }
}

init();
