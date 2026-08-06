"use strict";

const COURSE = Object.freeze({
  id: "original-trail.v1",
  physicsVersion: "ghost-lap.physics.v3",
  tickMs: 20,
  finishX: 4900,
  groundY: 420,
  runnerWidth: 38,
  speed: 5,
  stumbleSpeed: 2,
  burstSpeed: 7,
  burstTicks: 45,
  obstacles: Object.freeze([
    { x: 690, width: 58, height: 45, kind: "log" },
    { x: 1080, width: 45, height: 34, kind: "mushrooms" },
    { x: 1460, width: 66, height: 52, kind: "hay" },
    { x: 1890, width: 54, height: 43, kind: "log" },
    { x: 2290, width: 50, height: 37, kind: "mushrooms" },
    { x: 2695, width: 72, height: 56, kind: "hay" },
    { x: 3130, width: 58, height: 45, kind: "log" },
    { x: 3545, width: 48, height: 35, kind: "mushrooms" },
    { x: 3970, width: 68, height: 53, kind: "hay" },
    { x: 4380, width: 58, height: 45, kind: "log" },
  ]),
});

const CARROT_PATTERNS = Object.freeze([
  Object.freeze([[-38, 42], [0, 78], [38, 42]]),
  Object.freeze([[-40, 82], [0, 142], [40, 104]]),
  Object.freeze([[-42, 38], [0, 84], [42, 132]]),
  Object.freeze([[-42, 132], [0, 84], [42, 38]]),
]);
const CHALLENGE_CARROT_PATTERNS = Object.freeze([
  CARROT_PATTERNS[0],
  Object.freeze([[-40, 96], [0, 208], [40, 122]]),
  Object.freeze([[-42, 38], [0, 104], [42, 208]]),
  Object.freeze([[-42, 208], [0, 104], [42, 38]]),
]);
const RESULT_FX = Object.freeze({
  winDuration: 920,
  tieDuration: 720,
  lossDuration: 520,
  gravity: 430,
});
const CARROT_ZONES = Object.freeze([500, 960, 1480, 2020, 2580, 3160, 3740, 4360]);
const BASELINE_PATTERN_IDS = Object.freeze([0, 2, 1, 3, 0, 1, 2, 0]);
const HEAT_ROUTES = Object.freeze([
  Object.freeze({
    id: "original-trail.v1",
    name: "Original Trail",
    direction: 1,
    theme: "meadow",
    hint: "Classic logs, hay, and mushroom clumps.",
    patterns: BASELINE_PATTERN_IDS,
    obstacles: COURSE.obstacles,
  }),
  Object.freeze({
    id: "moonlit-marsh.v1",
    name: "Moonlit Marsh",
    direction: -1,
    theme: "marsh",
    hint: "Run left. Puddles bog down a missed hop.",
    patterns: Object.freeze([0, 0, 2, 0, 3, 2, 0, 1]),
    obstacles: Object.freeze([
      { x: 610, width: 126, height: 13, kind: "puddle", effect: "slow", effectTicks: 48 },
      { x: 1030, width: 52, height: 38, kind: "mushrooms" },
      { x: 1420, width: 150, height: 13, kind: "puddle", effect: "slow", effectTicks: 48 },
      { x: 1880, width: 62, height: 42, kind: "stone" },
      { x: 2300, width: 118, height: 13, kind: "puddle", effect: "slow", effectTicks: 48 },
      { x: 2720, width: 54, height: 36, kind: "mushrooms" },
      { x: 3150, width: 164, height: 13, kind: "puddle", effect: "slow", effectTicks: 48 },
      { x: 3630, width: 66, height: 44, kind: "stone" },
      { x: 4080, width: 138, height: 13, kind: "puddle", effect: "slow", effectTicks: 48 },
      { x: 4520, width: 54, height: 38, kind: "mushrooms" },
    ]),
  }),
  Object.freeze({
    id: "orchard-bounce.v1",
    name: "Orchard Bounce",
    direction: 1,
    theme: "orchard",
    hint: "Pink caps spring you up; crates and fences do not.",
    patterns: Object.freeze([2, 2, 1, 1, 3, 3, 2, 1]),
    obstacles: Object.freeze([
      { x: 640, width: 58, height: 43, kind: "stump" },
      { x: 1080, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 1510, width: 54, height: 54, kind: "crate" },
      { x: 1950, width: 72, height: 66, kind: "fence" },
      { x: 2370, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 2790, width: 62, height: 45, kind: "stump" },
      { x: 3240, width: 58, height: 58, kind: "crate" },
      { x: 3670, width: 78, height: 68, kind: "fence" },
      { x: 4110, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 4510, width: 62, height: 46, kind: "stump" },
    ]),
  }),
  Object.freeze({
    id: "snowcap-slide.v1",
    name: "Snowcap Slide",
    direction: -1,
    theme: "snow",
    hint: "Run left. Land on blue ice arrows for a free burst.",
    patterns: Object.freeze([2, 3, 2, 3, 1, 3, 2, 1]),
    obstacles: Object.freeze([
      { x: 590, width: 108, height: 12, kind: "ice", effect: "boost" },
      { x: 1020, width: 76, height: 47, kind: "snowbank" },
      { x: 1450, width: 64, height: 45, kind: "stone" },
      { x: 1870, width: 116, height: 12, kind: "ice", effect: "boost" },
      { x: 2300, width: 88, height: 55, kind: "snowbank" },
      { x: 2740, width: 68, height: 48, kind: "stone" },
      { x: 3160, width: 122, height: 12, kind: "ice", effect: "boost" },
      { x: 3610, width: 92, height: 58, kind: "snowbank" },
      { x: 4060, width: 70, height: 50, kind: "stone" },
      { x: 4490, width: 112, height: 12, kind: "ice", effect: "boost" },
    ]),
  }),
  Object.freeze({
    id: "haywire-farm.v1",
    name: "Haywire Farm",
    direction: 1,
    theme: "farm",
    hint: "Tall gates reward an early jump and a late flap.",
    patterns: Object.freeze([1, 1, 3, 1, 3, 2, 3, 1]),
    obstacles: Object.freeze([
      { x: 650, width: 64, height: 50, kind: "barrel" },
      { x: 1080, width: 78, height: 70, kind: "fence" },
      { x: 1500, width: 72, height: 56, kind: "hay" },
      { x: 1930, width: 66, height: 52, kind: "barrel" },
      { x: 2370, width: 84, height: 74, kind: "fence" },
      { x: 2810, width: 78, height: 59, kind: "hay" },
      { x: 3250, width: 68, height: 53, kind: "barrel" },
      { x: 3680, width: 88, height: 76, kind: "fence" },
      { x: 4120, width: 80, height: 61, kind: "hay" },
      { x: 4520, width: 68, height: 54, kind: "barrel" },
    ]),
  }),
  Object.freeze({
    id: "firefly-hollow.v1",
    name: "Firefly Hollow",
    direction: -1,
    theme: "hollow",
    hint: "Run left. Roots snag; glowing caps spring you clear.",
    patterns: Object.freeze([0, 1, 0, 3, 2, 1, 3, 0]),
    obstacles: Object.freeze([
      { x: 620, width: 88, height: 28, kind: "root", effect: "slow", effectTicks: 38 },
      { x: 1060, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 1490, width: 72, height: 48, kind: "stone" },
      { x: 1910, width: 96, height: 30, kind: "root", effect: "slow", effectTicks: 38 },
      { x: 2350, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 2780, width: 76, height: 50, kind: "stone" },
      { x: 3210, width: 102, height: 31, kind: "root", effect: "slow", effectTicks: 38 },
      { x: 3650, width: 58, height: 25, kind: "spring", effect: "bounce" },
      { x: 4080, width: 78, height: 52, kind: "stone" },
      { x: 4510, width: 106, height: 32, kind: "root", effect: "slow", effectTicks: 38 },
    ]),
  }),
]);

const ROUTE_THEMES = new Set(["meadow", "marsh", "orchard", "snow", "farm", "hollow"]);
const OBSTACLE_KINDS = new Set([
  "log", "mushrooms", "hay", "puddle", "stone", "stump", "spring",
  "crate", "fence", "snowbank", "ice", "barrel", "root",
]);
const OBSTACLE_EFFECTS = new Set(["bonk", "slow", "bounce", "boost"]);

function validateRouteCatalog() {
  const ids = new Set();
  for (const route of HEAT_ROUTES) {
    if (!route.id || ids.has(route.id)) throw new Error("Route IDs must be unique.");
    ids.add(route.id);
    if (![-1, 1].includes(route.direction)) throw new Error(`Bad direction for ${route.id}.`);
    if (!ROUTE_THEMES.has(route.theme)) throw new Error(`Bad theme for ${route.id}.`);
    if (!Array.isArray(route.patterns) || route.patterns.length !== CARROT_ZONES.length) {
      throw new Error(`Bad carrot pattern for ${route.id}.`);
    }
    let previousX = 0;
    for (const obstacle of route.obstacles) {
      const effect = obstacle.effect || "bonk";
      if (!OBSTACLE_KINDS.has(obstacle.kind) || !OBSTACLE_EFFECTS.has(effect)) {
        throw new Error(`Bad obstacle in ${route.id}.`);
      }
      if (
        !Number.isFinite(obstacle.x) || obstacle.x <= previousX ||
        !Number.isFinite(obstacle.width) || obstacle.width < COURSE.runnerWidth ||
        !Number.isFinite(obstacle.height) || obstacle.height <= 0 ||
        obstacle.x + obstacle.width >= COURSE.finishX
      ) {
        throw new Error(`Unsafe obstacle geometry in ${route.id}.`);
      }
      previousX = obstacle.x;
      Object.freeze(obstacle);
    }
  }
}

validateRouteCatalog();
const SAVED_RIVAL_INDEX_KEY = "ghost-lap.saved-rivals.v3";
const SAVED_RIVAL_SLOT_PREFIX = "ghost-lap.saved-rival.v3:";
const STATS_KEY_PREFIX = "ghost-lap.stats.v3:";
const SOUND_PREFERENCE_KEY = "ghost-lap.sound.v1";
const SOUND_MASTER_GAIN = 0.11;
const MAX_RIVAL_FILE_BYTES = 128 * 1024;
const MAX_SAVED_RIVALS = 6;
const MEDAL_RIVAL = 1;
const MEDAL_CARROTS = 2;
const MEDAL_CLEAN = 4;
const MEDAL_ALL = MEDAL_RIVAL | MEDAL_CARROTS | MEDAL_CLEAN;

const RIVAL_DNA_PALETTES = Object.freeze([
  Object.freeze({ label: "Moss", body: "#e8f7e5", light: "#bfe1bd", ear: "#8fbe99", scarf: "#efbd55", trail: "#527c55" }),
  Object.freeze({ label: "Ember", body: "#fff0e5", light: "#f4c3ab", ear: "#dc8b79", scarf: "#6e9ab2", trail: "#c95f55" }),
  Object.freeze({ label: "Moon", body: "#f0ecff", light: "#d6c9ee", ear: "#aa91c8", scarf: "#efbd55", trail: "#735b9a" }),
  Object.freeze({ label: "Honey", body: "#fff6d7", light: "#ecd58b", ear: "#cf9f69", scarf: "#5f8f73", trail: "#b8793f" }),
  Object.freeze({ label: "Berry", body: "#ffecef", light: "#edc0ca", ear: "#c88195", scarf: "#6e9ab2", trail: "#a95070" }),
  Object.freeze({ label: "Tide", body: "#e7f6fa", light: "#b7dde3", ear: "#79aeb8", scarf: "#ef7962", trail: "#40728e" }),
]);
const RIVAL_DNA_PATTERNS = Object.freeze(["spot", "stripe", "diamond", "crescent"]);
const RIVAL_DNA_TRAILS = Object.freeze(["bubbles", "diamonds", "sparks"]);

const API = Object.freeze({
  status: "/api/status",
  pin: "/api/pin",
  enroll: "/api/enroll",
  signGhost: "/api/ghost/sign",
  verifyGhost: "/api/ghost/verify",
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const byId = (id) => document.getElementById(id);
const elements = {
  canvas: byId("game-canvas"),
  canvasWrap: byId("canvas-wrap"),
  mockBanner: byId("mock-banner"),
  deviceChip: byId("device-chip"),
  deviceChipText: byId("device-chip-text"),
  refreshStatus: byId("refresh-status"),
  gameHud: byId("game-hud"),
  lapLabel: byId("lap-label"),
  gameClock: byId("game-clock"),
  carrotCount: byId("carrot-count"),
  burstPill: byId("burst-pill"),
  burstLabel: byId("burst-label"),
  burstFill: byId("burst-fill"),
  introPanel: byId("intro-panel"),
  introKicker: byId("intro-kicker"),
  introTitle: byId("intro-title"),
  introCopy: byId("intro-copy"),
  captureRoutePicker: byId("capture-route-picker"),
  previousRoute: byId("previous-route"),
  nextRoute: byId("next-route"),
  captureRouteCount: byId("capture-route-count"),
  captureRouteDirection: byId("capture-route-direction"),
  captureRouteName: byId("capture-route-name"),
  captureRouteHint: byId("capture-route-hint"),
  captureRouteMedals: byId("capture-route-medals"),
  startButton: byId("start-button"),
  startNote: byId("start-note"),
  signPanel: byId("sign-panel"),
  signKickerLabel: byId("sign-kicker-label"),
  firstLapTime: byId("first-lap-time"),
  signCopy: byId("sign-copy"),
  signForm: byId("sign-form"),
  signPin: byId("sign-pin"),
  signButton: byId("sign-button"),
  keepRivalButton: byId("keep-rival-button"),
  signNote: byId("sign-note"),
  ceremonyPanel: byId("ceremony-panel"),
  ceremonyStatus: byId("ceremony-status"),
  ceremonyKicker: byId("ceremony-kicker"),
  ceremonyTitle: byId("ceremony-title"),
  ceremonyCopy: byId("ceremony-copy"),
  finishPanel: byId("finish-panel"),
  finishRibbon: byId("finish-ribbon"),
  finishKicker: byId("finish-kicker"),
  finishHeading: byId("finish-heading"),
  playerTime: byId("player-time"),
  rivalScoreLabel: byId("rival-score-label"),
  ghostTime: byId("ghost-time"),
  heatStats: byId("heat-stats"),
  medalRow: byId("medal-row"),
  medalRival: byId("medal-rival"),
  medalCarrots: byId("medal-carrots"),
  medalClean: byId("medal-clean"),
  raceAgainButton: byId("race-again-button"),
  promotePbButton: byId("promote-pb-button"),
  retryRouteButton: byId("retry-route-button"),
  chooseTrailButton: byId("choose-trail-button"),
  viewProofButton: byId("view-proof-button"),
  newGhostButton: byId("new-ghost-button"),
  finishNote: byId("finish-note"),
  countdown: byId("countdown"),
  bonk: byId("bonk"),
  lateRabbit: byId("late-rabbit"),
  announcer: byId("game-announcer"),
  soundToggle: byId("sound-toggle"),
  rivalFileTools: byId("rival-file-tools"),
  importRivalButton: byId("import-rival-button"),
  exportRivalButton: byId("export-rival-button"),
  forgetRivalButton: byId("forget-rival-button"),
  importRivalFile: byId("import-rival-file"),
  rivalFileStatus: byId("rival-file-status"),
  setupCard: byId("setup-card"),
  setupTitle: byId("setup-title"),
  setupDescription: byId("setup-description"),
  pinGuide: byId("pin-guide"),
  pinCommandButtons: document.querySelectorAll("[data-copy-command]"),
  pinForm: byId("pin-form"),
  initialPinLabel: byId("initial-pin-label"),
  pinSetupNote: byId("pin-setup-note"),
  initialPin: byId("initial-pin"),
  initialPinConfirm: byId("initial-pin-confirm"),
  initialPinSubmit: byId("initial-pin-submit"),
  enrollForm: byId("enroll-form"),
  enrollLabel: byId("enroll-label"),
  enrollNote: byId("enroll-note"),
  enrollPin: byId("enroll-pin"),
  keyStory: byId("key-story"),
  keyStoryCopy: byId("key-story-copy"),
  proofBadge: byId("proof-badge"),
  proofKeyStorage: byId("proof-key-storage"),
  rivalDna: byId("rival-dna"),
  rivalDnaSigil: byId("rival-dna-sigil"),
  rivalDnaName: byId("rival-dna-name"),
  rivalDnaCopy: byId("rival-dna-copy"),
  proofSigner: byId("proof-signer"),
  proofProfile: byId("proof-profile"),
  proofReplay: byId("proof-replay"),
  proofAlgorithm: byId("proof-algorithm"),
  proofDerived: byId("proof-derived"),
  proofPresence: byId("proof-presence"),
  proofVerification: byId("proof-verification"),
  proofRun: byId("proof-run"),
  proofPayload: byId("proof-payload"),
  proofDerivation: byId("proof-derivation"),
  proofCounter: byId("proof-counter"),
  proofDigest: byId("proof-digest"),
  proofFingerprint: byId("proof-fingerprint"),
  proofFlow: byId("proof-flow"),
  proofRawJson: byId("proof-raw-json"),
  copyProofButton: byId("copy-proof-button"),
  downloadProofButton: byId("download-proof-button"),
  tamperTestButton: byId("tamper-test-button"),
  tamperTestResult: byId("tamper-test-result"),
};

const context = elements.canvas.getContext("2d", { alpha: false });

const state = {
  mode: "intro",
  status: null,
  mock: false,
  tick: 0,
  accumulator: 0,
  lastFrame: performance.now(),
  pendingPress: false,
  pressTicks: [],
  player: null,
  ghostRunner: null,
  ghost: null,
  ghostVerification: null,
  rivalDna: null,
  ghostPressSet: new Set(),
  activeRivalPressSet: new Set(),
  activeRivalKind: "signed",
  activeRivalEcho: null,
  ghostBaseline: null,
  ghostRouteBaseline: null,
  signedRouteBaseline: null,
  ghostCarrots: [],
  carrots: [],
  currentHeat: 1,
  activeHeat: 1,
  activeRouteIndex: 0,
  captureRouteId: HEAT_ROUTES[0].id,
  challengeRouteId: null,
  recordedRouteId: null,
  activeRouteRetry: false,
  activeFreeRoute: false,
  lastCompletedHeat: null,
  lastCompletedRouteIndex: null,
  routeBestTick: null,
  newMedalMask: 0,
  stats: null,
  captureIntent: false,
  restoringGhost: true,
  restoreBlocked: false,
  unmatchedRivalCount: 0,
  firstFinishTick: null,
  secondFinishTick: null,
  countdownToken: 0,
  bonkTimer: null,
  lateRabbitTimer: null,
  lateRabbitShown: false,
  tamperTestRunning: false,
  promotablePb: null,
  pendingSignKind: null,
  setupSubmitting: false,
  resultFx: null,
  worldFx: [],
  soundEnabled: loadSoundPreference(),
  audioContext: null,
  audioMaster: null,
  view: { width: 960, height: 540, virtualWidth: 960, scale: 1, dpr: 1 },
};

function setAnnouncer(message) {
  elements.announcer.textContent = message;
}

function formatTime(tick) {
  if (!Number.isFinite(tick)) return "—";
  return `${((tick * COURSE.tickMs) / 1000).toFixed(2)}s`;
}

function loadSoundPreference() {
  try {
    return localStorage.getItem(SOUND_PREFERENCE_KEY) === "on";
  } catch {
    return false;
  }
}

function audioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext || null;
}

function renderSoundToggle() {
  const available = Boolean(audioContextConstructor());
  elements.soundToggle.disabled = !available;
  elements.soundToggle.setAttribute("aria-pressed", String(available && state.soundEnabled));
  elements.soundToggle.textContent = available
    ? state.soundEnabled ? "Sound on" : "Sound off"
    : "Sound unavailable";
  elements.soundToggle.setAttribute("aria-label", "Game sounds");
}

function saveSoundPreference() {
  try {
    localStorage.setItem(SOUND_PREFERENCE_KEY, state.soundEnabled ? "on" : "muted");
  } catch {
    // Sound preference is optional; gameplay never depends on browser storage.
  }
}

function ensureAudioEngine() {
  if (!state.soundEnabled) return null;
  if (state.audioContext && state.audioMaster) {
    return { context: state.audioContext, master: state.audioMaster };
  }
  const AudioContextClass = audioContextConstructor();
  if (!AudioContextClass) return null;
  try {
    const audioContext = new AudioContextClass();
    const master = audioContext.createGain();
    master.gain.value = SOUND_MASTER_GAIN;
    master.connect(audioContext.destination);
    state.audioContext = audioContext;
    state.audioMaster = master;
    return { context: audioContext, master };
  } catch {
    return null;
  }
}

function unlockGameAudio() {
  const engine = ensureAudioEngine();
  if (!engine) return null;
  if (engine.context.state === "suspended") {
    engine.context.resume().catch(() => {});
  }
  return engine;
}

function scheduleTone(engine, frequency, offset, duration, {
  endFrequency = frequency,
  type = "triangle",
  volume = 0.36,
} = {}) {
  const start = engine.context.currentTime + offset;
  const end = start + duration;
  const oscillator = engine.context.createOscillator();
  const gain = engine.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(engine.master);
  oscillator.start(start);
  oscillator.stop(end + 0.015);
}

function playGameSound(kind, detail = 0) {
  if (!state.soundEnabled) return;
  const engine = ensureAudioEngine();
  if (!engine) return;
  const play = () => {
    if (!state.soundEnabled || engine.context.state !== "running") return;
    if (kind === "jump") {
      scheduleTone(engine, 330, 0, 0.09, { endFrequency: 510, volume: 0.3 });
    } else if (kind === "flap") {
      scheduleTone(engine, 610, 0, 0.08, { endFrequency: 790, volume: 0.24 });
    } else if (kind === "carrot") {
      scheduleTone(engine, 760 + (detail % 3) * 65, 0, 0.075, { endFrequency: 980, volume: 0.22 });
      if (detail % 3 === 0) {
        scheduleTone(engine, 520, 0.055, 0.12, { endFrequency: 1040, volume: 0.22 });
      }
    } else if (kind === "bonk") {
      scheduleTone(engine, 145, 0, 0.13, { endFrequency: 82, type: "square", volume: 0.24 });
    } else if (kind === "bounce") {
      scheduleTone(engine, 290, 0, 0.16, { endFrequency: 720, volume: 0.25 });
    } else if (kind === "boost") {
      scheduleTone(engine, 620, 0, 0.14, { endFrequency: 1240, type: "sine", volume: 0.2 });
    } else if (kind === "win") {
      [520, 660, 880].forEach((frequency, index) => {
        scheduleTone(engine, frequency, index * 0.07, 0.13, { endFrequency: frequency * 1.04, volume: 0.2 });
      });
    } else if (kind === "tie") {
      scheduleTone(engine, 610, 0, 0.12, { volume: 0.18 });
      scheduleTone(engine, 610, 0.13, 0.12, { volume: 0.18 });
    } else if (kind === "loss") {
      scheduleTone(engine, 430, 0, 0.12, { endFrequency: 350, volume: 0.18 });
      scheduleTone(engine, 330, 0.1, 0.15, { endFrequency: 220, volume: 0.16 });
    } else if (kind === "toggle") {
      scheduleTone(engine, 520, 0, 0.07, { endFrequency: 700, volume: 0.16 });
    }
  };
  if (engine.context.state === "suspended") {
    engine.context.resume().then(play).catch(() => {});
  } else {
    play();
  }
}

function setSoundEnabled(enabled) {
  state.soundEnabled = Boolean(enabled && audioContextConstructor());
  saveSoundPreference();
  renderSoundToggle();
  if (state.soundEnabled) {
    const engine = unlockGameAudio();
    if (engine) {
      const now = engine.context.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setTargetAtTime(SOUND_MASTER_GAIN, now, 0.015);
      playGameSound("toggle");
    }
    return;
  }
  if (state.audioContext && state.audioMaster) {
    const now = state.audioContext.currentTime;
    state.audioMaster.gain.cancelScheduledValues(now);
    state.audioMaster.gain.setTargetAtTime(0.0001, now, 0.012);
    window.setTimeout(() => {
      if (!state.soundEnabled && state.audioContext?.state === "running") {
        state.audioContext.suspend().catch(() => {});
      }
    }, 60);
  }
}

function fingerprintBytes(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) return null;
  return value.match(/../g).map((pair) => Number.parseInt(pair, 16));
}

