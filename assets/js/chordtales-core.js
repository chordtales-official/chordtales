/* --- CHORDTALES CORE --- */
/* --- SESI 01: STATE & HELPERS START --- */
const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);

const DOM = {
    get mainBar() { return $('#main-control-bar') },
    get pillContainer() { return $('#pill-container') },
    get pre() { return $('pre') }
};

let globalIconDb = {};
let chordDbGlobal = {};
let activeFeature = null;
let pillTimers = {};
let originalLyricsHTML = "";

let appState = {
    metronome: { bpm: 120, isActive: false, interval: null },
    autoscroll: { speed: 1.5, isActive: false, requestID: null },
    transpose: 0,
    fontSize: 15
};

const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
/* --- SESI 01: STATE & HELPERS END --- */

/* --- SESI 02: AUDIO & METRONOME START --- */
let audioCtx = null;
let masterCompressor = null;

const initAudio = async () => {
    if (audioCtx && masterCompressor) return true;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterCompressor = audioCtx.createDynamicsCompressor();
        masterCompressor.connect(audioCtx.destination);
        return true;
    } catch (e) {
        console.error('AudioContext failed:', e);
        appState.metronome.isActive = false;
        audioCtx = null;
        masterCompressor = null;
        return false;
    }
};

function restartMetronome() {
    clearInterval(appState.metronome.interval);
    appState.metronome.interval = setInterval(playMetronomeTick, (60 / appState.metronome.bpm) * 1000);
}

async function playMetronomeTick() {
    const audioReady = await initAudio();
    if (!audioReady ||!audioCtx ||!masterCompressor) return;

    try {
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(masterCompressor);
        osc.start(now);
        osc.stop(now + 0.05);

        const beatDurationMs = (60 / appState.metronome.bpm) * 1000;
        const flashDuration = beatDurationMs * 0.25;
        $$('.dot-blink').forEach(d => {
            if (d._blinkTimeout) clearTimeout(d._blinkTimeout);
            requestAnimationFrame(() => {
                d.style.transition = 'none';
                d.style.color = 'var(--accent-1)';
                // FIX 2: BENERIN TYPO TEXTSHADOW
                d.style.textShadow = '0 0 10px var(--accent-1), 0 0 20px var(--accent-1)';
                d._blinkTimeout = setTimeout(() => {
                    d.style.transition = 'all 0.3s ease';
                    d.style.color = '';
                    d.style.textShadow = 'none';
                }, flashDuration);
            });
        });
    } catch (e) {
        console.error('Play tick failed:', e);
        if (appState.metronome.isActive) toggleMetronome();
    }
}
/* --- SESI 02: AUDIO & METRONOME END --- */

/* --- SESI 03: AUTOSCROLL START --- */
function startAutoScroll() {
    if (appState.autoscroll.isActive) return;
    appState.autoscroll.isActive = true;
    const scrollStep = () => {
        if (!appState.autoscroll.isActive) return;
        window.scrollBy(0, appState.autoscroll.speed / 2);
        appState.autoscroll.requestID = requestAnimationFrame(scrollStep);
    };
    appState.autoscroll.requestID = requestAnimationFrame(scrollStep);
}

function stopAutoScroll() {
    appState.autoscroll.isActive = false;
    if (appState.autoscroll.requestID) {
        cancelAnimationFrame(appState.autoscroll.requestID);
        appState.autoscroll.requestID = null;
    }
}
/* --- SESI 03: AUTOSCROLL END --- */

/* --- SESI 06A: CHORD LOGIC START --- */
function getTransposedChord(chord, steps) {
    if (!chord || typeof chord!== 'string') return chord;
    return chord.replace(/\b[A-G][b#]?/g, (m) => {
        const note = noteMap[m] || m;
        const idx = scale.indexOf(note);
        if (idx === -1) return m;
        let newIdx = (idx + steps) % 12;
        return scale[newIdx < 0? newIdx + 12 : newIdx];
    });
}

async function playChordSound(chordName) {
    try {
        const audioReady = await initAudio();
        if (!audioReady ||!audioCtx) return;
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const cleanName = chordName.replace('Db','C#').replace('Eb','D#').replace('Gb','F#').replace('Ab','G#').replace('Bb','A#');
        const data = chordDbGlobal[cleanName] || chordDbGlobal[chordName];
        if (!data ||!Array.isArray(data.frets)) return;
        const now = audioCtx.currentTime;
        const freqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
        data.frets.forEach((f, i) => {
            if (f >= 0 && freqs[i]) {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[i] * Math.pow(2, f / 12), now + (i * 0.04));
                g.gain.setValueAtTime(0, now + (i * 0.04));
                g.gain.linearRampToValueAtTime(0.4, now + (i * 0.04) + 0.01);
                g.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.04) + 1.2);
                osc.connect(g).connect(masterCompressor);
                osc.start(now + (i * 0.04));
                osc.stop(now + (i * 0.04) + 1.3);
            }
        });
    } catch (e) { console.error('Play chord failed:', e); }
}
/* --- SESI 06A: CHORD LOGIC END --- */