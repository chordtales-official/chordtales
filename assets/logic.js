/* --- SESI 00: ICON ENGINE START --- */
async function initIcons() {
    try {
        if (Object.keys(globalIconDb).length === 0) {
            const res = await fetch('assets/icon.json');
            globalIconDb = await res.json();
        }
        $$('[data-icon]').forEach(el => {
            if (el.querySelector('svg')) return;
            const path = globalIconDb[el.getAttribute('data-icon')];
            if (path) {
                el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; display:block;"><path d="${path}"></path></svg>`;
            }
        });
    } catch (e) { console.error(e); }
}
/* --- SESI 00: ICON ENGINE END --- */

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
    if (!audioReady || !audioCtx || !masterCompressor) return;

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

function toggleMetronome() {
    clearInterval(appState.metronome.interval);
    if (appState.metronome.isActive) {
        appState.metronome.interval = null;
        appState.metronome.isActive = false;
        $$('.dot-blink').forEach(d => {
            if (d._blinkTimeout) clearTimeout(d._blinkTimeout);
            d.style.color = '';
            d.style.textShadow = 'none';
        });
    } else {
        appState.metronome.isActive = true;
        playMetronomeTick();
        restartMetronome();
    }
    renderMainBar('metronome');
    updatePillDisplay('metronome');
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

function toggleAutoScroll() {
    appState.autoscroll.isActive ? stopAutoScroll() : startAutoScroll();
    renderMainBar('autoscroll');
    updatePillDisplay('autoscroll');
}
/* --- SESI 03: AUTOSCROLL END --- */

/* --- SESI 04: NAVIGATION & BAR START --- */
function handleMenuClick(type, el) {
    if (type === 'tuner') { openTuner(); return; }
    $$('.menu').forEach(m => m.classList.remove('active'));
    if(el) el.classList.add('active');
    if (activeFeature === type) { minimizeToPill(); return; }
    if (activeFeature) createPill(activeFeature);
    renderMainBar(type);
}

function renderMainBar(type) {
    const bar = DOM.mainBar;
    if (!bar) return;
    activeFeature = type;
    stopPillTimer(type);

    const getPlayBtn = (active, action) => `
        <button class="btn-tool" onclick="${action}" style="background:var(--accent-1); color:#fff; width:25px; height:25px;">
            <div data-icon="${active ? 'pause' : 'play'}"></div>
        </button>`;

    let html = '';
    if (type === 'metronome') {
        html = `<div class="control-item"><div data-icon="metronome" style="color:var(--accent-1)"></div><span>BPM: <b style="color:var(--accent-1)">${appState.metronome.bpm}</b></span><span class="dot-blink" style="margin-left:5px">●</span></div>
                <div class="control-item" style="gap:12px;"><button class="btn-tool" onclick="updateState('metronome', -1)"><div data-icon="minus"></div></button>${getPlayBtn(appState.metronome.isActive, 'toggleMetronome()')}<button class="btn-tool" onclick="updateState('metronome', 1)"><div data-icon="plus"></div></button></div>`;
    } else if (type === 'autoscroll') {
        html = `<div class="control-item"><div data-icon="autoScroll" style="color:var(--accent-1)"></div><span style="font-size:11px; font-weight:bold;">SPD: ${appState.autoscroll.speed}</span></div>
                <div class="control-item" style="flex:1; padding:0 25px;"><input type="range" min="0.5" max="5" step="0.1" value="${appState.autoscroll.speed}" oninput="updateState('autoscroll', this.value)" style="width:100%; accent-color:var(--accent-1); cursor:pointer;"></div>
                <div class="control-item">${getPlayBtn(appState.autoscroll.isActive, 'toggleAutoScroll()')}</div>`;
    } else if (type === 'transpose') {
        html = `<div class="control-item"><div data-icon="transpose"></div><span>Key: <b>${(appState.transpose > 0 ? '+' : '') + appState.transpose}</b></span></div>
                <div class="control-item" style="gap:10px;"><button class="btn-tool" onclick="updateState('transpose', -1)"><div data-icon="minus"></div></button><button class="btn-tool" onclick="updateState('transpose', 'reset')" style="font-size:10px; font-weight:600; width:50px;">RESET</button><button class="btn-tool" onclick="updateState('transpose', 1)"><div data-icon="plus"></div></button></div>`;
    } else if (type === 'sizeFont') {
        html = `<div class="control-item"><div data-icon="sizeFont"></div><span>${appState.fontSize}px</span></div>
                <div class="control-item" style="gap:10px;"><button class="btn-tool" onclick="updateState('sizeFont', -1)"><div data-icon="minus"></div></button><button class="btn-tool" onclick="updateState('sizeFont', 'reset')" style="font-size:10px; font-weight:600; width:40px;">15px</button><button class="btn-tool" onclick="updateState('sizeFont', 1)"><div data-icon="plus"></div></button></div>`;
    }

    bar.innerHTML = html + `<div class="btn-close-main" onclick="closeMainBar()" style="color:red; margin-left:10px; cursor:pointer">×</div>`;
    bar.classList.add('open');
    initIcons();
}

function closeMainBar() {
    DOM.mainBar.classList.remove('open');
    $$('.menu').forEach(m => m.classList.remove('active'));
    activeFeature = null;
}

function updateState(feature, value) {
    const numValue = Number(value);
    if (value !== 'reset' && isNaN(numValue)) {
        console.warn('Invalid value for', feature, value);
        return;
    }

    if (feature === 'metronome') {
        appState.metronome.bpm = Math.max(20, Math.min(300, appState.metronome.bpm + numValue));
        if (appState.metronome.isActive) restartMetronome();
    } else if (feature === 'autoscroll') {
        appState.autoscroll.speed = Math.max(0.1, Math.min(10, numValue));
    } else if (feature === 'transpose') {
        appState.transpose = value === 'reset' ? 0 : Math.max(-11, Math.min(11, appState.transpose + numValue));
        debounceRenderChords();
    } else if (feature === 'sizeFont') {
        appState.fontSize = value === 'reset' ? 15 : Math.max(10, Math.min(40, appState.fontSize + numValue));
        if (DOM.pre) DOM.pre.style.fontSize = `${appState.fontSize}px`;
    }
    renderMainBar(feature);
    updatePillDisplay(feature);
}
/* --- SESI 04: NAVIGATION & BAR END --- */

/* --- SESI 05: PILL ENGINE START --- */
function createPill(type) {
    let pill = $(`#pill-${type}`);
    if (pill) {
        updatePillDisplay(type);
        startPillTimer(type);
        return;
    }
    pill = document.createElement('div');
    pill.id = `pill-${type}`;
    pill.className = 'info-pill';
    pill.innerHTML = `<div onclick="swapToMain('${type}')" style="display:flex; align-items:center; gap:8px; cursor:pointer"><div data-icon="iconDrop" style="font-size:0.9em; opacity:0.5"></div><span class="pill-content"></span></div>
        <b onclick="event.stopPropagation(); stopFeatureLogic('${type}', true)" style="padding-left:8px; margin-left:4px; border-left:1px solid var(--border-color); cursor:pointer">×</b>`;
    DOM.pillContainer.appendChild(pill);
    updatePillDisplay(type);
    startPillTimer(type);
    initIcons();
}

function updatePillDisplay(type) {
    const el = $(`#pill-${type} .pill-content`);
    if (!el) return; // FIX: Langsung diem kalo pill belum ada
    
    if (type === 'metronome') {
        el.innerHTML = `BPM ${appState.metronome.bpm} <i class="dot-blink">●</i>`;
    } else if (type === 'autoscroll') {
        el.innerHTML = `SPD ${appState.autoscroll.speed}`;
    } else if (type === 'transpose') {
        el.innerHTML = `KEY ${appState.transpose >= 0 ? '+' : ''}${appState.transpose}`;
    } else if (type === 'sizeFont') {
        el.innerHTML = `FONT ${appState.fontSize}px`;
    }
}

function swapToMain(type) {
    if (activeFeature && activeFeature !== type) createPill(activeFeature);
    const p = $(`#pill-${type}`); if (p) p.remove();
    stopPillTimer(type);
    handleMenuClick(type, $(`.menu[data-type="${type}"]`));
}

function minimizeToPill() {
    if (activeFeature) createPill(activeFeature);
    closeMainBar();
}

function stopFeatureLogic(type, fromPill = false) {
    const p = $(`#pill-${type}`); if (p) p.remove();
    stopPillTimer(type);
    if (type === 'metronome') {
        clearInterval(appState.metronome.interval);
        appState.metronome.interval = null;
        appState.metronome.isActive = false;
    }
    if (type === 'autoscroll') stopAutoScroll();
    if (activeFeature === type) renderMainBar(type);
    if (!fromPill && activeFeature === type) closeMainBar();
}

function startPillTimer(type) {
    stopPillTimer(type);
    pillTimers[type] = setTimeout(() => {
        if ((type === 'metronome' && appState.metronome.isActive) || (type === 'autoscroll' && appState.autoscroll.isActive)) {
            startPillTimer(type);
            return;
        }
        stopFeatureLogic(type, true);
    }, 60000);
}

function stopPillTimer(type) {
    if (pillTimers[type]) {
        clearTimeout(pillTimers[type]);
        delete pillTimers[type];
    }
}
/* --- SESI 05: PILL ENGINE END --- */

/* --- SESI 06: CHORD ENGINE START --- */
function getTransposedChord(chord, steps) {
    if (!chord || typeof chord !== 'string') return chord;
    return chord.replace(/\b[A-G][b#]?/g, (m) => {
        const note = noteMap[m] || m;
        const idx = scale.indexOf(note);
        if (idx === -1) return m;
        let newIdx = (idx + steps) % 12;
        return scale[newIdx < 0 ? newIdx + 12 : newIdx];
    });
}

function createChordSVG(name, data) {
    const frets = data.frets;
    const fingers = data.fingering || data.fingers || [];
    const active = frets.filter(f => f > 0);
    const baseFret = active.length > 0 && Math.min(...active) > 2 ? Math.min(...active) : 1;

    let circles = frets.map((f, i) => {
        const x = 10 + (i * 10);
        if (f > 0) {
            const finger = (fingers[i] && fingers[i] !== 0) ? fingers[i] : '';
            return `<circle cx="${x}" cy="${20 + (f - baseFret + 1) * 16 - 8}" r="4.5" fill="var(--diagram-dot)"/>
                    <text x="${x}" y="${20 + (f - baseFret + 1) * 16 - 5.8}" font-size="6" fill="var(--diagram-text)" text-anchor="middle" font-weight="bold">${finger}</text>`;
        }
        if (f === 0) return `<circle cx="${x}" cy="14" r="2.5" fill="none" stroke="var(--diagram-line)" stroke-width="1.5"/>`;
        if (f === -1) return `<g stroke="var(--diagram-line)" stroke-width="1.5"><line x1="${x-2.5}" y1="12" x2="${x+2.5}" y2="17"/><line x1="${x+2.5}" y1="12" x2="${x-2.5}" y2="17"/></g>`;
        return '';
    }).join('');

    return `<svg width="90" height="110" viewBox="0 -5 70 110" xmlns="http://www.w3.org/2000/svg">
            <text x="35" y="8" font-size="11" font-weight="700" fill="var(--text-main)" text-anchor="middle">${name}</text>
            <g stroke="var(--diagram-line)" stroke-width="1" opacity="0.7">
                ${[20, 36, 52, 68, 84].map(y => `<line x1="10" y1="${y}" x2="60" y2="${y}"/>`).join('')}
                ${[10, 20, 30, 40, 50, 60].map(x => `<line x1="${x}" y1="20" x2="${x}" y2="84"/>`).join('')}
            </g>
            ${baseFret > 1 ? `<text x="10" y="98" font-size="9" fill="var(--diagram-fret)" font-weight="700">fr${baseFret}</text>` : `<line x1="10" y1="20" x2="60" y2="20" stroke="var(--diagram-line)" stroke-width="3"/>`}
            ${circles}
        </svg>`;
}

let renderTimeout;
function debounceRenderChords() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderDynamicChords, 150);
}