function rivalDnaForGhost(ghost) {
  const fingerprint = typeof ghost?.derived_key_fingerprint === "string"
    ? ghost.derived_key_fingerprint.toLowerCase()
    : "";
  const parsed = fingerprintBytes(fingerprint);
  const bytes = parsed || Array(32).fill(0);
  const palette = RIVAL_DNA_PALETTES[bytes[0] % RIVAL_DNA_PALETTES.length];
  const patternIndex = bytes[1] % RIVAL_DNA_PATTERNS.length;
  const trailIndex = bytes[2] % RIVAL_DNA_TRAILS.length;
  const number = 10 + ((((bytes[3] << 8) | bytes[4]) >>> 0) % 90);
  const sigil = Array(25).fill(false);
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const sourceIndex = row * 3 + column;
      const on = Boolean(bytes[5 + Math.floor(sourceIndex / 8)] & (1 << (sourceIndex % 8)));
      sigil[row * 5 + column] = on;
      sigil[row * 5 + (4 - column)] = on;
    }
  }
  sigil[12] = true;
  return {
    valid: Boolean(parsed),
    fingerprint,
    shortFingerprint: parsed ? `${fingerprint.slice(0, 4)}…${fingerprint.slice(-4)}` : "unavailable",
    tag: `${palette.label}-${number}`,
    palette,
    patternIndex,
    pattern: RIVAL_DNA_PATTERNS[patternIndex],
    trailIndex,
    trail: RIVAL_DNA_TRAILS[trailIndex],
    sigil,
  };
}

function drawRivalDnaSigil(dna) {
  const canvas = elements.rivalDnaSigil;
  const sigilContext = canvas.getContext("2d", { alpha: false });
  const size = 12;
  const inset = 10;
  sigilContext.fillStyle = dna.palette.body;
  sigilContext.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < dna.sigil.length; index += 1) {
    const row = Math.floor(index / 5);
    const column = index % 5;
    sigilContext.fillStyle = dna.sigil[index] ? dna.palette.trail : "rgba(255, 255, 255, 0.48)";
    sigilContext.fillRect(inset + column * size, inset + row * size, size - 2, size - 2);
  }
  sigilContext.strokeStyle = "#344057";
  sigilContext.lineWidth = 2;
  sigilContext.strokeRect(inset - 2, inset - 2, size * 5 + 2, size * 5 + 2);
}

function renderRivalDna(ghost) {
  const dna = rivalDnaForGhost(ghost);
  state.rivalDna = dna;
  elements.rivalDnaName.textContent = dna.tag;
  elements.rivalDna.style.setProperty("--rival-dna-body", dna.palette.body);
  elements.rivalDna.style.setProperty("--rival-dna-outline", dna.palette.trail);
  elements.rivalDnaCopy.textContent = ghost.mode === "hardware"
    ? `Public cosmetic tag generated from this rival’s verified ARKG run-key fingerprint ${dna.shortFingerprint}. Same signed artifact, same look. It does not identify a person or attest a manufacturer.`
    : `Public cosmetic tag generated from this practice signer’s public-key fingerprint ${dna.shortFingerprint}. Same practice signer, same look; no hardware claim.`;
  drawRivalDnaSigil(dna);
  return dna;
}

function fingerprintSeed(fingerprint, heatIndex) {
  let seed = 0x811c9dc5;
  const source = `ghost-lap.carrot-route.v1:${fingerprint || "baseline"}:${heatIndex}`;
  for (let index = 0; index < source.length; index += 1) {
    seed ^= source.charCodeAt(index);
    seed = Math.imul(seed, 0x01000193);
  }
  return seed >>> 0;
}

function routeIndexForSignedCourse(courseId) {
  return HEAT_ROUTES.findIndex((route) => route.id === courseId);
}

function signedRouteIndex(ghost = state.ghost) {
  const routeIndex = routeIndexForSignedCourse(ghost?.replay?.course_id);
  return routeIndex >= 0 ? routeIndex : 0;
}

function routeIndexForHeat(heatIndex, fingerprint, captureRouteIndex = 0) {
  const firstRoute = HEAT_ROUTES[captureRouteIndex] ? captureRouteIndex : 0;
  if (heatIndex === 1) return firstRoute;
  const remainingRoutes = HEAT_ROUTES
    .map((_, index) => index)
    .filter((index) => index !== firstRoute);
  const firstOffset = fingerprintSeed(fingerprint, 0) % remainingRoutes.length;
  return remainingRoutes[(firstOffset + heatIndex - 2) % remainingRoutes.length];
}

function routeForHeat(heatIndex, fingerprint, captureRouteIndex = 0) {
  return HEAT_ROUTES[routeIndexForHeat(heatIndex, fingerprint, captureRouteIndex)];
}

function activeRoute() {
  return HEAT_ROUTES[state.activeRouteIndex] || HEAT_ROUTES[0];
}

function selectedCaptureRoute() {
  return HEAT_ROUTES.find((route) => route.id === state.captureRouteId) || HEAT_ROUTES[0];
}

function hasCompleteTrailBook() {
  return Boolean(
    state.stats &&
    Object.keys(state.stats.bestByRoute || {}).length >= HEAT_ROUTES.length
  );
}

function normalizeRouteMedals(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const knownIds = new Set(HEAT_ROUTES.map((route) => route.id));
  const normalized = {};
  for (const [routeId, mask] of Object.entries(value)) {
    if (knownIds.has(routeId) && Number.isInteger(mask) && mask > 0 && mask <= MEDAL_ALL) {
      normalized[routeId] = mask;
    }
  }
  return normalized;
}

function routeMedalMask(route) {
  const mask = state.stats?.medalsByRoute?.[routeBestKey(route)];
  return Number.isInteger(mask) && mask > 0 && mask <= MEDAL_ALL ? mask : 0;
}

function bitCount(value) {
  let count = 0;
  for (let bit = value; bit > 0; bit >>= 1) count += bit & 1;
  return count;
}

function totalMedals() {
  return HEAT_ROUTES.reduce((total, route) => total + bitCount(routeMedalMask(route)), 0);
}

function renderRouteMedals(route, { visible = true } = {}) {
  elements.captureRouteMedals.hidden = !visible;
  if (!visible) return;
  const mask = routeMedalMask(route);
  const earned = (bit) => mask & bit ? "●" : "○";
  elements.captureRouteMedals.textContent = `Medals · ${earned(MEDAL_RIVAL)} Rival · ${earned(MEDAL_CARROTS)} Carrots · ${earned(MEDAL_CLEAN)} Clean`;
  elements.captureRouteMedals.setAttribute(
    "aria-label",
    `${bitCount(mask)} of 3 medals earned on ${route.name}: ` +
    `${mask & MEDAL_RIVAL ? "rival earned" : "rival not earned"}, ` +
    `${mask & MEDAL_CARROTS ? "all carrots earned" : "all carrots not earned"}, ` +
    `${mask & MEDAL_CLEAN ? "clean run earned" : "clean run not earned"}.`,
  );
}

function renderFinishMedals(mask, newMask) {
  const medals = [
    [elements.medalRival, MEDAL_RIVAL],
    [elements.medalCarrots, MEDAL_CARROTS],
    [elements.medalClean, MEDAL_CLEAN],
  ];
  elements.medalRow.hidden = false;
  for (const [element, bit] of medals) {
    const earned = Boolean(mask & bit);
    element.classList.toggle("is-earned", earned);
    element.classList.toggle("is-new", Boolean(newMask & bit));
    element.querySelector("b").textContent = earned ? "●" : "○";
  }
  const newCount = bitCount(newMask);
  elements.medalRow.setAttribute(
    "aria-label",
    `${bitCount(mask)} of 3 trail medals earned${newCount ? `; ${newCount} earned on this run` : ""}.`,
  );
}

function medalNames(mask) {
  const names = [];
  if (mask & MEDAL_RIVAL) names.push("Rival");
  if (mask & MEDAL_CARROTS) names.push("All carrots");
  if (mask & MEDAL_CLEAN) names.push("Clean run");
  return names;
}

function routeBestKey(route) {
  return route.id;
}

function carrotsForRoute(route, capture = false) {
  const carrotPatterns = capture ? CARROT_PATTERNS : CHALLENGE_CARROT_PATTERNS;
  const carrots = [];
  CARROT_ZONES.forEach((center, zoneIndex) => {
    carrotPatterns[route.patterns[zoneIndex]].forEach(([offsetX, height], carrotIndex) => {
      carrots.push({
        id: `${zoneIndex}-${carrotIndex}`,
        x: center + offsetX,
        y: height,
      });
    });
  });
  return carrots;
}

function defaultStats() {
  return {
    nextHeat: 1,
    races: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    bestFinishTick: null,
    bestByRoute: {},
    echoByRoute: {},
    medalsByRoute: {},
  };
}

function normalizeRouteBests(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const knownIds = new Set(HEAT_ROUTES.map((route) => route.id));
  const normalized = {};
  for (const [key, tick] of Object.entries(value)) {
    if (!Number.isInteger(tick) || tick <= 0) continue;
    if (knownIds.has(key)) normalized[key] = tick;
  }
  return normalized;
}

function normalizeRouteEchoes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const knownIds = new Set(HEAT_ROUTES.map((route) => route.id));
  const normalized = {};
  for (const [routeId, echo] of Object.entries(value)) {
    if (!knownIds.has(routeId) || !echo || typeof echo !== "object" || Array.isArray(echo)) {
      continue;
    }
    if (
      echo.physicsVersion !== COURSE.physicsVersion ||
      !Number.isInteger(echo.finishTick) || echo.finishTick <= 0 || echo.finishTick > 3000 ||
      !Array.isArray(echo.pressTicks) || echo.pressTicks.length > 256
    ) {
      continue;
    }
    let previous = 0;
    const validTicks = echo.pressTicks.every((tick) => {
      const valid = Number.isInteger(tick) && tick > previous && tick < echo.finishTick;
      previous = tick;
      return valid;
    });
    if (!validTicks) continue;
    normalized[routeId] = {
      physicsVersion: COURSE.physicsVersion,
      finishTick: echo.finishTick,
      pressTicks: [...echo.pressTicks],
    };
  }
  return normalized;
}

function statsKey(ghost) {
  const runId = ghost && typeof ghost.run_id === "string" ? ghost.run_id.trim() : "";
  if (runId) return `${STATS_KEY_PREFIX}run:${runId}`;
  return `${STATS_KEY_PREFIX}${ghost?.derived_key_fingerprint || "unknown"}`;
}

function parseStats(raw) {
  try {
    const parsed = JSON.parse(raw || "null");
    if (
      parsed &&
      Number.isInteger(parsed.nextHeat) && parsed.nextHeat >= 1 &&
      Number.isInteger(parsed.races) && parsed.races >= 0 &&
      Number.isInteger(parsed.wins) && parsed.wins >= 0 &&
      Number.isInteger(parsed.currentStreak) && parsed.currentStreak >= 0 &&
      Number.isInteger(parsed.bestStreak) && parsed.bestStreak >= 0 &&
      (parsed.bestFinishTick === null || (Number.isInteger(parsed.bestFinishTick) && parsed.bestFinishTick > 0))
    ) {
      return {
        nextHeat: parsed.nextHeat,
        races: parsed.races,
        wins: parsed.wins,
        currentStreak: parsed.currentStreak,
        bestStreak: parsed.bestStreak,
        bestFinishTick: parsed.bestFinishTick,
        bestByRoute: normalizeRouteBests(parsed.bestByRoute),
        echoByRoute: normalizeRouteEchoes(parsed.echoByRoute),
        medalsByRoute: normalizeRouteMedals(parsed.medalsByRoute),
      };
    }
  } catch {
    // A damaged local score is disposable; the verified ghost is checked separately.
  }
  return null;
}

function readStats(key) {
  try {
    return parseStats(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function loadStats(ghost) {
  const currentKey = statsKey(ghost);
  const current = readStats(currentKey);
  if (current) return current;
  return defaultStats();
}

function saveStats() {
  if (!state.ghost || !state.stats) return;
  try {
    localStorage.setItem(statsKey(state.ghost), JSON.stringify(state.stats));
  } catch {
    // The game still works if private browsing refuses local score storage.
  }
}

function storedRivalSlot(ghost) {
  const mode = ghost && typeof ghost.mode === "string" ? ghost.mode : "";
  const fingerprint = ghost && typeof ghost.identity_fingerprint === "string"
    ? ghost.identity_fingerprint.toLowerCase()
    : "";
  if (!/^(hardware|mock)$/.test(mode) || !/^[0-9a-f]{64}$/.test(fingerprint)) {
    return null;
  }
  return `${mode}:${fingerprint}`;
}

function parseStoredRival(raw) {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_RIVAL_FILE_BYTES) {
    return null;
  }
  try {
    const ghost = JSON.parse(raw);
    return ghost && typeof ghost === "object" && !Array.isArray(ghost) ? ghost : null;
  } catch {
    return null;
  }
}

function readRivalSlotIds() {
  const ordered = [];
  const seen = new Set();
  const remember = (slot) => {
    if (typeof slot !== "string" || !/^(hardware|mock):[0-9a-f]{64}$/.test(slot)) return;
    if (!seen.has(slot)) {
      seen.add(slot);
      ordered.push(slot);
    }
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_RIVAL_INDEX_KEY) || "[]");
    if (Array.isArray(parsed)) parsed.forEach(remember);
  } catch {
    try {
      localStorage.removeItem(SAVED_RIVAL_INDEX_KEY);
    } catch {
      // A malformed index cannot make startup fail when storage is blocked.
    }
  }
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(SAVED_RIVAL_SLOT_PREFIX)) {
        remember(key.slice(SAVED_RIVAL_SLOT_PREFIX.length));
      }
    }
  } catch {
    // Indexed slots remain best-effort when browser storage is unavailable.
  }
  return ordered;
}

function storedRivalCandidates() {
  const candidates = [];
  const seen = new Set();
  const remember = (ghost, slot = storedRivalSlot(ghost)) => {
    if (!ghost || !slot) return;
    const run = typeof ghost.run_id === "string" ? ghost.run_id : "";
    const key = `${slot}:${run}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ ghost, slot });
  };
  try {
    for (const slot of readRivalSlotIds()) {
      const raw = localStorage.getItem(`${SAVED_RIVAL_SLOT_PREFIX}${slot}`);
      const ghost = parseStoredRival(raw);
      if (ghost && storedRivalSlot(ghost) === slot) remember(ghost, slot);
    }
  } catch {
    return [];
  }
  return candidates.slice(0, MAX_SAVED_RIVALS);
}

function storeGhostInVault(ghost) {
  try {
    const slot = storedRivalSlot(ghost);
    const serialized = JSON.stringify(ghost);
    if (!slot || serialized.length > MAX_RIVAL_FILE_BYTES) return;
    localStorage.setItem(`${SAVED_RIVAL_SLOT_PREFIX}${slot}`, serialized);
    const ordered = [slot, ...readRivalSlotIds().filter((candidate) => candidate !== slot)];
    const kept = ordered.slice(0, MAX_SAVED_RIVALS);
    for (const evicted of ordered.slice(MAX_SAVED_RIVALS)) {
      localStorage.removeItem(`${SAVED_RIVAL_SLOT_PREFIX}${evicted}`);
    }
    localStorage.setItem(SAVED_RIVAL_INDEX_KEY, JSON.stringify(kept));
  } catch {
    // The in-memory rival remains playable for this tab.
  }
}

function saveGhost(ghost) {
  storeGhostInVault(ghost);
}

function rivalJson(ghost = state.ghost) {
  return ghost ? `${JSON.stringify(ghost, null, 2)}\n` : "";
}

function rivalFilename(ghost = state.ghost) {
  const route = HEAT_ROUTES[signedRouteIndex(ghost)];
  const routeName = (route?.name || "rival").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const run = typeof ghost?.run_id === "string" ? ghost.run_id.slice(0, 8) : "proof";
  return `ghost-lap-${routeName}-${run}.json`;
}

function downloadRival(ghost = state.ghost) {
  if (!ghost) return false;
  const url = URL.createObjectURL(new Blob([rivalJson(ghost)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = rivalFilename(ghost);
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

async function copyText(value) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through for browsers that expose the API but deny this call.
    }
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

async function copyRivalProof(ghost = state.ghost) {
  if (!ghost) return false;
  return copyText(rivalJson(ghost));
}

function setRivalFileStatus(message, { error = false } = {}) {
  elements.rivalFileStatus.hidden = !message;
  elements.rivalFileStatus.textContent = message;
  elements.rivalFileStatus.classList.toggle("is-error", error);
}

function syncRivalFileTools() {
  const hasRival = Boolean(state.ghost);
  elements.exportRivalButton.disabled = !hasRival;
  elements.forgetRivalButton.disabled = !hasRival;
  elements.downloadProofButton.disabled = !hasRival;
  elements.copyProofButton.disabled = !hasRival;
}

async function importRivalFile(file) {
  if (!file) return;
  if (["countdown", "lap1", "lap2", "signing", "flourish"].includes(state.mode)) {
    setRivalFileStatus("Finish the current run before importing a rival.", { error: true });
    return;
  }
  if (file.size > MAX_RIVAL_FILE_BYTES) {
    setRivalFileStatus("That file is too large to be a Ghost Lap rival.", { error: true });
    return;
  }

  elements.importRivalButton.disabled = true;
  setRivalFileStatus("Checking the imported proof locally…");
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
      throw new Error("The file does not contain a rival artifact.");
    }
    const verification = await api(API.verifyGhost, {
      method: "POST",
      body: { ghost: imported },
    });
    const verified = validatedGhost(imported, verification);
    installGhost(verified, { persist: true, verification });
    state.mode = "intro";
    state.restoreBlocked = false;
    state.restoringGhost = false;
    state.player = makeRunner("player");
    state.ghostRunner = null;
    elements.gameHud.hidden = true;
    renderIntroState();
    if (state.status) renderSetup(statusFacts(state.status));
    setPanel(elements.introPanel);
    render();
    const route = HEAT_ROUTES[signedRouteIndex(verified)];
    setRivalFileStatus(`${route.name} rival verified and imported. No YubiKey contact.`);
    setAnnouncer(`Imported rival verified. Heat ${state.currentHeat} is ready without a touch.`);
  } catch (error) {
    setRivalFileStatus(`Import rejected: ${error.message}`, { error: true });
    setAnnouncer("The imported rival was rejected. Your saved rival is unchanged.");
  } finally {
    elements.importRivalButton.disabled = false;
    syncRivalFileTools();
  }
}

function removeSavedGhost(ghost = null) {
  try {
    if (!ghost) {
      return;
    }
    const slot = storedRivalSlot(ghost);
    if (slot) {
      localStorage.removeItem(`${SAVED_RIVAL_SLOT_PREFIX}${slot}`);
      const kept = readRivalSlotIds().filter((candidate) => candidate !== slot);
      localStorage.setItem(SAVED_RIVAL_INDEX_KEY, JSON.stringify(kept.slice(0, MAX_SAVED_RIVALS)));
    }
  } catch {
    // Storage can be blocked entirely; removal must never break startup.
  }
}

function forgetBrowserRival() {
  if (!state.ghost) return;
  if (["countdown", "lap1", "lap2", "signing", "flourish"].includes(state.mode)) {
    setRivalFileStatus("Finish the current run before forgetting this rival.", { error: true });
    return;
  }
  const confirmed = window.confirm(
    "Forget this browser profile’s saved rival, public proof, scores, and PBs? " +
    "This does not change the key or the local broker enrollment.",
  );
  if (!confirmed) return;

  const forgotten = state.ghost;
  removeSavedGhost(forgotten);
  try {
    localStorage.removeItem(statsKey(forgotten));
    if (forgotten.derived_key_fingerprint) {
      localStorage.removeItem(`${STATS_KEY_PREFIX}${forgotten.derived_key_fingerprint}`);
    }
  } catch {
    // In-memory cleanup still completes if browser storage is unavailable.
  }
  state.ghost = null;
  state.ghostVerification = null;
  state.rivalDna = null;
  state.ghostPressSet = new Set();
  state.activeRivalPressSet = new Set();
  state.activeRivalKind = "signed";
  state.activeRivalEcho = null;
  state.ghostBaseline = null;
  state.ghostRouteBaseline = null;
  state.signedRouteBaseline = null;
  state.ghostCarrots = [];
  state.stats = null;
  state.currentHeat = 1;
  state.activeHeat = 1;
  state.lastCompletedHeat = null;
  state.lastCompletedRouteIndex = null;
  state.challengeRouteId = null;
  state.activeFreeRoute = false;
  state.promotablePb = null;
  state.captureIntent = false;
  state.restoreBlocked = false;
  state.unmatchedRivalCount = storedRivalCandidates().length;
  state.recordedRouteId = null;
  state.mode = "intro";
  state.player = makeRunner("player");
  state.ghostRunner = null;
  elements.gameHud.hidden = true;
  elements.keyStory.hidden = true;
  elements.proofRawJson.textContent = "—";
  renderIntroState();
  if (state.status) renderSetup(statusFacts(state.status));
  setPanel(elements.introPanel);
  syncRivalFileTools();
  render();
  setRivalFileStatus(
    "This browser forgot the rival, public proof, scores, and PBs. The key and broker enrollment were untouched.",
  );
  setAnnouncer("Browser rival forgotten. You can capture a new one with the enrolled key.");
  elements.startButton.focus({ preventScroll: true });
}

function errorMessage(payload, fallback = "Something went wrong.") {
  const detail = payload && payload.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail.message === "string") return detail.message;
  if (payload && typeof payload.message === "string") return payload.message;
  return fallback;
}

async function api(path, { method = "GET", body } = {}) {
  const options = {
    method,
    cache: "no-store",
    headers: { Accept: "application/json", "X-Ghost-Lap-Request": "1" },
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.headers["X-Ghost-Lap-Request"] = "1";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Request failed (${response.status}).`));
  }
  return payload;
}

function setPanel(panel) {
  elements.canvasWrap.classList.toggle(
    "has-result-panel",
    panel === elements.finishPanel,
  );
  for (const candidate of [
    elements.introPanel,
    elements.signPanel,
    elements.ceremonyPanel,
    elements.finishPanel,
  ]) {
    candidate.hidden = candidate !== panel;
  }
}

function isHardwareReady() {
  return Boolean(state.status && state.status.ready);
}

function renderIntroState() {
  elements.captureRoutePicker.hidden = true;
  elements.captureRouteMedals.hidden = true;
  if (state.restoringGhost) {
    elements.introKicker.textContent = "Saved rival · checking";
    elements.introTitle.textContent = "Checking for your saved rival…";
    elements.introCopy.textContent = "Ghost Lap is verifying this browser profile before it offers a new capture.";
    elements.startButton.disabled = true;
    elements.startButton.textContent = "Checking saved rival…";
    elements.startNote.textContent = "A saved rival is never replaced while verification is pending.";
    return;
  }
  if (state.restoreBlocked) {
    elements.introKicker.textContent = "Saved rival · verification paused";
    elements.introTitle.textContent = "Your saved rival is still here.";
    elements.introCopy.textContent = "Ghost Lap could not verify it yet. Press Refresh when the local server is ready.";
    elements.startButton.disabled = true;
    elements.startButton.textContent = "Refresh to verify rival";
    elements.startNote.textContent = "The browser copy is untouched and cannot be replaced from this screen.";
    return;
  }
  const savedRival = Boolean(state.ghost && !state.captureIntent);
  if (savedRival) {
    const heat = state.stats ? state.stats.nextHeat : 1;
    const fingerprint = state.ghost.derived_key_fingerprint;
    const scheduledRouteIndex = routeIndexForHeat(heat, fingerprint, signedRouteIndex());
    const selectedChallengeIndex = hasCompleteTrailBook()
      ? routeIndexForSignedCourse(state.challengeRouteId)
      : -1;
    const routeIndex = selectedChallengeIndex >= 0
      ? selectedChallengeIndex
      : scheduledRouteIndex;
    const isChosenTrail = selectedChallengeIndex >= 0;
    const route = HEAT_ROUTES[routeIndex];
    const scheduledRoute = HEAT_ROUTES[scheduledRouteIndex];
    state.activeRouteIndex = routeIndex;
    const routeBest = state.stats && state.stats.bestByRoute
      ? state.stats.bestByRoute[routeBestKey(route)]
      : null;
    const routeCarrots = carrotsForRoute(route, routeIndex === signedRouteIndex());
    const routeEcho = verifiedRouteEcho(route, routeCarrots);
    elements.introKicker.textContent = isChosenTrail
      ? `Chosen trail · Heat ${heat} waits`
      : `Heat ${heat} · ${route.direction < 0 ? "←" : "→"} ${route.name}`;
    elements.introTitle.textContent = routeEcho
      ? "Your PB echo is ready."
      : `${state.rivalDna?.tag || "Your signed rival"} is ready.`;
    elements.introCopy.textContent = `${isChosenTrail ? "Chosen trail" : `Heat ${heat}`}: ${route.direction < 0 ? "←" : "→"} ${route.name}. ${routeBest ? `Route PB ${formatTime(routeBest)}.` : "No route PB yet."} ${route.hint}`;
    elements.startButton.disabled = false;
    elements.captureRoutePicker.hidden = !hasCompleteTrailBook();
    elements.captureRoutePicker.setAttribute("aria-label", "Choose a trail to race without advancing the scheduled heat");
    elements.captureRouteCount.textContent = `${routeIndex + 1} / ${HEAT_ROUTES.length}`;
    elements.captureRouteDirection.textContent = route.direction < 0 ? "←" : "→";
    elements.captureRouteName.textContent = route.name;
    elements.captureRouteHint.textContent = route.hint;
    renderRouteMedals(route);
    elements.startButton.textContent = isChosenTrail ? `Race ${route.name}` : `Start heat ${heat}`;
    const rivalNote = routeEcho
      ? `Race the exact inputs from your ${formatTime(routeEcho.finishTick)} local PB. It is unsigned; the signed rival remains the secondary check. No PIN or touch.`
      : "Same signed input tape. New route. No PIN or touch.";
    elements.startNote.textContent = isChosenTrail
      ? `Heat ${heat} · ${scheduledRoute.direction < 0 ? "←" : "→"} ${scheduledRoute.name} stays waiting. ${rivalNote}`
      : rivalNote;
    return;
  }
  const route = selectedCaptureRoute();
  const routeIndex = HEAT_ROUTES.indexOf(route);
  state.activeRouteIndex = routeIndex;
  if (!isHardwareReady()) {
    elements.introKicker.textContent = state.mock ? "Software practice · one quick setup" : "Before the first lap";
    elements.introTitle.textContent = state.mock ? "Set up practice mode." : "Get the key ready.";
    elements.introCopy.textContent = state.mock
      ? "Create a local software-only identity, then come back to choose a trail. No USB key will be contacted."
      : "Finish the safe setup step below, then come back to choose a trail and record your rival.";
    elements.startButton.disabled = false;
    elements.startButton.textContent = state.mock ? "Set up practice mode" : "Set up key";
    elements.startNote.textContent = "This button takes you directly to the required setup step.";
    if (state.unmatchedRivalCount > 0) {
      const plural = state.unmatchedRivalCount === 1 ? "rival" : "rivals";
      const remain = state.unmatchedRivalCount === 1 ? "remains" : "remain";
      elements.startNote.textContent += ` ${state.unmatchedRivalCount} saved ${plural} for another local signer ${remain} untouched.`;
    }
    return;
  }
  elements.introKicker.textContent = "Pick a trail · about 20 seconds";
  elements.introTitle.textContent = "Leave a trail worth chasing.";
  elements.introCopy.textContent = state.mock
    ? "Choose where to make a practice rival. Run once, then seal it with the local software signer."
    : "Choose where to make your rival. Run once, then touch the connected key to sign the replay digest.";
  elements.captureRoutePicker.hidden = false;
  elements.captureRoutePicker.setAttribute("aria-label", "Choose a capture trail");
  elements.captureRouteCount.textContent = `${routeIndex + 1} / ${HEAT_ROUTES.length}`;
  elements.captureRouteDirection.textContent = route.direction < 0 ? "←" : "→";
  elements.captureRouteName.textContent = route.name;
  elements.captureRouteHint.textContent = route.hint;
  renderRouteMedals(route, { visible: false });
  elements.startButton.disabled = !isHardwareReady();
  elements.startButton.textContent = isHardwareReady()
    ? `Capture ${route.name}`
    : "Waiting for the key…";
  elements.startNote.textContent = state.mock
    ? "Practice mode uses software signing. No physical-key claim is made."
    : isHardwareReady()
      ? "One touch after the lap. The replay goes only to this device’s local broker."
      : "The capture starts when one compatible key is ready.";
  if (state.unmatchedRivalCount > 0) {
    const plural = state.unmatchedRivalCount === 1 ? "rival" : "rivals";
    const verb = state.unmatchedRivalCount === 1 ? "belongs" : "belong";
    const remain = state.unmatchedRivalCount === 1 ? "remains" : "remain";
    elements.startNote.textContent += ` ${state.unmatchedRivalCount} saved ${plural} ${verb} to another local signer and ${remain} untouched.`;
  }
}

function moveCaptureRoute(offset) {
  if (elements.captureRoutePicker.hidden) return;
  const choosingChallenge = Boolean(
    state.ghost && !state.captureIntent && hasCompleteTrailBook()
  );
  const currentIndex = choosingChallenge
    ? state.activeRouteIndex
    : Math.max(0, routeIndexForSignedCourse(state.captureRouteId));
  const nextIndex = (currentIndex + offset + HEAT_ROUTES.length) % HEAT_ROUTES.length;
  const route = HEAT_ROUTES[nextIndex];
  if (choosingChallenge) state.challengeRouteId = route.id;
  else state.captureRouteId = route.id;
  state.activeRouteIndex = nextIndex;
  state.player = makeRunner("player");
  renderIntroState();
  render();
  setAnnouncer(`${route.name} selected. ${route.hint}`);
}

function statusFacts(status) {
  const hardware = status && status.hardware ? status.hardware : {};
  const pin = status && status.pin ? status.pin : hardware.pin || {};
  return {
    hardware,
    pin,
    connected: Boolean(hardware.connected),
    pinConfigured: Boolean(pin.configured),
    pinMinimumLength: Number.isInteger(pin.minimum_length) ? pin.minimum_length : 4,
    pinMaximumLength: Number.isInteger(pin.maximum_length) ? pin.maximum_length : 63,
    previewSign: Boolean(hardware.capabilities && hardware.capabilities.preview_sign),
    fido23: Boolean(hardware.capabilities && hardware.capabilities.ctap_2_3),
    enrolled: Boolean(status && status.enrolled),
    ready: Boolean(status && status.ready),
    initialPinSetupEnabled: Boolean(
      status && status.security && status.security.initial_pin_setup_enabled,
    ),
    mode: status && status.mode ? status.mode : "hardware",
    mock: Boolean(status && (status.mock || status.mode === "mock")),
  };
}

function connectedDeviceLabel(hardware = {}) {
  const product = hardware.product_name || "USB FIDO authenticator";
  const firmware = hardware.firmware_version
    ? `, firmware ${hardware.firmware_version}`
    : ", firmware not reported";
  return `${product}${firmware}`;
}

function reportedDeviceDescription(hardware = {}) {
  return `${connectedDeviceLabel(hardware)} (device-reported; manufacturer/model not attested by Ghost Lap)`;
}

function renderStatus(status) {
  const facts = statusFacts(status);
  state.mock = facts.mock;
  elements.mockBanner.hidden = !facts.mock;
  elements.deviceChip.className = "device-chip";

  if (facts.mock) {
    elements.deviceChip.classList.add(facts.ready ? "is-mock" : "is-error");
    elements.deviceChipText.textContent = facts.ready
      ? "Software practice ghost ready"
      : "Software practice setup needed";
  } else if (facts.ready) {
    elements.deviceChip.classList.add("is-ready");
    const firmware = facts.hardware.firmware_version
      ? ` ${facts.hardware.firmware_version}`
      : "";
    elements.deviceChipText.textContent = `Compatible key${firmware} · previewSign ready`;
  } else {
    elements.deviceChip.classList.add("is-error");
    elements.deviceChipText.textContent = facts.connected
      ? "Connected key needs setup"
      : "Connect one compatible USB key";
  }

  if (state.mode === "intro") renderIntroState();
  renderSetup(facts);
}

function renderSetup(facts) {
  elements.pinGuide.hidden = true;
  elements.pinForm.hidden = true;
  elements.enrollForm.hidden = true;
  elements.setupCard.hidden = facts.ready || Boolean(state.ghost && !state.captureIntent);
  if (elements.setupCard.hidden) return;

  if (!facts.connected) {
    const multipleKeys = facts.hardware.error?.code === "MULTIPLE_AUTHENTICATORS";
    elements.setupTitle.textContent = facts.mock
      ? "Start practice mode"
      : multipleKeys
        ? "Leave only the intended key connected"
        : "Plug in your key";
    elements.setupDescription.textContent = facts.mock
      ? "The software signer is unavailable. Refresh once the local server is ready."
      : multipleKeys
        ? "Ghost Lap found multiple USB FIDO authenticators and refuses to choose one. Disconnect every key except the intended key, then press Refresh."
        : "Ghost Lap auto-discovers USB FIDO authenticators. Connect exactly one intended FIDO 2.3 + previewSign key, then press Refresh.";
    return;
  }

  const deviceDescription = connectedDeviceLabel(facts.hardware);

  if (!facts.mock && (!facts.fido23 || !facts.previewSign)) {
    elements.setupTitle.textContent = "This key cannot make Ghost Lap ghosts";
    elements.setupDescription.textContent = `Connected: ${deviceDescription}. Ghost Lap requires FIDO 2.3 and previewSign, and this device does not advertise both.`;
    return;
  }

  if (!facts.pinConfigured) {
    const pinRange = `${facts.pinMinimumLength}–${facts.pinMaximumLength} characters`;
    elements.initialPinLabel.textContent = facts.mock
      ? `Choose a practice PIN (${pinRange})`
      : `Choose a FIDO PIN (${pinRange})`;
    elements.initialPin.minLength = facts.pinMinimumLength;
    elements.initialPin.maxLength = facts.pinMaximumLength;
    elements.initialPinConfirm.minLength = facts.pinMinimumLength;
    elements.initialPinConfirm.maxLength = facts.pinMaximumLength;
    elements.initialPinSubmit.textContent = facts.mock ? "Set practice PIN" : "Set PIN on this key";
    elements.pinSetupNote.textContent = facts.mock
      ? "This protects only the local software practice key. It does not configure a USB authenticator, and Ghost Lap never stores the PIN."
      : "Ghost Lap never stores either entry. Forgetting this PIN may require a FIDO reset, which erases FIDO credentials.";
    elements.setupTitle.textContent = facts.mock
      ? "Create the software practice key"
      : facts.initialPinSetupEnabled
        ? "PIN setup mode is on"
        : "This key needs a FIDO PIN";
    elements.setupDescription.textContent = facts.mock
      ? "Practice mode keeps clearly labeled software-only key material in this local data directory. No USB key is contacted."
      : facts.initialPinSetupEnabled
        ? `Connected: ${deviceDescription}. Check the physical key, then set its first FIDO PIN below.`
        : `Connected: ${deviceDescription}. Ghost Lap keeps initial FIDO PIN setup off during normal play.`;
    elements.pinGuide.hidden = facts.mock || facts.initialPinSetupEnabled;
    elements.pinForm.hidden = !facts.initialPinSetupEnabled;
    return;
  }

  if (!facts.enrolled) {
    elements.enrollLabel.textContent = facts.mock
      ? "Create the Ghost Lap practice identity"
      : "Enroll this key for Ghost Lap";
    elements.enrollNote.textContent = facts.mock
      ? "This creates software-only signing material in the local practice data directory. It never contacts a physical authenticator."
      : "This asks the connected authenticator to create WebAuthn and previewSign key material. Ghost Lap keeps the public enrollment data locally. The PIN is never stored.";
    elements.setupTitle.textContent = facts.mock
      ? "Create a practice identity"
      : "Teach Ghost Lap this key";
    elements.setupDescription.textContent = facts.mock
      ? "Create the clearly labeled software practice identity."
      : `Connected: ${deviceDescription}. Leave only this intended key connected. Enrollment adds one FIDO credential; it does not reset the key or delete credentials.`;
    elements.enrollForm.hidden = false;
    return;
  }

  elements.setupTitle.textContent = "The saved identity does not match";
  elements.setupDescription.textContent = "Start the matching hardware or practice data directory, then refresh.";
}

async function loadStatus() {
  const shouldRestore = state.mode === "intro" && !state.ghost;
  if (shouldRestore) {
    state.restoringGhost = true;
    renderIntroState();
  }
  elements.deviceChip.className = "device-chip is-checking";
  elements.deviceChipText.textContent = state.mock
    ? "Checking the practice signer…"
    : "Looking for your key…";
  try {
    state.status = await api(API.status);
    renderStatus(state.status);
    const restored = shouldRestore ? await restoreSavedGhost() : false;
    if (shouldRestore) {
      state.restoringGhost = false;
      renderIntroState();
      renderSetup(statusFacts(state.status));
    }
    if (state.mode === "intro") {
      if (!restored && !state.restoreBlocked) {
        setAnnouncer(state.status.ready ? "The meadow is ready." : "The key needs attention before the first lap.");
      }
    }
  } catch (error) {
    state.restoringGhost = false;
    state.status = null;
    elements.deviceChip.className = "device-chip is-error";
    elements.deviceChipText.textContent = "Local game server unavailable";
    if (state.ghost && !state.captureIntent) {
      renderIntroState();
      elements.setupCard.hidden = true;
    } else {
      elements.startButton.disabled = true;
      elements.startButton.textContent = state.restoreBlocked
        ? "Refresh to verify rival"
        : "Waiting for the game server…";
      elements.setupCard.hidden = false;
      elements.setupTitle.textContent = "Start the local game server";
      elements.setupDescription.textContent = error.message;
      elements.pinForm.hidden = true;
      elements.enrollForm.hidden = true;
    }
    setAnnouncer("The local game server could not be reached.");
  }
}

function makeRunner(kind = "player") {
  return {
    kind,
    x: 110,
    y: 0,
    velocityY: 0,
    onGround: true,
    airTicks: 0,
    flapAvailable: true,
    flapFlashTicks: 0,
    chompTicks: 0,
    stumbleTicks: 0,
    burstTicks: 0,
    burstCount: 0,
    carrotCount: 0,
    harmfulHitCount: 0,
    collectedCarrots: new Set(),
    hitObstacles: new Set(),
    finished: false,
    finishTick: null,
  };
}

function tryPress(runner) {
  if (!runner || runner.finished || runner.stumbleTicks > 8) return null;
  if (runner.onGround) {
    runner.velocityY = 12.2;
    runner.onGround = false;
    runner.airTicks = 0;
    runner.flapAvailable = true;
    return "jump";
  }
  if (runner.flapAvailable && runner.airTicks >= 4) {
    runner.velocityY = Math.max(runner.velocityY, 8.4);
    runner.flapAvailable = false;
    runner.flapFlashTicks = 10;
    return "flap";
  }
  return null;
}

function runnerHits(runner, obstacle) {
  const runnerFront = runner.x + COURSE.runnerWidth;
  const runnerBack = runner.x + 5;
  const horizontal = runnerFront >= obstacle.x && runnerBack <= obstacle.x + obstacle.width;
  return horizontal && runner.y < obstacle.height - 4;
}

function showBonk(runner, label = "bonk!") {
  const screenX = projectWorldX(runner.x + COURSE.runnerWidth / 2, cameraPosition());
  const left = Math.max(8, Math.min(88, (screenX / state.view.virtualWidth) * 100));
  const top = Math.max(18, Math.min(76, ((COURSE.groundY - runner.y - 105) / 540) * 100));
  elements.bonk.textContent = label;
  elements.bonk.style.left = `${left}%`;
  elements.bonk.style.top = `${top}%`;
  elements.bonk.hidden = false;
  if (state.bonkTimer) window.clearTimeout(state.bonkTimer);
  state.bonkTimer = window.setTimeout(() => {
    elements.bonk.hidden = true;
  }, reducedMotion ? 350 : 700);
}

function hideLateRabbit() {
  if (state.lateRabbitTimer) window.clearTimeout(state.lateRabbitTimer);
  state.lateRabbitTimer = null;
  elements.lateRabbit.hidden = true;
}

function maybeShowLateRabbit() {
  if (state.lateRabbitShown || Math.random() >= 0.125) return;
  state.lateRabbitShown = true;
  elements.lateRabbit.classList.toggle("is-left", activeRoute().direction < 0);
  elements.lateRabbit.hidden = false;
  state.lateRabbitTimer = window.setTimeout(
    hideLateRabbit,
    reducedMotion ? 850 : 1150,
  );
}

function popCarrotHud() {
  elements.carrotCount.classList.remove("is-pop");
  void elements.carrotCount.offsetWidth;
  elements.carrotCount.classList.add("is-pop");
}

function updateBoostHud(runner) {
  const bursting = runner.burstTicks > 0;
  const charge = runner.carrotCount % 3;
  const ratio = bursting ? runner.burstTicks / COURSE.burstTicks : charge / 3;
  elements.burstLabel.textContent = bursting ? "BOOST!" : `Boost ${charge}/3`;
  elements.burstFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  elements.burstPill.classList.toggle("is-live", bursting);
}