function renderDynamicChords() {
    const pre = DOM.pre; if (!pre) return;
    const regex = /\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M)?\d?(?:\/[A-G][b#]?)?(?=\s|$|\b)/g;
    pre.innerHTML = originalLyricsHTML.replace(regex, (match) => {
        const transposed = getTransposedChord(match, appState.transpose);
        const data = chordDbGlobal[transposed] || chordDbGlobal[match];
        if (data) {
            const mini = createChordSVG(transposed, data).replace('width="90"', 'width="60"').replace('height="110"', 'height="90"');
            return `<span class="chord-highlight" data-chord="${transposed}">${transposed}<div class="chord-tooltip">${mini}</div></span>`;
        }
        return transposed;
    });
    initBankChord();
    attachTooltipSafety();
}

async function playChordSound(chordName) {
    try {
        const audioReady = await initAudio();
        if (!audioReady || !audioCtx) return;
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const cleanName = chordName.replace('Db','C#').replace('Eb','D#').replace('Gb','F#').replace('Ab','G#').replace('Bb','A#');
        const data = chordDbGlobal[cleanName] || chordDbGlobal[chordName];
        if (!data || !Array.isArray(data.frets)) return;
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

function initBankChord() {
    const container = $('#chord-list');
    if (!container || !DOM.pre) return;
    container.innerHTML = "";
    const matches = DOM.pre.innerText.match(/\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M)?\d?(?:\/[A-G][b#]?)?(?=\s|$|\b)/g) || [];
    const uniqueChords = [...new Set(matches)];
    uniqueChords.forEach(chord => {
        const trans = getTransposedChord(chord, appState.transpose);
        if (chordDbGlobal[trans]) {
            const card = document.createElement('div');
            card.className = 'chord-card';
            card.innerHTML = createChordSVG(trans, chordDbGlobal[trans]);
            card.onclick = () => playChordSound(trans);
            container.appendChild(card);
        }
    });
}

function attachTooltipSafety() {
    $$('.chord-highlight').forEach(el => {
        const chordName = el.dataset.chord;
        if (chordName) el.onclick = () => playChordSound(chordName);

        el.onmouseenter = () => {
            const tooltip = el.querySelector('.chord-tooltip');
            if (!tooltip) return;
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = 'translateX(-50%) scale(1.6)';
            setTimeout(() => {
                const rect = tooltip.getBoundingClientRect();
                const padding = 15;
                const screenWidth = window.innerWidth;
                let shiftX = 0;
                if (rect.right > screenWidth - padding) shiftX = screenWidth - rect.right - padding;
                if (rect.left < padding) shiftX = padding - rect.left;
                tooltip.style.transform = `translateX(calc(-50% + ${shiftX}px)) scale(1.6)`;
            }, 50);
        };
        el.onmouseleave = () => {
            const tooltip = el.querySelector('.chord-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                tooltip.style.transform = 'translateX(-50%) scale(0)';
            }
        };
    });
}

async function initChordEngine() {
    if (!DOM.pre) return;
    try {
        const res = await fetch('assets/chord.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        chordDbGlobal = await res.json();
        originalLyricsHTML = DOM.pre.innerHTML;
        renderDynamicChords();
        if ($('#toggle-diagram')) $('#toggle-diagram').onclick = (e) => {
            e.stopPropagation();
            $('#toggle-diagram').classList.toggle('active');
            $('#chord-collapsible').classList.toggle('is-expanded');
        };
    } catch (e) {
        console.error('Gagal load chord.json:', e);
        if (DOM.pre) DOM.pre.innerHTML += '\n\n[Gagal load database chord]';
    }
}

function openTuner() { minimizeToPill(); $('#tuner-screen').style.display = 'flex'; }
function closeTuner() { $('#tuner-screen').style.display = 'none'; }

/* --- EVENTS --- */
window.addEventListener('beforeunload', () => {
    clearInterval(appState.metronome.interval);
    cancelAnimationFrame(appState.autoscroll.requestID);
    Object.values(pillTimers).forEach(clearTimeout);
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (appState.metronome.isActive) toggleMetronome();
        if (appState.autoscroll.isActive) stopAutoScroll();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initChordEngine();
});
/* --- SESI 06: CHORD ENGINE END --- */