function spawnWorldFx(kind, x, y) {
  if (reducedMotion) return;
  if (kind === "ring") {
    state.worldFx.push({ kind, x, y, age: 0, life: 16 });
    return;
  }
  const count = kind === "carrot" ? 6 : 9;
  for (let index = 0; index < count; index += 1) {
    const spread = (index / Math.max(1, count - 1)) * 2 - 1;
    state.worldFx.push({
      kind,
      x,
      y,
      vx: spread * (kind === "carrot" ? 2.4 : 1.8),
      vy: 1.4 + ((index * 7) % 5) * 0.7,
      age: 0,
      life: kind === "carrot" ? 23 : 28,
    });
  }
}

function updateWorldFx() {
  for (const particle of state.worldFx) {
    particle.age += 1;
    if (particle.kind === "ring") continue;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy -= 0.22;
  }
  state.worldFx = state.worldFx.filter((particle) => particle.age < particle.life);
}

function updateRunner(runner, tick, pressNow, carrots, route = HEAT_ROUTES[0]) {
  if (!runner || runner.finished) return;
  if (pressNow) tryPress(runner);

  if (!runner.onGround) {
    runner.airTicks += 1;
    runner.y += runner.velocityY;
    runner.velocityY -= 0.58;
    if (runner.y <= 0) {
      runner.y = 0;
      runner.velocityY = 0;
      runner.onGround = true;
      runner.airTicks = 0;
      runner.flapAvailable = true;
    }
  }

  const isStumbling = runner.stumbleTicks > 0;
  const isBursting = !isStumbling && runner.burstTicks > 0;
  const speed = isStumbling
    ? COURSE.stumbleSpeed
    : isBursting
      ? COURSE.burstSpeed
      : COURSE.speed;
  runner.x += speed;
  if (isStumbling) runner.stumbleTicks -= 1;
  if (isBursting) runner.burstTicks -= 1;
  if (runner.flapFlashTicks > 0) runner.flapFlashTicks -= 1;
  if (runner.chompTicks > 0) runner.chompTicks -= 1;

  for (let index = 0; index < route.obstacles.length; index += 1) {
    if (runner.hitObstacles.has(index)) continue;
    const obstacle = route.obstacles[index];
    if (runnerHits(runner, obstacle)) {
      runner.hitObstacles.add(index);
      const effect = obstacle.effect || "bonk";
      if (effect === "bounce") {
        runner.velocityY = Math.max(runner.velocityY, 13.8);
        runner.onGround = false;
        runner.airTicks = 0;
        runner.flapAvailable = true;
      } else if (effect === "boost") {
        runner.burstTicks = Math.max(runner.burstTicks, COURSE.burstTicks);
        runner.burstCount += 1;
      } else {
        runner.stumbleTicks = obstacle.effectTicks || 30;
      }
      if (runner.kind === "player") {
        if (effect === "bounce") {
          playGameSound("bounce");
          showBonk(runner, "boing!");
          spawnWorldFx("ring", runner.x + 18, runner.y + 10);
          setAnnouncer("Boing. The spring cap launched you.");
        } else if (effect === "boost") {
          playGameSound("boost");
          showBonk(runner, "zip!");
          spawnWorldFx("ring", runner.x + 18, runner.y + 8);
          setAnnouncer("Ice boost. Zip!");
        } else if (effect === "slow") {
          runner.harmfulHitCount += 1;
          playGameSound("bonk");
          showBonk(runner, obstacle.kind === "puddle" ? "splash!" : "snag!");
          spawnWorldFx(obstacle.kind === "puddle" ? "splash" : "dust", runner.x + 18, runner.y + 8);
          setAnnouncer(obstacle.kind === "puddle"
            ? "Splash. The puddle slowed you down."
            : "Snag. The roots slowed you down.");
        } else {
          runner.harmfulHitCount += 1;
          playGameSound("bonk");
          showBonk(runner);
          spawnWorldFx("dust", runner.x + 18, runner.y + 8);
          setAnnouncer("Bonk. You lost a little ground.");
        }
        if (effect === "bonk" || effect === "slow") maybeShowLateRabbit();
      }
    }
  }

  for (const carrot of carrots) {
    if (runner.collectedCarrots.has(carrot.id)) continue;
    const horizontal = Math.abs(carrot.x - (runner.x + 19)) <= 27;
    const vertical = Math.abs(carrot.y - (runner.y + 39)) <= 31;
    if (horizontal && vertical) {
      runner.collectedCarrots.add(carrot.id);
      runner.carrotCount += 1;
      runner.chompTicks = 6;
      if (runner.kind === "player") {
        playGameSound("carrot", runner.carrotCount);
        spawnWorldFx("carrot", carrot.x, carrot.y);
        spawnWorldFx("ring", carrot.x, carrot.y);
        popCarrotHud();
      }
      if (runner.carrotCount % 3 === 0) {
        runner.burstTicks = COURSE.burstTicks;
        runner.burstCount += 1;
        if (runner.kind === "player") setAnnouncer("Boost ready. Go!");
      } else if (runner.kind === "player") {
        setAnnouncer(`${runner.carrotCount % 3} of 3 carrots charged.`);
      }
    }
  }

  if (runner.x >= COURSE.finishX) {
    runner.x = COURSE.finishX;
    runner.finished = true;
    runner.finishTick = tick;
  }
}

function simulatePressTapeOnRoute(pressTicks, route, carrots) {
  const runner = makeRunner("ghost");
  const presses = new Set(pressTicks);
  const acceptedPressTicks = [];
  for (let tick = 1; tick <= 3000 && !runner.finished; tick += 1) {
    const action = presses.has(tick) ? tryPress(runner) : null;
    updateRunner(runner, tick, false, carrots, route);
    if (action && !runner.finished) acceptedPressTicks.push(tick);
  }
  runner.acceptedPressTicks = acceptedPressTicks;
  return runner;
}

function simulateRivalOnRoute(ghost, route, carrots) {
  return simulatePressTapeOnRoute(ghost.replay.press_ticks, route, carrots);
}

function verifiedRouteEcho(route, carrots) {
  const echo = state.stats?.echoByRoute?.[route.id];
  if (!echo) return null;
  const normalized = normalizeRouteEchoes({ [route.id]: echo })[route.id];
  if (!normalized) return null;
  const replay = simulatePressTapeOnRoute(normalized.pressTicks, route, carrots);
  const routeBest = state.stats?.bestByRoute?.[route.id];
  const acceptedExactly = replay.acceptedPressTicks.length === normalized.pressTicks.length &&
    replay.acceptedPressTicks.every((tick, index) => tick === normalized.pressTicks[index]);
  if (
    !replay.finished ||
    replay.finishTick !== normalized.finishTick ||
    normalized.finishTick !== routeBest ||
    !acceptedExactly
  ) {
    delete state.stats.echoByRoute[route.id];
    saveStats();
    return null;
  }
  return normalized;
}

function simulateSignedRival(ghost) {
  const captureRouteIndex = signedRouteIndex(ghost);
  const runner = simulateRivalOnRoute(
    ghost,
    HEAT_ROUTES[captureRouteIndex],
    carrotsForRoute(HEAT_ROUTES[captureRouteIndex], true),
  );
  runner.matchesSignedFinish = Boolean(
    runner.finished && runner.finishTick === ghost.replay.finish_tick,
  );
  return runner;
}

function updateTick() {
  state.tick += 1;

  let playerAction = null;
  if (state.pendingPress) {
    playerAction = tryPress(state.player);
    if (playerAction === "flap") {
      spawnWorldFx("ring", state.player.x + 18, state.player.y + 58);
    } else if (!playerAction && state.player.stumbleTicks > 8) {
      showBonk(state.player, "oof…");
      setAnnouncer("Still recovering from that hit—the jump did not fire.");
    }
    state.pendingPress = false;
  }

  updateRunner(state.player, state.tick, false, state.carrots, activeRoute());
  if (playerAction && (state.mode === "lap1" || state.mode === "lap2") && !state.player.finished) {
    state.pressTicks.push(state.tick);
    playGameSound(playerAction);
  }

  if (state.mode === "lap2") {
    updateRunner(
      state.ghostRunner,
      state.tick,
      state.activeRivalPressSet.has(state.tick),
      state.ghostCarrots,
      activeRoute(),
    );
  }

  if (state.mode === "lap2" && state.ghostRunner) {
    const leadSeconds =
      ((state.player.x - state.ghostRunner.x) / COURSE.speed) * (COURSE.tickMs / 1000);
    const compactClock = state.view.width < 500;
    elements.gameClock.textContent = Math.abs(leadSeconds) < 0.01
      ? "Even"
      : compactClock
        ? `${leadSeconds > 0 ? "+" : "−"}${Math.abs(leadSeconds).toFixed(2)}s`
        : `${leadSeconds > 0 ? "Ahead" : "Behind"} ${Math.abs(leadSeconds).toFixed(2)}s`;
  } else {
    elements.gameClock.textContent = formatTime(state.tick);
  }
  elements.carrotCount.textContent = String(state.player.carrotCount);
  updateBoostHud(state.player);
  updateWorldFx();

  if (state.mode === "lap1" && state.player.finished) {
    finishFirstLap();
  } else if (state.mode === "lap2" && state.player.finished) {
    finishSecondLap();
  }
}

function hideCountdown() {
  elements.countdown.hidden = true;
  elements.countdown.textContent = "3";
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function beginLap(
  mode,
  { heatOverride = null, routeRetry = false, routeIndexOverride = null, freeRoute = false } = {},
) {
  if (mode === "lap2" && !state.ghost) return;
  const leavingResults = !elements.finishPanel.hidden;
  const token = ++state.countdownToken;
  state.mode = "countdown";
  state.tick = 0;
  state.accumulator = 0;
  state.lastFrame = performance.now();
  state.pendingPress = false;
  state.resultFx = null;
  state.worldFx = [];
  state.player = makeRunner("player");
  state.ghostRunner = mode === "lap2" ? makeRunner("ghost") : null;
  state.activeRivalPressSet = new Set();
  state.activeRivalKind = "signed";
  state.activeRivalEcho = null;
  state.signedRouteBaseline = null;
  state.newMedalMask = 0;
  state.pressTicks = [];
  state.promotablePb = null;
  elements.promotePbButton.hidden = true;
  elements.medalRow.hidden = true;
  state.lateRabbitShown = false;
  hideLateRabbit();
  const heat = mode === "lap1" ? 1 : heatOverride || state.currentHeat;
  state.activeHeat = heat;
  state.activeRouteRetry = mode === "lap2" && routeRetry;
  state.activeFreeRoute = mode === "lap2" && freeRoute;
  const fingerprint = mode === "lap1"
    ? "baseline"
    : state.ghost?.derived_key_fingerprint || "baseline";
  const captureRouteIndex = mode === "lap1"
    ? Math.max(0, routeIndexForSignedCourse(state.captureRouteId))
    : signedRouteIndex();
  const routeIndex = mode === "lap1"
    ? captureRouteIndex
    : Number.isInteger(routeIndexOverride) && HEAT_ROUTES[routeIndexOverride]
      ? routeIndexOverride
      : routeIndexForHeat(heat, fingerprint, captureRouteIndex);
  state.activeRouteIndex = routeIndex;
  const route = HEAT_ROUTES[routeIndex];
  if (mode === "lap1") state.recordedRouteId = route.id;
  state.routeBestTick = mode === "lap2" && state.stats && state.stats.bestByRoute
    ? state.stats.bestByRoute[routeBestKey(route)] || null
    : null;
  const usesCaptureCarrots = routeIndex === captureRouteIndex;
  state.carrots = carrotsForRoute(route, usesCaptureCarrots);
  if (mode === "lap2") {
    state.ghostCarrots = carrotsForRoute(route, usesCaptureCarrots);
    state.signedRouteBaseline = simulateRivalOnRoute(
      state.ghost,
      route,
      state.ghostCarrots,
    );
    const echo = verifiedRouteEcho(route, state.ghostCarrots);
    state.activeRivalEcho = echo;
    state.activeRivalKind = echo ? "pb" : "signed";
    state.activeRivalPressSet = new Set(
      echo ? echo.pressTicks : state.ghost.replay.press_ticks,
    );
    state.ghostRouteBaseline = echo
      ? simulatePressTapeOnRoute(echo.pressTicks, route, state.ghostCarrots)
      : state.signedRouteBaseline;
  }
  const rivalSuffix = mode === "lap2"
    ? ` · vs ${state.activeRivalKind === "pb" ? "PB" : "signed"}`
    : "";
  elements.gameHud.hidden = false;
  elements.lapLabel.textContent = mode === "lap1"
    ? `Capture · ${route.direction < 0 ? "←" : "→"} ${route.name}`
    : state.activeRouteRetry
      ? `Retry · ${route.direction < 0 ? "←" : "→"} ${route.name}${rivalSuffix}`
      : state.activeFreeRoute
        ? `Chosen · ${route.direction < 0 ? "←" : "→"} ${route.name}${rivalSuffix}`
      : `Heat ${heat} · ${route.direction < 0 ? "←" : "→"} ${route.name}${rivalSuffix}`;
  elements.gameClock.textContent = mode === "lap1" ? "0.00s" : "Even";
  elements.carrotCount.textContent = "0";
  elements.burstLabel.textContent = "Boost 0/3";
  elements.burstFill.style.width = "0%";
  elements.burstPill.classList.remove("is-live");
  delete elements.finishPanel.dataset.outcome;
  elements.finishPanel.classList.remove("is-best");
  elements.finishRibbon.textContent = "★";
  elements.bonk.hidden = true;
  setPanel(null);
  // Move focus off the button we just hid so countdown input belongs to the game.
  elements.canvas.focus({ preventScroll: true });
  if (leavingResults) {
    elements.canvasWrap.scrollIntoView({ behavior: "auto", block: "start" });
  }
  elements.countdown.hidden = false;

  const quickCountdown = mode === "lap2" && (heat > 1 || state.activeRouteRetry);
  const steps = quickCountdown
    ? ["2", "1", "GO!"]
    : ["3", "2", "1", "GO!"];
  for (const step of steps) {
    if (token !== state.countdownToken) return;
    elements.countdown.textContent = step;
    await wait(step === "GO!" ? 260 : quickCountdown ? 320 : 480);
  }
  if (token !== state.countdownToken) return;

  hideCountdown();
  state.mode = mode;
  state.lastFrame = performance.now();
  state.accumulator = 0;
  setAnnouncer(mode === "lap1"
    ? `Capturing ${route.name}. ${route.hint}`
    : state.activeRouteRetry
      ? `Retrying ${route.name} against ${state.activeRivalKind === "pb" ? "your exact local PB echo" : "the signed rival"}. ${route.hint}`
      : state.activeFreeRoute
        ? `Racing chosen trail ${route.name} against ${state.activeRivalKind === "pb" ? "your exact local PB echo" : "the signed rival"}. Scheduled Heat ${heat} is waiting. ${route.hint}`
      : `Heat ${heat}: ${route.name}, versus ${state.activeRivalKind === "pb" ? "your exact local PB echo" : "the signed rival"}. ${route.hint}`);
  elements.canvas.focus({ preventScroll: true });
}

function showReplaySignPanel(kind = "capture") {
  state.mode = "await-sign";
  state.pressTicks = state.pressTicks.filter((tick) => tick < state.firstFinishTick);
  state.accumulator = 0;
  elements.gameHud.hidden = true;
  state.pendingSignKind = kind;
  elements.signButton.disabled = false;
  const recordedRoute = HEAT_ROUTES[
    Math.max(0, routeIndexForSignedCourse(state.recordedRouteId))
  ];
  const promotingPb = kind === "pb";
  const deviceDescription = reportedDeviceDescription(state.status?.hardware || {});
  elements.signKickerLabel.textContent = promotingPb ? "New home-trail PB" : "First lap complete";
  elements.firstLapTime.textContent = formatTime(state.firstFinishTick);
  elements.signCopy.textContent = state.mock
    ? promotingPb
      ? `Replace your current practice rival with this exact ${recordedRoute.name} PB. No YubiKey is involved.`
      : "Enter the practice PIN. This makes a software-only ghost; no YubiKey is involved."
    : promotingPb
      ? `Connected: ${deviceDescription}. Replace your signed rival with this exact ${recordedRoute.name} PB. Enter this key’s FIDO PIN, then touch it.`
      : `Connected: ${deviceDescription}. Enter this key’s FIDO PIN, then touch it. Ghost Lap hashes the replay; previewSign signs its 32-byte digest.`;
  elements.signButton.textContent = state.mock
    ? promotingPb ? "Make this PB the practice rival" : "Make a software practice ghost"
    : promotingPb
      ? "Make this PB the rival · PIN + touch"
      : "Sign replay · PIN + touch";
  elements.signPin.placeholder = state.mock ? "Practice PIN" : "FIDO PIN";
  elements.signNote.textContent = state.mock
    ? promotingPb
      ? "Your current practice rival stays intact unless this replacement verifies."
      : "The PIN is cleared before software signing begins."
    : promotingPb
      ? "Your current rival stays intact unless this replacement verifies. Check the connected key before entering its PIN."
      : "The replay goes only to the local broker; previewSign receives its digest and ARKG arguments. Check the connected key before entering its PIN.";
  elements.keepRivalButton.hidden = !(state.captureIntent && state.ghost);
  setPanel(elements.signPanel);
  setAnnouncer(state.mock
    ? `${promotingPb ? "Personal best" : "Capture lap"} finished in ${formatTime(state.firstFinishTick)}. The run is waiting for the software practice signer.`
    : `${promotingPb ? "Personal best" : "Capture lap"} finished in ${formatTime(state.firstFinishTick)}. The run is waiting for your key.`);
  window.setTimeout(() => elements.signPin.focus(), 80);
}

function finishFirstLap() {
  state.firstFinishTick = state.player.finishTick;
  state.pressTicks = state.pressTicks.filter((tick) => tick < state.firstFinishTick);
  showReplaySignPanel("capture");
}

function validatedGhost(ghost, verification) {
  if (!ghost || !verification || verification.valid !== true) {
    throw new Error("The game did not receive a verified ghost.");
  }
  const replay = ghost.replay;
  if (
    !replay ||
    routeIndexForSignedCourse(replay.course_id) < 0 ||
    replay.physics_version !== COURSE.physicsVersion ||
    replay.tick_ms !== COURSE.tickMs ||
    !Number.isInteger(replay.finish_tick) ||
    replay.finish_tick < 250 ||
    replay.finish_tick > 3000 ||
    !Array.isArray(replay.press_ticks)
  ) {
    throw new Error("The signed ghost uses an incompatible course or physics version.");
  }
  let previous = -1;
  for (const tick of replay.press_ticks) {
    if (!Number.isInteger(tick) || tick <= previous || tick < 0 || tick >= replay.finish_tick) {
      throw new Error("The signed ghost contains invalid jump timing.");
    }
    previous = tick;
  }
  if (replay.press_ticks.length > 256) {
    throw new Error("The signed ghost contains too many jumps.");
  }
  return ghost;
}

function installGhost(ghost, { persist = true, verification = null } = {}) {
  state.ghost = ghost;
  state.ghostVerification = verification;
  state.rivalDna = rivalDnaForGhost(ghost);
  state.ghostPressSet = new Set(ghost.replay.press_ticks);
  state.activeRivalPressSet = new Set(ghost.replay.press_ticks);
  state.activeRivalKind = "signed";
  state.activeRivalEcho = null;
  const captureRouteIndex = signedRouteIndex(ghost);
  state.captureRouteId = HEAT_ROUTES[captureRouteIndex].id;
  state.recordedRouteId = ghost.replay.course_id;
  state.ghostCarrots = carrotsForRoute(HEAT_ROUTES[captureRouteIndex], true);
  state.ghostBaseline = simulateSignedRival(ghost);
  state.ghostRouteBaseline = state.ghostBaseline;
  state.signedRouteBaseline = state.ghostBaseline;
  state.stats = loadStats(ghost);
  state.currentHeat = state.stats.nextHeat;
  state.activeHeat = state.currentHeat;
  state.activeRouteIndex = routeIndexForHeat(
    state.currentHeat,
    ghost.derived_key_fingerprint,
    captureRouteIndex,
  );
  state.activeRouteRetry = false;
  state.activeFreeRoute = false;
  state.lastCompletedHeat = null;
  state.lastCompletedRouteIndex = null;
  state.challengeRouteId = null;
  state.captureIntent = false;
  if (persist) saveGhost(ghost);
  populateKeyStory(ghost);
  syncRivalFileTools();
}

async function restoreSavedGhost() {
  const candidates = storedRivalCandidates();
  if (candidates.length === 0) {
    state.restoreBlocked = false;
    state.unmatchedRivalCount = 0;
    return false;
  }
  const currentMode = state.status?.mode || (state.mock ? "mock" : "hardware");
  let unmatched = candidates.filter(({ ghost }) => ghost.mode !== currentMode).length;
  for (const candidate of candidates) {
    if (candidate.ghost.mode !== currentMode) continue;
    try {
      const verification = await api(API.verifyGhost, {
        method: "POST",
        body: { ghost: candidate.ghost },
      });
      installGhost(validatedGhost(candidate.ghost, verification), {
        persist: false,
        verification,
      });
      saveGhost(candidate.ghost);
      state.restoreBlocked = false;
      state.unmatchedRivalCount = Math.max(0, candidates.length - 1);
      renderIntroState();
      if (state.status) renderSetup(statusFacts(state.status));
      setAnnouncer(`Verified rival restored. Heat ${state.currentHeat} is ready without another touch.`);
      return true;
    } catch (error) {
      if (error.message === "The game did not receive a verified ghost." ||
          error.message.includes("incompatible") ||
          error.message.includes("invalid")) {
        unmatched += 1;
        continue;
      }
      state.restoreBlocked = true;
      state.unmatchedRivalCount = unmatched;
      setAnnouncer(`Saved rival verification paused: ${error.message}`);
      return false;
    }
  }
  state.restoreBlocked = false;
  state.unmatchedRivalCount = unmatched;
  setAnnouncer("Saved rivals for other local signers were left untouched.");
  return false;
}

function algorithmLabel(value, fallbackName) {
  if (value === undefined || value === null || value === "") return fallbackName;
  if (typeof value === "number") return `${fallbackName} (${value})`;
  return String(value);
}

function previewSignVersionLabel(value) {
  const match = String(value || "").match(/^(\d+)/);
  return `draft previewSign v${match ? match[1] : "4"}`;
}

function base64urlByteLength(value) {
  return typeof value === "string" ? Math.floor((value.length * 3) / 4) : 0;
}

function verificationSummary(verification) {
  const checks = verification && verification.checks ? Object.values(verification.checks) : [];
  const passed = checks.filter(Boolean).length;
  return checks.length > 0
    ? `${passed}/${checks.length} local checks passed · replay verification does not contact the key`
    : "Signature verified locally";
}

function populateKeyStory(ghost) {
  const replay = ghost.replay || {};
  const captureRoute = HEAT_ROUTES[signedRouteIndex(ghost)];
  const hardware = ghost.mode === "hardware";
  renderRivalDna(ghost);
  elements.viewProofButton.textContent = hardware ? "View signed proof" : "View practice proof";
  elements.keyStory.hidden = false;
  elements.proofBadge.textContent = hardware ? "Verified locally" : "Practice only";
  elements.keyStoryCopy.textContent = hardware
    ? "A locally enrolled previewSign-compatible authenticator made a fresh ARKG run key and signed this capture after user verification + touch. Ghost Lap checked both signatures against this installation’s enrolled public material; the artifact does not attest manufacturer or firmware."
    : "The local practice key signed this replay. It carries no YubiKey hardware claim.";
  elements.proofFlow.hidden = !hardware;
  elements.proofKeyStorage.textContent = hardware
    ? "Saved in this browser profile's local storage—not in cookies or on the YubiKey. Private/incognito windows start with separate storage. Enrollment created authenticator-managed WebAuthn and previewSign key material; signing may advance its counter."
    : "Saved in this browser profile's local storage. Private/incognito windows start empty; the practice replay is not shared between profiles.";
  elements.proofSigner.textContent = hardware
    ? "Locally enrolled previewSign authenticator · manufacturer not attested"
    : "Local software practice signer";
  elements.proofProfile.textContent = hardware
    ? `${previewSignVersionLabel(ghost.preview_sign_version)} · ESP256-split-ARKG · user verification + touch required`
    : "Software-only ES256 practice profile";
  elements.proofReplay.textContent = `${captureRoute.name} · ${replay.course_id} · ${formatTime(replay.finish_tick)} · ${replay.press_ticks.length} accepted inputs · ${replay.physics_version}`;
  const signatureName = ghost.algorithm_name || (hardware ? "ESP256-split-ARKG" : "ES256-mock");
  const derivedName = ghost.derived_algorithm_name || (hardware ? "ESP256" : "ES256-mock");
  elements.proofAlgorithm.textContent = `${algorithmLabel(ghost.algorithm, signatureName)} → ${algorithmLabel(ghost.derived_algorithm, derivedName)} · ${base64urlByteLength(ghost.signature)} B signature`;
  elements.proofPresence.textContent = hardware
    ? `User verification ${ghost.user_verified === true ? "confirmed" : "not confirmed"} · touch ${ghost.user_present === true ? "confirmed" : "not confirmed"}`
    : "No hardware presence or PIN claim";
  elements.proofVerification.textContent = verificationSummary(state.ghostVerification);
  elements.proofRun.textContent = `${ghost.issued_at || "time unavailable"} · ${ghost.run_id || "ID unavailable"}`;
  elements.proofPayload.textContent = hardware
    ? `${base64urlByteLength(ghost.payload_cbor)} B canonical CBOR · its 32 B SHA-256 digest and ARKG arguments went to previewSign`
    : `${base64urlByteLength(ghost.payload_cbor)} B canonical CBOR · covered by the local software practice signature`;
  elements.proofDerived.textContent = hardware
    ? `${ghost.derivation_scheme || "ARKG"} · ${base64urlByteLength(ghost.derived_public_key_cose)} B derived public COSE key`
    : "Direct software signing key";
  elements.proofDerivation.textContent = hardware
    ? `${base64urlByteLength(ghost.derivation_ikm)} B IKM · ${base64urlByteLength(ghost.derivation_context)} B context · ${base64urlByteLength(ghost.additional_args)} B additional args`
    : "Not applicable in practice mode";
  elements.proofCounter.textContent = hardware
    ? String(ghost.sign_count)
    : "Not a hardware assertion";
  elements.proofDigest.textContent = ghost.payload_sha256 || "Not provided";
  elements.proofFingerprint.textContent = ghost.derived_key_fingerprint || "Not provided";
  elements.proofRawJson.textContent = rivalJson(ghost);
  state.tamperTestRunning = false;
  elements.tamperTestButton.removeAttribute("aria-disabled");
  elements.tamperTestButton.textContent = "Change one input";
  elements.tamperTestResult.hidden = true;
  elements.tamperTestResult.classList.remove("is-error");
}

function disposableEditedGhost(ghost) {
  const copy = JSON.parse(JSON.stringify(ghost));
  const ticks = copy.replay.press_ticks;
  if (ticks.length === 0) {
    ticks.push(1);
    return {
      ghost: copy,
      edit: { inputNumber: 1, beforeTick: null, afterTick: 1 },
    };
  }
  for (let index = 0; index < ticks.length; index += 1) {
    const next = index + 1 < ticks.length ? ticks[index + 1] : copy.replay.finish_tick;
    if (ticks[index] + 1 < next) {
      const beforeTick = ticks[index];
      ticks[index] += 1;
      return {
        ghost: copy,
        edit: { inputNumber: index + 1, beforeTick, afterTick: ticks[index] },
      };
    }
  }
  for (let index = ticks.length - 1; index >= 0; index -= 1) {
    const previous = index > 0 ? ticks[index - 1] : -1;
    if (ticks[index] - 1 > previous) {
      const beforeTick = ticks[index];
      ticks[index] -= 1;
      return {
        ghost: copy,
        edit: { inputNumber: index + 1, beforeTick, afterTick: ticks[index] },
      };
    }
  }
  const beforeTick = ticks.pop();
  return {
    ghost: copy,
    edit: { inputNumber: ticks.length + 1, beforeTick, afterTick: null },
  };
}

function describeTamperEdit(edit) {
  const press = `Press ${edit.inputNumber}`;
  if (edit.beforeTick === null) {
    return `${press}: added at tick ${edit.afterTick} · ${formatTime(edit.afterTick)}`;
  }
  if (edit.afterTick === null) {
    return `${press}: tick ${edit.beforeTick} · ${formatTime(edit.beforeTick)} → removed`;
  }
  return `${press}: tick ${edit.beforeTick} · ${formatTime(edit.beforeTick)} → tick ${edit.afterTick} · ${formatTime(edit.afterTick)}`;
}

function proofCheckLabel(name) {
  const labels = {
    artifact_binding: "Replay ↔ signed payload binding",
    payload_digest: "Payload SHA-256",
    signature: "ARKG signature",
  };
  return labels[name] || name.replaceAll("_", " ");
}

async function runTamperTest() {
  if (!state.ghost || state.tamperTestRunning) return;
  state.tamperTestRunning = true;
  elements.tamperTestButton.setAttribute("aria-disabled", "true");
  elements.tamperTestButton.textContent = "Checking locally…";
  elements.tamperTestResult.hidden = false;
  elements.tamperTestResult.classList.remove("is-error");
  const attempt = disposableEditedGhost(state.ghost);
  const editDescription = describeTamperEdit(attempt.edit);
  elements.tamperTestResult.textContent = `Trying an edited copy\n${editDescription}\nComparing it with the original signed payload…`;
  try {
    const result = await api(API.verifyGhost, {
      method: "POST",
      body: { ghost: attempt.ghost },
    });
    if (result.valid) throw new Error("The edited copy was unexpectedly accepted.");
    const failedChecks = Object.entries(result.checks || {})
      .filter(([, passed]) => !passed)
      .map(([name]) => proofCheckLabel(name));
    const failed = failedChecks.length > 0 ? failedChecks.join(", ") : "Signed-artifact verification";
    const hardware = state.ghost?.mode === "hardware";
    const signer = hardware ? "enrolled authenticator" : "software practice signer";
    const contact = hardware
      ? "the key was not contacted"
      : "no physical authenticator was involved";
    elements.tamperTestResult.textContent = `Edited copy rejected locally\n${editDescription}\nFailed check: ${failed}\n\nThe ${signer} signed only the original payload fingerprint. Ghost Lap checked this changed copy offline; ${contact}.\n\nSaved rival unchanged.`;
    elements.tamperTestButton.textContent = "Rejected ✓";
    setAnnouncer(hardware
      ? `${editDescription}. Local verification rejected the edited copy. The key was not contacted.`
      : `${editDescription}. Local verification rejected the edited copy. No physical authenticator was involved.`);
  } catch (error) {
    elements.tamperTestResult.classList.add("is-error");
    elements.tamperTestResult.textContent = `Proof check could not run: ${error.message}`;
    elements.tamperTestButton.textContent = "Try again";
  } finally {
    state.tamperTestRunning = false;
    elements.tamperTestButton.removeAttribute("aria-disabled");
    elements.tamperTestButton.focus({ preventScroll: true });
  }
}

async function signFirstLap(pin) {
  if (state.mode === "signing") return;
  const recordedRoute = HEAT_ROUTES[
    Math.max(0, routeIndexForSignedCourse(state.recordedRouteId))
  ];
  const promotingPb = state.pendingSignKind === "pb";
  const replacedGhost = state.ghost;
  const carriedStats = promotingPb && state.stats
    ? JSON.parse(JSON.stringify(state.stats))
    : null;
  state.mode = "signing";
  elements.signButton.disabled = true;
  state.pressTicks = state.pressTicks.filter((tick) => tick < state.firstFinishTick);
  setPanel(elements.ceremonyPanel);
  if (state.mock) {
    elements.ceremonyStatus.textContent = "Signing locally";
    elements.ceremonyKicker.textContent = "Practice signer";
    elements.ceremonyTitle.textContent = "Signing replay…";
    elements.ceremonyCopy.textContent = "This uses the local software key, not a YubiKey.";
  } else {
    elements.ceremonyStatus.textContent = "Waiting for key touch";
    elements.ceremonyKicker.textContent = "Signing replay digest";
    elements.ceremonyTitle.textContent = "Touch the connected key.";
    elements.ceremonyCopy.textContent = `The ${formatTime(state.firstFinishTick)} ${recordedRoute.name} replay stays on this device and goes only to the local broker. previewSign receives its 32-byte SHA-256 digest and ARKG arguments—not the replay itself.`;
  }
  setAnnouncer(state.mock ? "Signing with the local practice key." : "Waiting for the connected key’s touch to sign the replay digest.");

  try {
    const payload = await api(API.signGhost, {
      method: "POST",
      body: {
        pin,
        course_id: state.recordedRouteId || recordedRoute.id,
        tick_ms: COURSE.tickMs,
        finish_tick: state.firstFinishTick,
        press_ticks: state.pressTicks,
      },
    });
    const newGhost = validatedGhost(payload.ghost, payload.verification);
    installGhost(newGhost, { verification: payload.verification });
    if (carriedStats) {
      state.stats = {
        ...carriedStats,
        nextHeat: 1,
        currentStreak: 0,
        bestByRoute: { ...(carriedStats.bestByRoute || {}) },
      };
      state.currentHeat = 1;
      state.activeHeat = 1;
      saveStats();
    }
    if (replacedGhost && replacedGhost.run_id !== newGhost.run_id) {
      try {
        localStorage.removeItem(statsKey(replacedGhost));
      } catch {
        // Replacing the in-memory rival still succeeds if score cleanup is blocked.
      }
    }
    state.pendingSignKind = null;
    state.promotablePb = null;
    elements.ceremonyStatus.textContent = state.mock ? "Signature checked" : "Verification + touch confirmed";
    elements.ceremonyKicker.textContent = state.mock ? "Signature checked" : "ARKG replay signature checked";
    elements.ceremonyTitle.textContent = promotingPb ? "New rival ready." : "Rival ready.";
    elements.ceremonyCopy.textContent = state.mock
      ? "The practice signature verified. Heat 1 starts now."
      : promotingPb
        ? "The faster replay verified and replaced your rival. Your PB book carried over; no replay data was written to the key."
        : "The signature and companion WebAuthn assertion both verified. Ghost Lap saved the replay in this browser; no replay data was written to the key.";
    setAnnouncer("Rival verified. Heat one is starting automatically.");
    await wait(reducedMotion ? 500 : 2100);
    await beginLap("lap2");
  } catch (error) {
    state.mode = "await-sign";
    elements.signButton.disabled = false;
    elements.signCopy.textContent = error.message;
    setPanel(elements.signPanel);
    setAnnouncer(`Ghost creation failed: ${error.message}`);
    window.setTimeout(() => elements.signPin.focus(), 80);
  }
}

function nextFxRandom(box) {
  box.value = (Math.imul(box.value, 1664525) + 1013904223) >>> 0;
  return box.value / 0x100000000;
}

function startResultFx(outcome, heat, isNewBest) {
  const count = outcome === "win" ? 30 : outcome === "tie" ? 12 : 6;
  const random = {
    value: fingerprintSeed(
      `${state.ghost.derived_key_fingerprint}:result:${outcome}:${isNewBest}`,
      heat,
    ),
  };
  const colors = outcome === "loss"
    ? ["#78a9bd", "#c9e7e5", "#fffaf0"]
    : ["#ef7962", "#efbd55", "#527c55", "#fffaf0"];
  const particles = [];
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI * (0.18 + nextFxRandom(random) * 0.64);
    const speed = outcome === "loss"
      ? 75 + nextFxRandom(random) * 70
      : 180 + nextFxRandom(random) * 260;
    particles.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      delay: nextFxRandom(random) * (outcome === "win" ? 0.18 : 0.08),
      life: 0.65 + nextFxRandom(random) * 0.45,
      size: 5 + nextFxRandom(random) * 8,
      spin: (nextFxRandom(random) - 0.5) * 10,
      color: colors[index % colors.length],
      shape: outcome === "loss" ? "puff" : index % 6 === 0 ? "carrot" : "paper",
    });
  }
  state.resultFx = {
    outcome,
    isNewBest,
    startedAt: performance.now(),
    duration: outcome === "win"
      ? RESULT_FX.winDuration
      : outcome === "tie"
        ? RESULT_FX.tieDuration
        : RESULT_FX.lossDuration,
    particles,
  };
}

function drawResultFx(now, camera) {
  if (reducedMotion || !state.resultFx) return;
  const elapsed = Math.max(0, (now - state.resultFx.startedAt) / 1000);
  const direction = activeRoute().direction;
  const originX = projectWorldX(COURSE.finishX, camera) + direction * 22;
  const originY = COURSE.groundY - 72;

  if (state.resultFx.outcome === "tie") {
    for (let index = 0; index < 2; index += 1) {
      const progress = Math.min(1, Math.max(0, elapsed * 1.8 - index * 0.18));
      context.strokeStyle = `rgba(82, 136, 165, ${0.72 * (1 - progress)})`;
      context.lineWidth = 5 - progress * 3;
      context.beginPath();
      context.arc(originX, originY, 18 + progress * 80, 0, Math.PI * 2);
      context.stroke();
    }
  }

  for (const particle of state.resultFx.particles) {
    const age = elapsed - particle.delay;
    if (age < 0 || age > particle.life) continue;
    const fade = 1 - age / particle.life;
    const x = originX + direction * particle.vx * age;
    const y = originY + particle.vy * age + 0.5 * RESULT_FX.gravity * age * age;
    context.save();
    context.translate(x, y);
    context.rotate(particle.spin * age);
    context.globalAlpha = fade;
    if (particle.shape === "puff") {
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(0, 0, particle.size * (1 + age), 0, Math.PI * 2);
      context.fill();
    } else if (particle.shape === "carrot") {
      context.fillStyle = "#ef8a3c";
      context.fillRect(-2, -particle.size, 5, particle.size * 1.6);
      context.strokeStyle = "#527c55";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, -particle.size);
      context.lineTo(-5, -particle.size - 6);
      context.moveTo(1, -particle.size);
      context.lineTo(6, -particle.size - 5);
      context.stroke();
    } else {
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
    }
    context.restore();
  }
}

function routePbVerdict(routeName, finishTick, previousBest) {
  if (previousBest === null) return `${routeName} record set.`;
  const difference = finishTick - previousBest;
  if (difference < 0) return `${routeName} PB · ${formatTime(Math.abs(difference))} faster.`;
  if (difference === 0) return `Matched your ${routeName} PB.`;
  return `${formatTime(difference)} off your ${routeName} PB.`;
}

function finishSecondLap() {
  state.mode = "flourish";
  state.secondFinishTick = state.player.finishTick;
  state.accumulator = 0;
  elements.gameHud.hidden = true;
  const completedHeat = state.activeHeat;
  const wasRouteRetry = state.activeRouteRetry;
  const wasFreeRoute = state.activeFreeRoute;
  const fallbackSignedTick = state.ghost.replay.finish_tick;
  const activeRivalTick = state.ghostRouteBaseline?.finishTick || fallbackSignedTick;
  const signedRivalTick = state.signedRouteBaseline?.finishTick || fallbackSignedTick;
  const activeDelta = state.secondFinishTick - activeRivalTick;
  const signedDelta = state.secondFinishTick - signedRivalTick;
  const activeRivalFinished = Boolean(
    state.ghostRouteBaseline?.finished &&
    Number.isInteger(state.ghostRouteBaseline.finishTick),
  );
  state.stats ||= defaultStats();
  const fingerprint = state.ghost.derived_key_fingerprint;
  const captureRouteIndex = signedRouteIndex();
  const completedRoute = activeRoute();
  const routeKey = routeBestKey(completedRoute);
  state.stats.bestByRoute ||= {};
  state.stats.echoByRoute ||= {};
  state.stats.medalsByRoute ||= {};
  const previousRouteBest = state.stats.bestByRoute[routeKey] || null;
  const trailsBefore = Object.keys(state.stats.bestByRoute).length;
  const paceVerdict = routePbVerdict(
    completedRoute.name,
    state.secondFinishTick,
    previousRouteBest,
  );
  const isNewRouteBest = previousRouteBest === null ||
    state.secondFinishTick < previousRouteBest;
  const isNewOverallBest = state.stats.bestFinishTick === null ||
    state.secondFinishTick < state.stats.bestFinishTick;
  const homeRoute = HEAT_ROUTES[captureRouteIndex];
  const canPromotePb = completedRoute.id === homeRoute.id && signedDelta < 0 && isNewRouteBest;
  state.promotablePb = canPromotePb
    ? {
        routeId: completedRoute.id,
        finishTick: state.secondFinishTick,
        pressTicks: state.pressTicks.filter((tick) => tick < state.secondFinishTick),
      }
    : null;
  state.stats.races += 1;
  if (activeRivalFinished && activeDelta < 0) {
    state.stats.wins += 1;
    state.stats.currentStreak += 1;
  } else if (!activeRivalFinished || activeDelta > 0) {
    state.stats.currentStreak = 0;
  }
  state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.currentStreak);
  state.stats.bestFinishTick = state.stats.bestFinishTick === null
    ? state.secondFinishTick
    : Math.min(state.stats.bestFinishTick, state.secondFinishTick);
  state.stats.bestByRoute[routeKey] = previousRouteBest === null
    ? state.secondFinishTick
    : Math.min(previousRouteBest, state.secondFinishTick);
  if (isNewRouteBest) {
    state.stats.echoByRoute[routeKey] = {
      physicsVersion: COURSE.physicsVersion,
      finishTick: state.secondFinishTick,
      pressTicks: state.pressTicks.filter((tick) => tick < state.secondFinishTick),
    };
  }
  const previousMedalMask = state.stats.medalsByRoute[routeKey] || 0;
  let earnedMedalMask = 0;
  if (activeRivalFinished && activeDelta < 0) earnedMedalMask |= MEDAL_RIVAL;
  if (
    state.carrots.length > 0 &&
    state.player.collectedCarrots.size === state.carrots.length
  ) {
    earnedMedalMask |= MEDAL_CARROTS;
  }
  if (state.player.harmfulHitCount === 0) earnedMedalMask |= MEDAL_CLEAN;
  const medalMask = previousMedalMask | earnedMedalMask;
  state.newMedalMask = earnedMedalMask & ~previousMedalMask;
  if (medalMask > 0) state.stats.medalsByRoute[routeKey] = medalMask;
  if (!wasRouteRetry && !wasFreeRoute) {
    state.stats.nextHeat = Math.max(state.stats.nextHeat, completedHeat + 1);
  }
  saveStats();
  state.currentHeat = state.stats.nextHeat;
  state.lastCompletedHeat = completedHeat;
  state.lastCompletedRouteIndex = state.activeRouteIndex;

  const trailsSet = Object.keys(state.stats.bestByRoute).length;
  const completedTour = trailsBefore < HEAT_ROUTES.length && trailsSet === HEAT_ROUTES.length;
  const activeRivalCarrots = state.ghostRouteBaseline ? state.ghostRouteBaseline.carrotCount : 0;
  const activeRivalBursts = state.ghostRouteBaseline ? state.ghostRouteBaseline.burstCount : 0;
  const nextRoute = routeForHeat(state.currentHeat, fingerprint, captureRouteIndex);
  const completedLabel = wasRouteRetry
    ? "Retry"
    : wasFreeRoute ? "Chosen trail" : `Heat ${completedHeat}`;
  if (completedTour) {
    elements.finishKicker.textContent = `Trail book complete · ${completedLabel}`;
    elements.finishHeading.textContent = "All six trails have a time.";
  } else if (isNewRouteBest) {
    elements.finishKicker.textContent = `New route best · ${completedLabel} · ${completedRoute.name}`;
    elements.finishHeading.textContent = previousRouteBest === null
      ? `${completedRoute.name} time set.`
      : `New ${completedRoute.name} PB · ${formatTime(previousRouteBest - state.secondFinishTick)} faster.`;
  } else if (state.activeRivalKind === "pb") {
    elements.finishKicker.textContent = `${completedLabel} · ${completedRoute.name} · vs PB echo`;
    elements.finishHeading.textContent = activeDelta === 0
      ? `Matched your ${completedRoute.name} PB.`
      : `${formatTime(activeDelta)} off your ${completedRoute.name} PB.`;
  } else if (activeDelta < 0) {
    elements.finishKicker.textContent = `${completedLabel} · ${completedRoute.name}`;
    elements.finishHeading.textContent = `Signed rival beaten by ${formatTime(Math.abs(activeDelta))}.`;
  } else if (activeDelta > 0) {
    elements.finishKicker.textContent = `${completedLabel} · ${completedRoute.name}`;
    elements.finishHeading.textContent = `Your rival got you by ${formatTime(activeDelta)}.`;
  } else {
    elements.finishKicker.textContent = `${completedLabel} · ${completedRoute.name}`;
    elements.finishHeading.textContent = "A perfect tie with your past self.";
  }
  elements.playerTime.textContent = `${formatTime(state.secondFinishTick)} · 🥕${state.player.carrotCount} · ⚡${state.player.burstCount}`;
  elements.rivalScoreLabel.textContent = state.activeRivalKind === "pb"
    ? "PB echo"
    : `${state.rivalDna?.tag || "Rival"} · ${state.ghost.mode === "hardware" ? "signed" : "practice"}`;
  elements.ghostTime.textContent = `${formatTime(activeRivalTick)} · 🥕${activeRivalCarrots} · ⚡${activeRivalBursts}`;
  elements.heatStats.textContent = `${completedLabel} · ${trailsSet}/${HEAT_ROUTES.length} trails set · ${totalMedals()}/${HEAT_ROUTES.length * 3} medals · Route PB ${formatTime(state.stats.bestByRoute[routeKey])} · ${state.stats.wins} rival wins · Streak ${state.stats.currentStreak}`;
  renderFinishMedals(medalMask, state.newMedalMask);
  elements.raceAgainButton.textContent = `Next: ${nextRoute.name}`;
  elements.promotePbButton.hidden = !canPromotePb;
  elements.retryRouteButton.textContent = `Race ${completedRoute.name} again`;
  elements.chooseTrailButton.hidden = trailsSet < HEAT_ROUTES.length;
  const baseRival = state.ghost.mode === "hardware" ? "Signed rival" : "Practice rival";
  const signedVerdict = signedDelta < 0
    ? `${baseRival} beaten by ${formatTime(Math.abs(signedDelta))}.`
    : signedDelta > 0
      ? `${baseRival} ahead by ${formatTime(signedDelta)}.`
      : `${baseRival} matched exactly.`;
  const newMedalCopy = state.newMedalMask
    ? `New ${medalNames(state.newMedalMask).join(" + ")} medal${bitCount(state.newMedalMask) > 1 ? "s" : ""}. `
    : "";
  elements.finishNote.textContent = newMedalCopy + (canPromotePb
    ? `${paceVerdict} ${signedVerdict} Keep playing, or explicitly make this faster home-trail run the new signed rival.`
    : state.activeRivalKind === "pb"
      ? `You raced the exact local, unsigned PB input tape. ${signedVerdict} Retry it, or continue to ${nextRoute.name}. No PIN or touch.`
      : `${paceVerdict} ${signedVerdict} Your exact local PB echo will race you next time on this trail. No PIN or touch.`);
  const displayOutcome = isNewRouteBest
    ? "win"
    : activeDelta < 0 ? "win" : activeDelta > 0 ? "loss" : "tie";
  elements.finishPanel.dataset.outcome = displayOutcome;
  elements.finishPanel.classList.toggle("is-best", isNewRouteBest);
  elements.finishRibbon.textContent = completedTour
    ? "✓"
    : displayOutcome === "win" ? "★" : displayOutcome === "tie" ? "＝" : "↻";
  startResultFx(displayOutcome, completedHeat, isNewRouteBest || isNewOverallBest);
  playGameSound(displayOutcome);
  setPanel(null);
  setAnnouncer(
    state.newMedalMask
      ? `${elements.finishHeading.textContent} New medals: ${medalNames(state.newMedalMask).join(", ")}.`
      : elements.finishHeading.textContent,
  );
  const flourishDuration = reducedMotion ? 120 : state.resultFx.duration;
  window.setTimeout(() => {
    if (state.mode !== "flourish") return;
    state.mode = "finished";
    setPanel(elements.finishPanel);
    window.setTimeout(() => elements.raceAgainButton.focus(), 60);
  }, flourishDuration);
}

async function beginPbPromotion() {
  const candidate = state.promotablePb;
  if (!candidate || state.mode !== "finished") return;

  elements.promotePbButton.disabled = true;
  await loadStatus();
  elements.promotePbButton.disabled = false;
  if (!isHardwareReady()) {
    elements.finishNote.textContent = state.mock
      ? "Your PB is safe locally. Restart the matching software practice signer, then try again."
      : "Your PB is safe locally. Reconnect the enrolled key and press this button again to make it the signed rival.";
    setAnnouncer(state.mock
      ? "Restart the matching software practice signer before promoting this personal best."
      : "Reconnect the enrolled key before promoting this personal best.");
    return;
  }

  state.captureIntent = true;
  state.captureRouteId = candidate.routeId;
  state.recordedRouteId = candidate.routeId;
  state.firstFinishTick = candidate.finishTick;
  state.pressTicks = [...candidate.pressTicks];
  showReplaySignPanel("pb");
}

function queuePress(event) {
  if (state.soundEnabled) unlockGameAudio();
  if (state.mode !== "lap1" && state.mode !== "lap2") return;
  if (event) event.preventDefault();
  state.pendingPress = true;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCloud(x, y, scale = 1) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = "rgba(255, 250, 240, 0.82)";
  context.beginPath();
  context.arc(0, 10, 23, 0, Math.PI * 2);
  context.arc(27, 0, 31, 0, Math.PI * 2);
  context.arc(58, 13, 21, 0, Math.PI * 2);
  context.rect(-4, 10, 65, 25);
  context.fill();
  context.restore();
}

function drawTrack(width, groundColor, pathColor, lineColor) {
  context.fillStyle = groundColor;
  context.fillRect(0, COURSE.groundY - 10, width, 130);
  context.fillStyle = pathColor;
  context.fillRect(0, COURSE.groundY + 23, width, 117);
  context.strokeStyle = lineColor;
  context.lineWidth = 3;
  context.setLineDash([16, 23]);
  context.beginPath();
  context.moveTo(0, COURSE.groundY + 67);
  context.lineTo(width, COURSE.groundY + 67);
  context.stroke();
  context.setLineDash([]);
}

function wrappedScreenX(value, span) {
  return ((value % span) + span) % span;
}

function drawBackground(camera, width) {
  const route = activeRoute();
  const travelShift = (reducedMotion ? 0 : camera) * route.direction;

  if (route.theme === "marsh") {
    context.fillStyle = "#1f3152";
    context.fillRect(0, 0, width, 540);
    context.fillStyle = "#f7edbd";
    context.beginPath();
    context.arc(width * 0.2, 88, 38, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#1f3152";
    context.beginPath();
    context.arc(width * 0.2 + 15, 77, 38, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#354b66";
    context.beginPath();
    context.moveTo(0, 366);
    context.quadraticCurveTo(width * 0.22 + travelShift * 0.05, 285, width * 0.5, 370);
    context.quadraticCurveTo(width * 0.75 + travelShift * 0.04, 300, width, 362);
    context.lineTo(width, 430);
    context.lineTo(0, 430);
    context.fill();
    context.fillStyle = "#8fd6bd";
    for (let index = 0; index < 13; index += 1) {
      const x = wrappedScreenX(index * 173 - travelShift * 0.12, width + 170) - 50;
      const y = 118 + (index * 47) % 180;
      context.globalAlpha = 0.38 + (index % 3) * 0.16;
      context.beginPath();
      context.arc(x, y, 2.5, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    drawTrack(width, "#456b63", "#536b70", "rgba(202, 231, 218, 0.28)");
    return;
  }

  if (route.theme === "orchard") {
    context.fillStyle = "#f4d5ac";
    context.fillRect(0, 0, width, 540);
    context.fillStyle = "#ef9b58";
    context.beginPath();
    context.arc(width - 105, 92, 43, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#a8bd72";
    context.beginPath();
    context.moveTo(0, 380);
    context.quadraticCurveTo(width * 0.28 - travelShift * 0.05, 270, width * 0.58, 382);
    context.quadraticCurveTo(width * 0.78 - travelShift * 0.04, 305, width, 370);
    context.lineTo(width, 430);
    context.lineTo(0, 430);
    context.fill();
    for (let index = -1; index < Math.ceil(width / 170) + 2; index += 1) {
      const x = wrappedScreenX(index * 170 - travelShift * 0.18, width + 220) - 90;
      context.fillStyle = "#6f714c";
      context.fillRect(x - 6, 294, 12, 120);
      context.fillStyle = index % 2 ? "#678d51" : "#759d53";
      context.beginPath();
      context.arc(x, 286, 48, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#d9514e";
      context.beginPath();
      context.arc(x - 17, 280, 5, 0, Math.PI * 2);
      context.arc(x + 19, 267, 5, 0, Math.PI * 2);
      context.fill();
    }
    drawTrack(width, "#769d53", "#c79b63", "rgba(83, 81, 57, 0.25)");
    return;
  }

  if (route.theme === "snow") {
    context.fillStyle = "#d9edf2";
    context.fillRect(0, 0, width, 540);
    context.fillStyle = "#fff4c8";
    context.beginPath();
    context.arc(width * 0.22, 85, 38, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#9dbdca";
    for (let index = -1; index < 5; index += 1) {
      const x = index * 310 - (travelShift * 0.08) % 310;
      context.beginPath();
      context.moveTo(x, 390);
      context.lineTo(x + 155, 185 + (index % 2) * 35);
      context.lineTo(x + 330, 390);
      context.fill();
      context.fillStyle = "#f8fbf8";
      context.beginPath();
      context.moveTo(x + 95, 267);
      context.lineTo(x + 155, 185 + (index % 2) * 35);
      context.lineTo(x + 218, 273);
      context.fill();
      context.fillStyle = "#9dbdca";
    }
    for (let index = 0; index < Math.ceil(width / 190) + 2; index += 1) {
      const x = wrappedScreenX(index * 190 - travelShift * 0.16, width + 220) - 70;
      context.fillStyle = "#486f72";
      context.fillRect(x - 4, 322, 8, 94);
      context.beginPath();
      context.moveTo(x, 270);
      context.lineTo(x - 34, 355);
      context.lineTo(x + 34, 355);
      context.fill();
    }
    drawTrack(width, "#eff6f3", "#a9c9d2", "rgba(67, 105, 116, 0.28)");
    return;
  }

  if (route.theme === "farm") {
    context.fillStyle = "#efb19a";
    context.fillRect(0, 0, width, 540);
    context.fillStyle = "#ffd574";
    context.beginPath();
    context.arc(width - 110, 105, 52, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#a37a75";
    context.beginPath();
    context.moveTo(0, 385);
    context.quadraticCurveTo(width * 0.25 - travelShift * 0.05, 285, width * 0.52, 385);
    context.quadraticCurveTo(width * 0.78 - travelShift * 0.03, 315, width, 375);
    context.lineTo(width, 430);
    context.lineTo(0, 430);
    context.fill();
    const barnX = wrappedScreenX(width * 0.68 - travelShift * 0.1, width + 430) - 110;
    context.fillStyle = "#a64f43";
    context.fillRect(barnX, 285, 130, 132);
    context.beginPath();
    context.moveTo(barnX - 18, 292);
    context.lineTo(barnX + 65, 225);
    context.lineTo(barnX + 148, 292);
    context.fill();
    context.fillStyle = "#f6d493";
    context.fillRect(barnX + 43, 346, 44, 71);
    drawTrack(width, "#a69b58", "#b78055", "rgba(87, 68, 51, 0.28)");
    return;
  }

  if (route.theme === "hollow") {
    context.fillStyle = "#172d35";
    context.fillRect(0, 0, width, 540);
    context.fillStyle = "#e9e3ad";
    context.beginPath();
    context.arc(width * 0.76, 88, 36, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#263f42";
    for (let index = -1; index < Math.ceil(width / 145) + 2; index += 1) {
      const x = wrappedScreenX(index * 145 - travelShift * 0.12, width + 190) - 70;
      context.fillRect(x - 10, 110 + (index % 3) * 35, 20, 310);
      context.beginPath();
      context.arc(x, 116 + (index % 3) * 35, 58, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#8fd8a4";
    for (let index = 0; index < 18; index += 1) {
      const x = wrappedScreenX(index * 127 - travelShift * 0.2, width + 120) - 40;
      const y = 145 + (index * 61) % 220;
      context.globalAlpha = 0.45 + (index % 4) * 0.13;
      context.beginPath();
      context.arc(x, y, 2.8, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    drawTrack(width, "#355d50", "#48585a", "rgba(155, 215, 172, 0.24)");
    return;
  }

  context.fillStyle = "#c9e7e5";
  context.fillRect(0, 0, width, 540);
  context.fillStyle = "#f4cb67";
  context.beginPath();
  context.arc(width - 88, 84, 42, 0, Math.PI * 2);
  context.fill();
  const cloudShift = reducedMotion ? 0 : camera * 0.08;
  drawCloud(115 - (cloudShift % (width + 260)), 86, 0.82);
  drawCloud(width * 0.55 - (cloudShift * 0.55) % (width + 300), 138, 0.62);
  drawCloud(width + 95 - (cloudShift % (width + 340)), 67, 0.74);
  const hillShift = reducedMotion ? 0 : camera * 0.14;
  context.fillStyle = "#9ac488";
  context.beginPath();
  context.moveTo(0, 370);
  context.quadraticCurveTo(width * 0.18 - (hillShift % 90), 255, width * 0.42, 368);
  context.quadraticCurveTo(width * 0.72 - (hillShift % 130), 238, width, 360);
  context.lineTo(width, 430);
  context.lineTo(0, 430);
  context.fill();
  context.fillStyle = "#75a76b";
  context.beginPath();
  context.moveTo(0, 390);
  context.quadraticCurveTo(width * 0.28 + (hillShift % 70), 305, width * 0.6, 392);
  context.quadraticCurveTo(width * 0.82, 325, width, 385);
  context.lineTo(width, 440);
  context.lineTo(0, 440);
  context.fill();
  drawTrack(width, "#79ad68", "#d8b66e", "rgba(88, 95, 67, 0.28)");
}

function drawRouteDecor(camera, width) {
  const theme = activeRoute().theme;
  const first = Math.floor(camera / 190) * 190;
  for (let worldX = first; worldX < camera + width + 200; worldX += 190) {
    const x = projectWorldX(worldX, camera);
    const offset = (Math.floor(worldX / 190) % 3) * 8;
    if (theme === "snow") {
      context.fillStyle = "rgba(255, 255, 255, 0.82)";
      context.beginPath();
      context.arc(x, COURSE.groundY - 18 - offset, 4, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    if (theme === "marsh") {
      context.strokeStyle = "#729b77";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(x, COURSE.groundY + 4);
      context.lineTo(x - 5, COURSE.groundY - 27 - offset);
      context.moveTo(x + 5, COURSE.groundY + 4);
      context.lineTo(x + 10, COURSE.groundY - 20 - offset);
      context.stroke();
      continue;
    }
    if (theme === "farm") {
      context.strokeStyle = "#806f43";
      context.lineWidth = 3;
      for (let stem = -1; stem <= 1; stem += 1) {
        context.beginPath();
        context.moveTo(x + stem * 6, COURSE.groundY + 4);
        context.lineTo(x + stem * 4, COURSE.groundY - 21 - offset);
        context.stroke();
      }
      continue;
    }
    if (theme === "hollow") {
      context.fillStyle = Math.floor(worldX / 190) % 2 ? "#8fd8a4" : "#f1c96f";
      context.beginPath();
      context.arc(x, COURSE.groundY - 22 - offset, 3.5, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.strokeStyle = theme === "orchard" ? "#5e824f" : "#527c55";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x, COURSE.groundY + 5);
    context.lineTo(x, COURSE.groundY - 13 - offset);
    context.stroke();
    context.fillStyle = theme === "orchard"
      ? Math.floor(worldX / 190) % 2 ? "#fff2c3" : "#f49a89"
      : Math.floor(worldX / 190) % 2 ? "#fff8dc" : "#ef7962";
    context.beginPath();
    context.arc(x, COURSE.groundY - 17 - offset, 5, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCarrots(camera) {
  if (!state.player) return;
  for (const carrot of state.carrots) {
    const playerNeedsCarrot = !state.player.collectedCarrots.has(carrot.id);
    const ghostNeedsCarrot = Boolean(
      state.ghostRunner && !state.ghostRunner.collectedCarrots.has(carrot.id),
    );
    if (!playerNeedsCarrot && !ghostNeedsCarrot) continue;
    const ghostOnly = !playerNeedsCarrot && ghostNeedsCarrot;
    const x = projectWorldX(carrot.x, camera);
    if (x < -30 || x > state.view.virtualWidth + 30) continue;
    const y = COURSE.groundY - carrot.y;
    const bob = reducedMotion ? 0 : Math.sin((state.tick + carrot.x) * 0.08) * 3;
    context.save();
    context.globalAlpha = ghostOnly ? 0.3 : 1;
    context.translate(x, y + bob);
    context.rotate(0.12);
    if (ghostOnly) {
      context.strokeStyle = "#78a9bd";
      context.lineWidth = 2;
      context.setLineDash([4, 4]);
      context.beginPath();
      context.arc(0, -1, 19, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    if (carrot.y > 180) {
      context.strokeStyle = "rgba(255, 250, 240, 0.9)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, -1, 18, 0, Math.PI * 2);
      context.stroke();
    }
    context.strokeStyle = "#344057";
    context.lineWidth = 2;
    context.fillStyle = "#ef8a3c";
    context.beginPath();
    context.moveTo(-7, -9);
    context.quadraticCurveTo(0, -14, 7, -9);
    context.lineTo(1, 13);
    context.quadraticCurveTo(0, 16, -2, 13);
    context.closePath();
    context.fill();
    context.stroke();
    context.strokeStyle = "#527c55";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, -10);
    context.lineTo(-7, -18);
    context.moveTo(1, -10);
    context.lineTo(8, -17);
    context.stroke();
    context.restore();
  }
}

function drawWorldFx(camera) {
  for (const particle of state.worldFx) {
    const x = projectWorldX(particle.x, camera);
    const y = COURSE.groundY - particle.y;
    const progress = particle.age / particle.life;
    context.save();
    context.globalAlpha = Math.max(0, 1 - progress);
    if (particle.kind === "ring") {
      context.strokeStyle = "#efbd55";
      context.lineWidth = 3 - progress * 2;
      context.beginPath();
      context.arc(x, y, 8 + progress * 28, 0, Math.PI * 2);
      context.stroke();
    } else {
      context.translate(x, y);
      context.rotate(progress * 4 + particle.vx);
      context.fillStyle = particle.kind === "carrot"
        ? particle.age % 2 === 0 ? "#efbd55" : "#ef7962"
        : particle.kind === "splash"
          ? particle.age % 2 === 0 ? "#83ced4" : "#d8f3ed"
          : "#b78b5c";
      context.fillRect(-4, -3, 8, 6);
    }
    context.restore();
  }
}

function drawObstacle(obstacle, screenX) {
  const bottom = COURSE.groundY + 2;
  context.save();
  if (activeRoute().direction < 0) {
    context.translate(screenX + obstacle.width, 0);
    context.scale(-1, 1);
    screenX = 0;
  }
  context.lineWidth = 3;
  context.strokeStyle = "#344057";

  if (obstacle.kind === "log") {
    context.fillStyle = "#9d6746";
    roundedRect(context, screenX, bottom - obstacle.height, obstacle.width, obstacle.height, 17);
    context.fill();
    context.stroke();
    context.fillStyle = "#d39a63";
    context.beginPath();
    context.ellipse(screenX + obstacle.width - 8, bottom - obstacle.height / 2, 9, obstacle.height / 2 - 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  } else if (obstacle.kind === "hay") {
    context.fillStyle = "#efbd55";
    roundedRect(context, screenX, bottom - obstacle.height, obstacle.width, obstacle.height, 8);
    context.fill();
    context.stroke();
    context.strokeStyle = "#aa733b";
    context.beginPath();
    context.moveTo(screenX + obstacle.width * 0.35, bottom - obstacle.height);
    context.lineTo(screenX + obstacle.width * 0.35, bottom);
    context.moveTo(screenX + obstacle.width * 0.7, bottom - obstacle.height);
    context.lineTo(screenX + obstacle.width * 0.7, bottom);
    context.stroke();
  } else if (obstacle.kind === "mushrooms") {
    for (let i = 0; i < 3; i += 1) {
      const mushroomX = screenX + 7 + i * 15;
      const mushroomHeight = obstacle.height - (i % 2) * 8;
      context.fillStyle = "#fff7df";
      context.fillRect(mushroomX + 3, bottom - mushroomHeight + 12, 7, mushroomHeight - 12);
      context.fillStyle = i === 1 ? "#efbd55" : "#ef7962";
      context.beginPath();
      context.arc(mushroomX + 7, bottom - mushroomHeight + 12, 10, Math.PI, 0);
      context.closePath();
      context.fill();
      context.stroke();
    }
  } else if (obstacle.kind === "puddle") {
    context.fillStyle = "#5fa7ad";
    context.beginPath();
    context.ellipse(
      screenX + obstacle.width / 2,
      bottom - 4,
      obstacle.width / 2,
      obstacle.height,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(231, 250, 243, 0.72)";
    context.beginPath();
    context.moveTo(screenX + 18, bottom - 7);
    context.lineTo(screenX + obstacle.width - 20, bottom - 7);
    context.stroke();
  } else if (obstacle.kind === "stone") {
    context.fillStyle = activeRoute().theme === "snow" ? "#849da8" : "#77827d";
    context.beginPath();
    context.ellipse(
      screenX + obstacle.width * 0.5,
      bottom - obstacle.height * 0.42,
      obstacle.width * 0.5,
      obstacle.height * 0.58,
      -0.08,
      Math.PI,
      Math.PI * 2,
    );
    context.lineTo(screenX + obstacle.width, bottom);
    context.lineTo(screenX, bottom);
    context.closePath();
    context.fill();
    context.stroke();
  } else if (obstacle.kind === "stump") {
    context.fillStyle = "#8f5d43";
    roundedRect(context, screenX, bottom - obstacle.height + 8, obstacle.width, obstacle.height - 8, 9);
    context.fill();
    context.stroke();
    context.fillStyle = "#d69a63";
    context.beginPath();
    context.ellipse(screenX + obstacle.width / 2, bottom - obstacle.height + 9, obstacle.width / 2, 10, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(screenX + obstacle.width / 2, bottom - obstacle.height + 9, obstacle.width / 4, 5, 0, 0, Math.PI * 2);
    context.stroke();
  } else if (obstacle.kind === "crate") {
    context.fillStyle = "#c17b4d";
    roundedRect(context, screenX, bottom - obstacle.height, obstacle.width, obstacle.height, 4);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(screenX + 7, bottom - obstacle.height + 7);
    context.lineTo(screenX + obstacle.width - 7, bottom - 7);
    context.moveTo(screenX + obstacle.width - 7, bottom - obstacle.height + 7);
    context.lineTo(screenX + 7, bottom - 7);
    context.stroke();
  } else if (obstacle.kind === "fence") {
    context.fillStyle = "#f2d39a";
    context.fillRect(screenX + 5, bottom - obstacle.height, 12, obstacle.height);
    context.fillRect(screenX + obstacle.width - 17, bottom - obstacle.height, 12, obstacle.height);
    context.fillRect(screenX, bottom - obstacle.height * 0.68, obstacle.width, 12);
    context.fillRect(screenX, bottom - obstacle.height * 0.35, obstacle.width, 12);
    context.strokeRect(screenX + 5, bottom - obstacle.height, 12, obstacle.height);
    context.strokeRect(screenX + obstacle.width - 17, bottom - obstacle.height, 12, obstacle.height);
    context.strokeRect(screenX, bottom - obstacle.height * 0.68, obstacle.width, 12);
    context.strokeRect(screenX, bottom - obstacle.height * 0.35, obstacle.width, 12);
  } else if (obstacle.kind === "spring") {
    context.shadowColor = activeRoute().theme === "hollow" ? "#8fd8a4" : "#ef7996";
    context.shadowBlur = 13;
    context.fillStyle = "#fff3dc";
    context.fillRect(
      screenX + obstacle.width * 0.42,
      bottom - obstacle.height + 8,
      obstacle.width * 0.16,
      obstacle.height - 8,
    );
    context.fillStyle = activeRoute().theme === "hollow" ? "#8fd8a4" : "#ef7996";
    context.beginPath();
    context.ellipse(
      screenX + obstacle.width / 2,
      bottom - obstacle.height + 10,
      obstacle.width / 2,
      14,
      0,
      Math.PI,
      Math.PI * 2,
    );
    context.closePath();
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.strokeStyle = "#fffaf0";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(screenX + obstacle.width / 2, bottom - obstacle.height - 13);
    context.lineTo(screenX + obstacle.width / 2, bottom - obstacle.height - 2);
    context.moveTo(screenX + obstacle.width / 2 - 6, bottom - obstacle.height - 8);
    context.lineTo(screenX + obstacle.width / 2, bottom - obstacle.height - 14);
    context.lineTo(screenX + obstacle.width / 2 + 6, bottom - obstacle.height - 8);
    context.stroke();
  } else if (obstacle.kind === "snowbank") {
    context.fillStyle = "#f8fbf8";
    context.beginPath();
    context.moveTo(screenX, bottom);
    context.quadraticCurveTo(
      screenX + obstacle.width * 0.25,
      bottom - obstacle.height * 1.15,
      screenX + obstacle.width * 0.54,
      bottom - obstacle.height * 0.7,
    );
    context.quadraticCurveTo(
      screenX + obstacle.width * 0.78,
      bottom - obstacle.height * 1.05,
      screenX + obstacle.width,
      bottom,
    );
    context.closePath();
    context.fill();
    context.stroke();
  } else if (obstacle.kind === "ice") {
    context.fillStyle = "#78c8dc";
    roundedRect(context, screenX, bottom - obstacle.height, obstacle.width, obstacle.height, 6);
    context.fill();
    context.stroke();
    context.strokeStyle = "#e6fbff";
    context.lineWidth = 3;
    for (let offset = 18; offset < obstacle.width - 8; offset += 28) {
      context.beginPath();
      context.moveTo(screenX + offset - 7, bottom - obstacle.height + 3);
      context.lineTo(screenX + offset, bottom - obstacle.height / 2);
      context.lineTo(screenX + offset - 7, bottom - 3);
      context.stroke();
    }
  } else if (obstacle.kind === "barrel") {
    context.fillStyle = "#ad6545";
    roundedRect(context, screenX, bottom - obstacle.height, obstacle.width, obstacle.height, obstacle.width / 2);
    context.fill();
    context.stroke();
    context.strokeStyle = "#efd095";
    context.beginPath();
    context.moveTo(screenX + 7, bottom - obstacle.height * 0.68);
    context.lineTo(screenX + obstacle.width - 7, bottom - obstacle.height * 0.68);
    context.moveTo(screenX + 7, bottom - obstacle.height * 0.3);
    context.lineTo(screenX + obstacle.width - 7, bottom - obstacle.height * 0.3);
    context.stroke();
  } else if (obstacle.kind === "root") {
    context.fillStyle = "#79553d";
    context.beginPath();
    context.moveTo(screenX, bottom);
    context.quadraticCurveTo(
      screenX + obstacle.width * 0.22,
      bottom - obstacle.height,
      screenX + obstacle.width * 0.48,
      bottom - obstacle.height * 0.55,
    );
    context.quadraticCurveTo(
      screenX + obstacle.width * 0.72,
      bottom - obstacle.height * 1.05,
      screenX + obstacle.width,
      bottom,
    );
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = "#efbd55";
    for (let offset = 22; offset < obstacle.width - 12; offset += 27) {
      context.beginPath();
      context.moveTo(screenX + offset - 4, bottom - 10);
      context.lineTo(screenX + offset, bottom - 22);
      context.lineTo(screenX + offset + 4, bottom - 10);
      context.closePath();
      context.fill();
      context.stroke();
    }
  } else {
    context.fillStyle = "#ff4fa3";
    context.fillRect(screenX, bottom - obstacle.height, obstacle.width, obstacle.height);
    context.strokeRect(screenX, bottom - obstacle.height, obstacle.width, obstacle.height);
  }
  context.restore();
}

function drawPaceLine(camera) {
  if (
    state.activeRivalKind === "pb" ||
    !Number.isInteger(state.routeBestTick) ||
    !["lap2", "flourish", "finished"].includes(state.mode)
  ) {
    return;
  }
  const progress = Math.max(0, Math.min(1, state.tick / state.routeBestTick));
  const worldX = 110 + (COURSE.finishX - 110) * progress;
  const x = projectWorldX(worldX, camera);
  if (x < -30 || x > state.view.virtualWidth + 30) return;
  context.save();
  context.strokeStyle = "rgba(255, 250, 240, 0.9)";
  context.lineWidth = 4;
  context.setLineDash([9, 8]);
  context.beginPath();
  context.moveTo(x, COURSE.groundY + 20);
  context.lineTo(x, COURSE.groundY - 112);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "rgba(52, 64, 87, 0.82)";
  context.font = "900 10px ui-rounded, system-ui";
  context.textAlign = "center";
  context.fillText("PB PACE", x, COURSE.groundY - 121);
  context.restore();
}

function drawFinish(camera) {
  const direction = activeRoute().direction;
  const x = projectWorldX(COURSE.finishX, camera);
  if (x < -80 || x > state.view.virtualWidth + 80) return;
  context.save();
  context.translate(x, 0);
  context.scale(direction, 1);
  context.strokeStyle = "#344057";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(0, COURSE.groundY + 24);
  context.lineTo(0, COURSE.groundY - 125);
  context.stroke();
  const size = 18;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      context.fillStyle = (row + column) % 2 ? "#fffaf0" : "#344057";
      context.fillRect(column * size, COURSE.groundY - 125 + row * size, size, size);
    }
  }
  context.strokeRect(0, COURSE.groundY - 125, size * 3, size * 4);
  context.restore();
}

function drawRunner(runner, camera, ghost = false, now = performance.now()) {
  if (!runner) return;
  const direction = activeRoute().direction;
  const celebratingWin = !ghost &&
    (state.mode === "flourish" || state.mode === "finished") &&
    state.resultFx?.outcome === "win";
  let celebrationLift = 0;
  let celebrationProgress = 0;
  if (celebratingWin) {
    const elapsed = Math.max(0, now - state.resultFx.startedAt);
    celebrationProgress = Math.max(0, Math.min(1, elapsed / 700));
  }
  if (state.mode === "flourish" && celebratingWin && !reducedMotion) {
    const progress = celebrationProgress;
    celebrationLift = Math.sin(progress * Math.PI) * 46;
  }
  const celebrationNudge = celebratingWin
    ? (reducedMotion
        ? 65
        : Math.sin(Math.min(1, celebrationProgress * 3) * Math.PI / 2) * 65)
    : 0;
  const x = projectWorldX(runner.x + 18, camera) + direction * celebrationNudge;
  const ground = COURSE.groundY - runner.y - celebrationLift;
  if (x < -90 || x > state.view.virtualWidth + 90) return;

  const racing = state.mode === "lap1" || state.mode === "lap2";
  const visualTick = racing
    ? state.tick + Math.min(1, state.accumulator / COURSE.tickMs)
    : now / COURSE.tickMs;
  const phase = visualTick * 0.46 + (ghost ? 1.8 : 0);
  const grounded = runner.onGround && runner.y <= 0.5;
  const airborne = !grounded || celebrationLift > 0;
  const stumbling = runner.stumbleTicks > 0;
  const boosting = !stumbling && !runner.finished && runner.burstTicks > 0;
  const flapping = runner.flapFlashTicks > 0;
  const stride = reducedMotion || !racing || !grounded || runner.finished
    ? 0
    : Math.sin(phase);
  const idleBreath = reducedMotion || racing
    ? 0
    : Math.sin(now / 620 + (ghost ? 1.2 : 0));
  const groundBeat = Math.abs(stride);
  const stumbleRatio = Math.min(1, runner.stumbleTicks / 30);
  const smoothstep = (value) => value * value * (3 - 2 * value);
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const stumblePose = smoothstep(stumbleRatio);
  const flapPose = smoothstep(Math.min(1, runner.flapFlashTicks / 10));
  const victoryPose = celebratingWin
    ? (reducedMotion ? 1 : Math.max(0.45, celebrationLift / 46))
    : 0;
  const boostRatio = boosting
    ? Math.min(1, runner.burstTicks / COURSE.burstTicks)
    : 0;
  const chompRatio = Math.min(1, runner.chompTicks / 6);
  const blinkClock = (now + (ghost ? 1300 : 0)) % 3200;
  const blinking = !reducedMotion && !stumbling && blinkClock > 3080;

  let bodyBob = grounded ? -groundBeat * 2.2 : 0;
  if (!racing && grounded) bodyBob = idleBreath * 0.65;
  if (stumbling && !reducedMotion) bodyBob += Math.sin(phase * 2.5) * 1.2;
  const squash = grounded && racing && !reducedMotion
    ? Math.max(0, Math.cos(phase * 2)) * 0.035
    : 0;
  let poseTilt = stumbling ? -0.27 * stumblePose : 0;
  if (boosting) poseTilt += 0.12 * boostRatio;
  if (airborne && !stumbling) {
    poseTilt += Math.max(-0.07, Math.min(0.1, runner.velocityY * 0.009));
  }
  if (flapping) poseTilt -= 0.05 * flapPose;

  const signedDna = ghost && state.activeRivalKind === "signed" ? state.rivalDna : null;
  const rabbitFill = ghost ? signedDna?.palette.body || "#f8ffff" : "#ef7962";
  const rabbitLight = ghost ? signedDna?.palette.light || "rgba(201, 231, 229, 0.82)" : "#f58d78";
  const innerEarFill = ghost ? signedDna?.palette.ear || "rgba(120, 169, 189, 0.42)" : "#f8b09a";
  const outline = ghost ? "#40728e" : "#344057";
  const scarf = ghost ? signedDna?.palette.scarf || "#78a9bd" : "#efbd55";
  const ghostAlpha = signedDna ? 0.58 : 0.44;

  context.save();
  context.translate(x, ground - 4);
  context.scale(direction, 1);
  context.globalAlpha = ghost
    ? state.mode === "flourish" && state.resultFx?.outcome === "tie" ? 0.74 : ghostAlpha
    : 1;
  context.strokeStyle = outline;
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (ghost && !reducedMotion) {
    context.fillStyle = signedDna?.palette.trail || "rgba(255, 255, 255, 0.42)";
    for (let i = 1; i <= 3; i += 1) {
      const trailX = -i * 18;
      const trailY = -25 + i * 2;
      const size = 9 - i;
      context.save();
      context.translate(trailX, trailY);
      if (signedDna?.trail === "diamonds") {
        context.rotate(Math.PI / 4);
        context.fillRect(-size / 2, -size / 2, size, size);
      } else if (signedDna?.trail === "sparks") {
        context.fillRect(-1.5, -size, 3, size * 2);
        context.fillRect(-size, -1.5, size * 2, 3);
      } else {
        context.beginPath();
        context.arc(0, 0, size, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
  }

  if (boosting) {
    context.globalAlpha = ghost ? 0.32 : 0.72;
    context.strokeStyle = scarf;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-26, -42);
    context.lineTo(-58, -42);
    context.moveTo(-21, -27);
    context.lineTo(-48, -22);
    context.stroke();
    context.globalAlpha = ghost ? ghostAlpha : 1;
  }

  context.save();
  context.translate(0, bodyBob);
  context.rotate(poseTilt);

  // The scarf tails sit behind the body, so they read as clothing rather than
  // a yellow line through the rabbit's mouth.
  const scarfWave = reducedMotion ? 0 : stride * 4 - boostRatio * 6;
  context.strokeStyle = scarf;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-8, -48);
  context.quadraticCurveTo(-19, -48 + scarfWave * 0.2, -29, -52 + scarfWave);
  context.moveTo(-9, -45);
  context.quadraticCurveTo(-20, -42 - scarfWave * 0.15, -27, -40 - scarfWave * 0.45);
  context.stroke();

  // Cotton tail and paws make the silhouette readable even on a small phone.
  const tailBob = reducedMotion ? 0 : -stride * 1.8 - boostRatio * 2;
  context.fillStyle = ghost ? signedDna?.palette.light || "#e6f8f7" : "#fff2dc";
  context.strokeStyle = outline;
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(-25.5, -33 + tailBob, 10.5, 10, -0.18, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  let rearPaw = { x: -12 + stride * 6, y: -2, rotation: 0.28 + stride * 0.12 };
  let frontPaw = { x: 11 - stride * 6, y: -2, rotation: -0.2 - stride * 0.12 };
  if (!grounded) {
    const rising = runner.velocityY >= 0;
    rearPaw = {
      x: rising ? -11 : -15,
      y: rising ? -14 : -7,
      rotation: rising ? -0.55 : 0.35,
    };
    frontPaw = {
      x: rising ? 9 : 15,
      y: rising ? -12 : -5,
      rotation: rising ? 0.5 : -0.32,
    };
  }
  const victoryHopPose = Math.min(1, celebrationLift / 20);
  rearPaw = {
    x: lerp(rearPaw.x, -11, victoryHopPose),
    y: lerp(rearPaw.y, -14, victoryHopPose),
    rotation: lerp(rearPaw.rotation, -0.55, victoryHopPose),
  };
  frontPaw = {
    x: lerp(frontPaw.x, 9, victoryHopPose),
    y: lerp(frontPaw.y, -12, victoryHopPose),
    rotation: lerp(frontPaw.rotation, 0.5, victoryHopPose),
  };
  rearPaw = {
    x: lerp(rearPaw.x, -17, stumblePose),
    y: lerp(rearPaw.y, -1, stumblePose),
    rotation: lerp(rearPaw.rotation, -0.42, stumblePose),
  };
  frontPaw = {
    x: lerp(frontPaw.x, 16, stumblePose),
    y: lerp(frontPaw.y, -1, stumblePose),
    rotation: lerp(frontPaw.rotation, 0.42, stumblePose),
  };
  const noodleLegs = racing && grounded && !stumbling && !flapping &&
    !runner.finished && !reducedMotion;
  const rearLegWeight = noodleLegs
    ? smoothstep(Math.max(0, Math.min(1, (-stride - 0.15) / 0.85)))
    : 0;
  const frontLegWeight = noodleLegs
    ? smoothstep(Math.max(0, Math.min(1, (stride - 0.15) / 0.85)))
    : 0;
  const boostLegWeight = noodleLegs && boosting
    ? smoothstep(Math.max(0, Math.min(1, runner.burstTicks / 8)))
    : 0;
  // A boost still needs two readable legs, not one fused pink exhaust pipe.
  // Let the natural stride choose the absurdly long leg while its mate trails
  // at half reach, then swap them on the next stride.
  const rearLeadsBoost = stride <= 0;
  const rearBoostWeight = boostLegWeight * (rearLeadsBoost ? 1 : 0.52);
  const frontBoostWeight = boostLegWeight * (rearLeadsBoost ? 0.52 : 1);
  const rearStretch = Math.max(rearLegWeight, rearBoostWeight);
  const frontStretch = Math.max(frontLegWeight, frontBoostWeight);
  rearPaw.x = lerp(rearPaw.x, -54 - rearBoostWeight * 14, rearStretch);
  frontPaw.x = lerp(frontPaw.x, -48 - frontBoostWeight * 14, frontStretch);
  rearPaw.y = lerp(rearPaw.y, rearLeadsBoost ? -1 : -6, rearBoostWeight);
  frontPaw.y = lerp(frontPaw.y, rearLeadsBoost ? -6 : -1, frontBoostWeight);
  rearPaw.radiusX = 9.5 + rearStretch * 3;
  frontPaw.radiusX = 9.5 + frontStretch * 3;

  const drawNoodleLeg = (hipX, paw, weight) => {
    if (weight < 0.02) return;
    const traceLeg = () => {
      context.beginPath();
      context.moveTo(hipX, -11);
      context.bezierCurveTo(
        hipX - 12 * weight,
        -7,
        paw.x + 15,
        -3,
        paw.x,
        paw.y,
      );
      context.stroke();
    };
    context.strokeStyle = outline;
    context.lineWidth = 12;
    traceLeg();
    context.strokeStyle = rabbitFill;
    context.lineWidth = 8;
    traceLeg();
  };
  drawNoodleLeg(-8, rearPaw, rearStretch);
  drawNoodleLeg(8, frontPaw, frontStretch);

  for (const paw of [rearPaw, frontPaw]) {
    context.fillStyle = rabbitFill;
    context.strokeStyle = outline;
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(paw.x, paw.y, paw.radiusX || 9.5, 5, paw.rotation, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  context.fillStyle = rabbitFill;
  context.strokeStyle = outline;
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(
    -1,
    -29,
    24.5 * (1 + squash + chompRatio * 0.018),
    26 * (1 - squash * 0.7),
    -0.1,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.stroke();

  context.fillStyle = rabbitLight;
  context.beginPath();
  context.ellipse(-1, -25, 12.5, 16, -0.08, 0, Math.PI * 2);
  context.fill();

  if (signedDna) {
    context.fillStyle = signedDna.palette.trail;
    context.strokeStyle = signedDna.palette.trail;
    context.lineWidth = 3;
    if (signedDna.pattern === "spot") {
      context.beginPath();
      context.arc(-11, -36, 5.2, 0, Math.PI * 2);
      context.fill();
    } else if (signedDna.pattern === "stripe") {
      context.save();
      context.translate(-6, -31);
      context.rotate(-0.48);
      context.fillRect(-12, -3, 24, 6);
      context.restore();
    } else if (signedDna.pattern === "diamond") {
      context.save();
      context.translate(-10, -35);
      context.rotate(Math.PI / 4);
      context.fillRect(-5, -5, 10, 10);
      context.restore();
    } else {
      context.beginPath();
      context.arc(-10, -34, 7, 0.45 * Math.PI, 1.55 * Math.PI);
      context.stroke();
    }
  }

  const headBob = stride * 0.8 + idleBreath * 0.35 - chompRatio * 1.2;
  const headX = 13 + chompRatio * 0.8;
  const headY = -53 + headBob;
  let rearEarAngle = -0.38 - stride * 0.055;
  let frontEarAngle = 0.07 - stride * 0.075 + idleBreath * 0.025;
  if (airborne) {
    const airLean = Math.max(-1, Math.min(1, runner.velocityY / 12));
    rearEarAngle = -0.45 - airLean * 0.16;
    frontEarAngle = -0.12 - airLean * 0.2;
  }
  rearEarAngle = lerp(rearEarAngle, -0.72, boostRatio);
  frontEarAngle = lerp(frontEarAngle, -0.48, boostRatio);
  rearEarAngle = lerp(rearEarAngle, -0.82, flapPose);
  frontEarAngle = lerp(frontEarAngle, 0.38, flapPose);
  rearEarAngle = lerp(rearEarAngle, -1.0, stumblePose);
  frontEarAngle = lerp(frontEarAngle, -0.75, stumblePose);
  rearEarAngle = lerp(rearEarAngle, -0.2, victoryPose);
  frontEarAngle = lerp(frontEarAngle, 0.14, victoryPose);

  const drawEar = (baseX, baseY, radiusX, length, rotation) => {
    context.save();
    context.translate(baseX, baseY);
    context.rotate(rotation);
    context.fillStyle = rabbitFill;
    context.strokeStyle = outline;
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(0, -length / 2, radiusX, length / 2, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = innerEarFill;
    context.beginPath();
    context.ellipse(0, -length / 2 - 1, 2.7, length * 0.32, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };
  drawEar(headX - 6, headY - 11, 7, 30, rearEarAngle);
  drawEar(headX + 5, headY - 12, 7.4, 34, frontEarAngle);

  const headTilt = stride * 0.016 + chompRatio * 0.035 - victoryPose * 0.035;
  context.save();
  context.translate(headX, headY);
  context.rotate(headTilt);
  context.fillStyle = rabbitFill;
  context.strokeStyle = outline;
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(0, 0, 21, 18.5 + chompRatio * 0.6, 0.06, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = innerEarFill;
  context.beginPath();
  context.arc(11.5, 4.5, 2.4 + chompRatio * 0.7, 0, Math.PI * 2);
  context.fill();

  if (celebratingWin) {
    context.strokeStyle = outline;
    context.lineWidth = 2.8;
    context.beginPath();
    context.moveTo(5, -4);
    context.quadraticCurveTo(8.5, -7.8, 12, -4.2);
    context.stroke();
  } else if (blinking || stumbling) {
    context.strokeStyle = outline;
    context.lineWidth = 2.8;
    context.beginPath();
    context.moveTo(5, -5);
    context.quadraticCurveTo(8.5, -2.2, 12, -5.5);
    context.stroke();
  } else {
    context.fillStyle = outline;
    context.beginPath();
    context.ellipse(8, -5, 4, 4.6, 0.08, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fffaf0";
    context.beginPath();
    context.arc(6.9, -6.4, 1.35, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = ghost ? "#40728e" : "#c9535e";
  context.beginPath();
  context.arc(20.3, 2.2, 2.5, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = outline;
  context.lineWidth = 1.8;
  if (celebratingWin) {
    context.beginPath();
    context.moveTo(19, 4.5);
    context.quadraticCurveTo(15.5, 10, 11.8, 5.5);
    context.stroke();
  } else if (chompRatio > 0) {
    context.fillStyle = outline;
    context.beginPath();
    context.ellipse(17.4, 6.3, 2.7, 3.4 + chompRatio, 0.2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(19, 5);
    context.quadraticCurveTo(16, 8.5, 12.8, 6.3);
    context.stroke();
  }
  context.restore();

  // A little forepaw changes pose with the mid-air flap.
  context.fillStyle = rabbitFill;
  context.strokeStyle = outline;
  context.lineWidth = 2.5;
  context.beginPath();
  let forePaw = boosting
    ? { x: 15, y: -31, radiusX: 10, rotation: 0.05 }
    : { x: 9, y: -34, radiusX: 9, rotation: 0.55 + stride * 0.06 };
  forePaw = {
    x: lerp(forePaw.x, 18, flapPose),
    y: lerp(forePaw.y, -40, flapPose),
    radiusX: lerp(forePaw.radiusX, 10, flapPose),
    rotation: lerp(forePaw.rotation, -0.7, flapPose),
  };
  forePaw = {
    x: lerp(forePaw.x, 18, victoryPose),
    y: lerp(forePaw.y, -41, victoryPose),
    radiusX: lerp(forePaw.radiusX, 10, victoryPose),
    rotation: lerp(forePaw.rotation, -0.82, victoryPose),
  };
  context.ellipse(
    forePaw.x,
    forePaw.y,
    forePaw.radiusX,
    4.8,
    forePaw.rotation,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.stroke();

  context.fillStyle = scarf;
  context.strokeStyle = outline;
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(-7, -47, 5.5, 4.5, -0.2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  if (signedDna) {
    context.save();
    context.translate(-7, -47);
    context.fillStyle = signedDna.palette.trail;
    context.strokeStyle = signedDna.palette.trail;
    context.lineWidth = 1.5;
    if (signedDna.pattern === "spot") {
      context.beginPath();
      context.arc(0, 0, 1.8, 0, Math.PI * 2);
      context.fill();
    } else if (signedDna.pattern === "stripe") {
      context.beginPath();
      context.moveTo(-3.5, -2.5);
      context.lineTo(3.5, 2.5);
      context.stroke();
    } else if (signedDna.pattern === "diamond") {
      context.rotate(Math.PI / 4);
      context.fillRect(-2, -2, 4, 4);
    } else {
      context.beginPath();
      context.arc(-0.5, 0, 2.7, 0.45 * Math.PI, 1.55 * Math.PI);
      context.stroke();
    }
    context.restore();
  }
  context.restore();

  if (ghost) {
    context.save();
    context.scale(direction, 1);
    context.globalAlpha = 0.88;
    const rivalTag = state.activeRivalKind === "pb" ? "PB" : state.rivalDna?.tag || "RIVAL";
    context.font = "800 11px ui-rounded, system-ui";
    const labelWidth = Math.max(50, context.measureText(rivalTag).width + 14);
    context.fillStyle = "rgba(255, 250, 240, 0.78)";
    roundedRect(context, -labelWidth / 2, -125, labelWidth, 19, 9.5);
    context.fill();
    context.fillStyle = "#344057";
    context.textAlign = "center";
    context.fillText(rivalTag, 0, -111);
    context.restore();
  }
  context.restore();
}

function drawGhostOverlapMarker(camera) {
  if (
    !state.player ||
    !state.ghostRunner ||
    !["lap2", "flourish", "finished"].includes(state.mode) ||
    Math.abs(state.player.x - state.ghostRunner.x) > 54
  ) {
    return;
  }
  const x = projectWorldX(state.ghostRunner.x + 18, camera);
  const ground = COURSE.groundY - state.ghostRunner.y;
  if (x < -45 || x > state.view.virtualWidth + 45) return;

  context.save();
  context.strokeStyle = "rgba(64, 114, 142, 0.9)";
  context.lineWidth = 3;
  context.setLineDash([7, 5]);
  context.beginPath();
  context.ellipse(x, ground + 3, 31, 9, 0, 0, Math.PI * 2);
  context.stroke();
  const labelY = Math.max(132, ground - 124);
  context.setLineDash([]);
  const overlapLabel = state.activeRivalKind === "pb"
    ? "PB ECHO"
    : state.rivalDna?.tag || "RIVAL";
  context.font = "900 10px ui-rounded, system-ui";
  const labelWidth = Math.max(54, context.measureText(overlapLabel).width + 16);
  context.fillStyle = "rgba(255, 250, 240, 0.94)";
  roundedRect(context, x - labelWidth / 2, labelY, labelWidth, 22, 11);
  context.fill();
  context.stroke();
  context.fillStyle = "#344057";
  context.textAlign = "center";
  context.fillText(overlapLabel, x, labelY + 15);
  context.restore();
}

function drawGhostEdgeMarker(camera) {
  if (
    !state.ghostRunner ||
    !["lap2", "flourish", "finished"].includes(state.mode)
  ) return;
  const screenX = projectWorldX(state.ghostRunner.x + 18, camera);
  const width = state.view.virtualWidth;
  if (screenX >= 48 && screenX <= width - 48) return;
  const leftSide = screenX < width / 2;
  const gapSeconds =
    (Math.abs(state.player.x - state.ghostRunner.x) / COURSE.speed) * (COURSE.tickMs / 1000);
  const rivalName = state.activeRivalKind === "pb" ? "pb" : state.rivalDna?.tag || "rival";
  const label = `${leftSide ? "←" : "→"} ${rivalName} ${gapSeconds.toFixed(1)}s`;
  context.save();
  context.font = "900 12px ui-rounded, system-ui";
  const labelWidth = context.measureText(label).width + 18;
  const x = leftSide ? 12 : width - labelWidth - 12;
  context.fillStyle = "rgba(255, 250, 240, 0.9)";
  context.strokeStyle = "#40728e";
  context.lineWidth = 2;
  roundedRect(context, x, 92, labelWidth, 30, 15);
  context.fill();
  context.stroke();
  context.fillStyle = "#344057";
  context.textAlign = "center";
  context.fillText(label, x + labelWidth / 2, 112);
  context.restore();
}

function cameraPosition() {
  const width = state.view.virtualWidth;
  if (state.mode === "lap2" && state.player && state.ghostRunner) {
    return Math.max(0, state.player.x - width * 0.31);
  }
  if ((state.mode === "flourish" || state.mode === "finished") && state.player) {
    return Math.max(0, state.player.x - width * 0.45);
  }
  if (state.player) return Math.max(0, state.player.x - width * 0.25);
  return 0;
}

function projectWorldX(worldX, camera, route = activeRoute()) {
  const forwardX = worldX - camera;
  return route.direction < 0 ? state.view.virtualWidth - forwardX : forwardX;
}

function projectObstacleX(obstacle, camera, route = activeRoute()) {
  return route.direction < 0
    ? projectWorldX(obstacle.x + obstacle.width, camera, route)
    : projectWorldX(obstacle.x, camera, route);
}

function render(now = performance.now()) {
  const { width, height, scale, dpr, virtualWidth } = state.view;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.scale(scale, scale);

  const camera = cameraPosition();
  drawBackground(camera, virtualWidth);
  drawRouteDecor(camera, virtualWidth);
  drawCarrots(camera);
  for (const obstacle of activeRoute().obstacles) {
    const screenX = projectObstacleX(obstacle, camera);
    if (screenX > -100 && screenX < virtualWidth + 100) drawObstacle(obstacle, screenX);
  }
  drawPaceLine(camera);
  drawFinish(camera);
  drawWorldFx(camera);

  if (state.mode === "lap2" || state.mode === "flourish" || state.mode === "finished") {
    drawRunner(state.ghostRunner, camera, true, now);
  }
  drawRunner(state.player || makeRunner("player"), camera, false, now);
  drawGhostOverlapMarker(camera);
  drawGhostEdgeMarker(camera);
  drawResultFx(now, camera);

  context.restore();
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  elements.canvas.width = Math.round(width * dpr);
  elements.canvas.height = Math.round(height * dpr);
  const scale = height / 540;
  state.view = {
    width,
    height,
    dpr,
    scale,
    virtualWidth: width / scale,
  };
  render();
}

function animationFrame(now) {
  const delta = Math.min(100, Math.max(0, now - state.lastFrame));
  state.lastFrame = now;
  if (state.mode === "lap1" || state.mode === "lap2") {
    state.accumulator += delta;
    while (state.accumulator >= COURSE.tickMs) {
      updateTick();
      state.accumulator -= COURSE.tickMs;
      if (state.mode !== "lap1" && state.mode !== "lap2") break;
    }
  }
  render(now);
  window.requestAnimationFrame(animationFrame);
}

elements.refreshStatus.addEventListener("click", loadStatus);
elements.tamperTestButton.addEventListener("click", runTamperTest);
elements.importRivalButton.addEventListener("click", () => elements.importRivalFile.click());
elements.importRivalFile.addEventListener("change", async () => {
  const file = elements.importRivalFile.files && elements.importRivalFile.files[0];
  await importRivalFile(file);
  elements.importRivalFile.value = "";
});
elements.exportRivalButton.addEventListener("click", () => {
  if (!downloadRival()) return;
  setRivalFileStatus("Signed rival exported. The JSON contains public proof and no PIN or private key.");
});
elements.forgetRivalButton.addEventListener("click", forgetBrowserRival);
elements.downloadProofButton.addEventListener("click", () => {
  if (!downloadRival()) return;
  elements.downloadProofButton.textContent = "Downloaded";
  window.setTimeout(() => { elements.downloadProofButton.textContent = "Download JSON"; }, 1200);
});
elements.copyProofButton.addEventListener("click", async () => {
  try {
    if (!await copyRivalProof()) throw new Error("Copy is unavailable in this browser.");
    elements.copyProofButton.textContent = "Copied";
    window.setTimeout(() => { elements.copyProofButton.textContent = "Copy JSON"; }, 1200);
  } catch (error) {
    elements.copyProofButton.textContent = "Copy failed";
    setAnnouncer(error.message);
  }
});
elements.previousRoute.addEventListener("click", () => moveCaptureRoute(-1));
elements.nextRoute.addEventListener("click", () => moveCaptureRoute(1));

elements.startButton.addEventListener("click", () => {
  if (state.soundEnabled) unlockGameAudio();
  if (state.restoringGhost || state.restoreBlocked) return;
  if (state.ghost && !state.captureIntent) {
    const challengeRouteIndex = hasCompleteTrailBook()
      ? routeIndexForSignedCourse(state.challengeRouteId)
      : -1;
    beginLap("lap2", challengeRouteIndex >= 0
      ? { routeIndexOverride: challengeRouteIndex, freeRoute: true }
      : {});
    return;
  }
  if (!isHardwareReady()) {
    elements.setupCard.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    const setupTarget = !elements.pinForm.hidden
      ? elements.initialPin
      : !elements.enrollForm.hidden
        ? elements.enrollPin
        : elements.setupCard;
    window.setTimeout(() => setupTarget.focus({ preventScroll: true }), reducedMotion ? 0 : 220);
    setAnnouncer(`${elements.setupTitle.textContent}. ${elements.setupDescription.textContent}`);
    return;
  }
  beginLap("lap1");
});

elements.canvas.addEventListener("pointerdown", queuePress);

elements.soundToggle.addEventListener("click", () => {
  setSoundEnabled(!state.soundEnabled);
  setAnnouncer(state.soundEnabled ? "Game sounds on." : "Game sounds off.");
});

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(
    target.closest("input, textarea, select, button, a, summary, [contenteditable]:not([contenteditable='false'])"),
  );
}

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" && event.code !== "ArrowUp") return;
  if (isInteractiveTarget(event.target)) return;
  const gameplayFocus = (
    event.target === document.body ||
    event.target === document.documentElement ||
    event.target === elements.canvas
  );
  if (!gameplayFocus) return;
  if (event.repeat) {
    if (
      ["countdown", "lap1", "lap2", "flourish"].includes(state.mode) ||
      event.target === elements.canvas
    ) event.preventDefault();
    return;
  }
  if (state.mode === "lap1" || state.mode === "lap2") {
    queuePress(event);
    return;
  }
  if (
    state.mode === "countdown" ||
    state.mode === "flourish" ||
    event.target === elements.canvas
  ) {
    event.preventDefault();
    return;
  }
  queuePress(event);
});

elements.signForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pin = elements.signPin.value;
  elements.signPin.value = "";
  if (pin.length < 4 || pin.length > 63) {
    elements.signCopy.textContent = state.mock
      ? "Enter the 4–63 character practice PIN, then try again."
      : "Enter the 4–63 character FIDO PIN, then try again.";
    elements.signPin.focus();
    return;
  }
  await signFirstLap(pin);
});

elements.raceAgainButton.addEventListener("click", () => beginLap("lap2"));
elements.promotePbButton.addEventListener("click", beginPbPromotion);
elements.viewProofButton.addEventListener("click", () => {
  if (!state.ghost) return;
  elements.keyStory.open = true;
  elements.keyStory.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  const summary = elements.keyStory.querySelector("summary");
  window.setTimeout(() => summary?.focus({ preventScroll: true }), reducedMotion ? 0 : 220);
  setAnnouncer(state.ghost.mode === "hardware"
    ? "Opened the locally verified signed rival proof."
    : "Opened the software practice proof.");
});

elements.retryRouteButton.addEventListener("click", () => {
  if (!Number.isInteger(state.lastCompletedHeat) || !Number.isInteger(state.lastCompletedRouteIndex)) {
    return;
  }
  beginLap("lap2", {
    heatOverride: state.lastCompletedHeat,
    routeRetry: true,
    routeIndexOverride: state.lastCompletedRouteIndex,
  });
});

elements.chooseTrailButton.addEventListener("click", () => {
  if (!state.ghost || !hasCompleteTrailBook()) return;
  state.challengeRouteId = activeRoute().id;
  state.mode = "intro";
  state.player = makeRunner("player");
  elements.gameHud.hidden = true;
  renderIntroState();
  setPanel(elements.introPanel);
  elements.canvasWrap.scrollIntoView({ behavior: "auto", block: "start" });
  elements.captureRoutePicker.focus?.({ preventScroll: true });
  elements.startButton.focus({ preventScroll: true });
  setAnnouncer(`Choose any trail. Scheduled Heat ${state.currentHeat} will wait.`);
});

elements.newGhostButton.addEventListener("click", () => {
  if (!isHardwareReady()) {
    elements.finishNote.textContent = state.mock
      ? "Restart the matching software practice signer before replacing this rival."
      : "Plug in the enrolled key and press Refresh before replacing this rival.";
    loadStatus();
    return;
  }
  state.captureIntent = true;
  state.challengeRouteId = null;
  state.firstFinishTick = null;
  state.recordedRouteId = null;
  state.captureRouteId = activeRoute().id;
  state.mode = "intro";
  state.player = makeRunner("player");
  elements.gameHud.hidden = true;
  renderIntroState();
  setPanel(elements.introPanel);
  elements.canvasWrap.scrollIntoView({ behavior: "auto", block: "start" });
  elements.startButton.focus({ preventScroll: true });
  setAnnouncer("Choose a trail for the replacement rival. The saved rival is untouched.");
});

elements.keepRivalButton.addEventListener("click", () => {
  elements.signPin.value = "";
  const canceledPbPromotion = state.pendingSignKind === "pb";
  state.pendingSignKind = null;
  state.captureIntent = false;
  state.captureRouteId = HEAT_ROUTES[signedRouteIndex()].id;
  state.recordedRouteId = state.ghost.replay.course_id;
  if (canceledPbPromotion) {
    state.mode = "finished";
    elements.gameHud.hidden = true;
    setPanel(elements.finishPanel);
    elements.promotePbButton.focus({ preventScroll: true });
    setAnnouncer("Kept your current signed rival. The faster local PB is still in your PB book.");
    return;
  }
  state.mode = "intro";
  state.player = makeRunner("player");
  elements.gameHud.hidden = true;
  renderIntroState();
  if (state.status) renderSetup(statusFacts(state.status));
  setPanel(elements.introPanel);
  setAnnouncer("Your current verified rival is still waiting.");
});

for (const button of elements.pinCommandButtons) {
  button.addEventListener("click", async () => {
    const command = byId(button.dataset.copyCommand);
    const label = button.dataset.copyLabel || "PIN setup command";
    if (!command) return;
    const originalLabel = button.textContent;
    try {
      const copied = await copyText(command.textContent.trim());
      if (!copied) throw new Error("Clipboard unavailable");
      button.textContent = "Copied";
      setAnnouncer(`${label} copied.`);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(command);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Selected";
      setAnnouncer(`${label} selected. Copy it with your browser or keyboard.`);
    }
    window.setTimeout(() => { button.textContent = originalLabel; }, 1400);
  });
}

elements.pinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.setupSubmitting) return;
  state.setupSubmitting = true;
  const pin = elements.initialPin.value;
  const confirmPin = elements.initialPinConfirm.value;
  elements.initialPin.value = "";
  elements.initialPinConfirm.value = "";
  if (pin !== confirmPin) {
    state.setupSubmitting = false;
    elements.setupDescription.textContent = state.mock
      ? "Those PIN entries did not match. The software practice key was not changed."
      : "Those PIN entries did not match. The key was not changed.";
    elements.initialPin.focus();
    return;
  }
  elements.setupDescription.textContent = state.mock
    ? "Protecting the software practice key…"
    : "Setting the FIDO PIN…";
  try {
    await api(API.pin, { method: "POST", body: { pin, confirm_pin: confirmPin } });
    await loadStatus();
    if (!elements.enrollForm.hidden) {
      elements.setupCard.scrollIntoView({ behavior: "auto", block: "start" });
      elements.enrollPin.focus({ preventScroll: true });
      setAnnouncer(state.mock
        ? "Practice PIN set. Create the software practice identity next."
        : "FIDO PIN set. Enroll the intended key next.");
    }
  } catch (error) {
    elements.setupDescription.textContent = error.message;
  } finally {
    state.setupSubmitting = false;
  }
});

elements.enrollForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.setupSubmitting) return;
  state.setupSubmitting = true;
  const pin = elements.enrollPin.value;
  elements.enrollPin.value = "";
  if (pin.length < 4 || pin.length > 63) {
    state.setupSubmitting = false;
    elements.setupDescription.textContent = state.mock
      ? "Enter the 4–63 character practice PIN."
      : "Enter the 4–63 character FIDO PIN.";
    elements.enrollPin.focus();
    return;
  }
  state.mode = "enrolling";
  setPanel(elements.ceremonyPanel);
  elements.ceremonyStatus.textContent = state.mock ? "Setting up locally" : "Waiting for touch";
  elements.ceremonyKicker.textContent = state.mock ? "Practice setup" : "Set up Ghost Lap";
  elements.ceremonyTitle.textContent = state.mock ? "Creating the practice identity…" : "Touch the connected key.";
  elements.ceremonyCopy.textContent = state.mock
    ? "No physical key or touch is involved in software practice mode."
    : "Press the gold contact once to finish local setup.";
  try {
    await api(API.enroll, { method: "POST", body: { pin } });
    state.mode = "intro";
    setPanel(elements.introPanel);
    await loadStatus();
    if (isHardwareReady()) {
      elements.canvasWrap.scrollIntoView({ behavior: "auto", block: "start" });
      elements.startButton.focus({ preventScroll: true });
      setAnnouncer("Setup complete. Choose a trail for the first lap.");
    }
  } catch (error) {
    state.mode = "intro";
    setPanel(elements.introPanel);
    elements.setupDescription.textContent = error.message;
    setAnnouncer(`Enrollment failed: ${error.message}`);
  } finally {
    state.setupSubmitting = false;
  }
});

if ("ResizeObserver" in window) {
  new ResizeObserver(resizeCanvas).observe(elements.canvasWrap);
} else {
  window.addEventListener("resize", resizeCanvas);
}

state.player = makeRunner("player");
setPanel(elements.introPanel);
syncRivalFileTools();
renderSoundToggle();
resizeCanvas();
window.requestAnimationFrame(animationFrame);

async function bootstrap() {
  await loadStatus();
}

bootstrap();
