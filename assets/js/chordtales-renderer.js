/* --- CHORDTALES RENDERER --- */
/* --- SESI 00: ICON ENGINE START --- */
async function initIcons(scope = document) {
    try {
        // 1. Load DB kalo belum ada
        if (Object.keys(globalIconDb).length === 0) {
            const cached = sessionStorage.getItem('ct_icon_db');
            if (cached) {
                globalIconDb = JSON.parse(cached);
            } else {
                const res = await fetch('/assets/icon.json');
                if (!res.ok) throw new Error('Failed to fetch icon.json');
                globalIconDb = await res.json();
                sessionStorage.setItem('ct_icon_db', JSON.stringify(globalIconDb));
            }
        }

        // 2. Render semua [data-icon] di scope
        scope.querySelectorAll('[data-icon]').forEach(el => {
            if (el.querySelector('svg')) return; // Skip kalo udah ke-render

            const iconName = el.getAttribute('data-icon').trim();
            const path = globalIconDb[iconName];

            if (path) {
                el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; display:block;"><path d="${path}"></path></svg>`;
            }
        });
    } catch (e) {
        console.error('Icon Engine Error:', e);
    }
}
/* --- SESI 00: ICON ENGINE END --- */

/* --- SESI 04A: NAVIGATION RENDER START --- */
function renderMainBar(type) {
    const bar = DOM.mainBar;
    if (!bar) return;
    activeFeature = type;
    stopPillTimer(type);

    // FIX 9%: Buang onclick, ganti data-action
    const getPlayBtn = (active, action) => `
        <button class="btn-tool" data-action="${action}" style="background:var(--accent-1); color:#fff; width:25px; height:25px;">
            <div data-icon="${active ? 'pause' : 'play'}"></div>
        </button>`;

    let html = '';
    if (type === 'metronome') {
        html = `<div class="control-item"><div data-icon="metronome" style="color:var(--accent-1)"></div><span>BPM: <b style="color:var(--accent-1)">${appState.metronome.bpm}</b></span><span class="dot-blink" style="margin-left:5px">●</span></div>
                <div class="control-item" style="gap:12px;">
                    <button class="btn-tool" data-action="metro-minus"><div data-icon="minus"></div></button>
                    ${getPlayBtn(appState.metronome.isActive, 'toggle-metronome')}
                    <button class="btn-tool" data-action="metro-plus"><div data-icon="plus"></div></button>
                </div>`;
    } else if (type === 'autoscroll') {
        html = `<div class="control-item"><div data-icon="autoScroll" style="color:var(--accent-1)"></div><span style="font-size:11px; font-weight:bold;">SPD: ${appState.autoscroll.speed}</span></div>
                <div class="control-item" style="flex:1; padding:0 25px;"><input type="range" min="0.5" max="5" step="0.1" value="${appState.autoscroll.speed}" data-action="scroll-range" style="width:100%; accent-color:var(--accent-1); cursor:pointer;"></div>
                <div class="control-item">${getPlayBtn(appState.autoscroll.isActive, 'toggle-autoscroll')}</div>`;
    } else if (type === 'transpose') {
        html = `<div class="control-item"><div data-icon="transpose"></div><span>Key: <b>${(appState.transpose > 0 ? '+' : '') + appState.transpose}</b></span></div>
                <div class="control-item" style="gap:10px;">
                    <button class="btn-tool" data-action="transpose-minus"><div data-icon="minus"></div></button>
                    <button class="btn-tool" data-action="transpose-reset" style="font-size:10px; font-weight:600; width:50px;">RESET</button>
                    <button class="btn-tool" data-action="transpose-plus"><div data-icon="plus"></div></button>
                </div>`;
    } else if (type === 'sizeFont') {
        html = `<div class="control-item"><div data-icon="sizeFont"></div><span>${appState.fontSize}px</span></div>
                <div class="control-item" style="gap:10px;">
                    <button class="btn-tool" data-action="font-minus"><div data-icon="minus"></div></button>
                    <button class="btn-tool" data-action="font-reset" style="font-size:10px; font-weight:600; width:40px;">15px</button>
                    <button class="btn-tool" data-action="font-plus"><div data-icon="plus"></div></button>
                </div>`;
    }

    bar.innerHTML = html + `<div class="btn-close-main" data-action="close-main" style="color:red; margin-left:10px; cursor:pointer">×</div>`;
    bar.classList.add('open');
    initIcons(bar);
}

// Event delegation buat semua tombol di mainBar - taruh di events.js
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !DOM.mainBar.contains(btn)) return;
    
    const act = btn.dataset.action;
    if (act === 'metro-minus') updateState('metronome', -1);
    else if (act === 'metro-plus') updateState('metronome', 1);
    else if (act === 'toggle-metronome') toggleMetronome();
    else if (act === 'toggle-autoscroll') toggleAutoScroll();
    else if (act === 'transpose-minus') updateState('transpose', -1);
    else if (act === 'transpose-plus') updateState('transpose', 1);
    else if (act === 'transpose-reset') updateState('transpose', 'reset');
    else if (act === 'font-minus') updateState('sizeFont', -1);
    else if (act === 'font-plus') updateState('sizeFont', 1);
    else if (act === 'font-reset') updateState('sizeFont', 'reset');
    else if (act === 'close-main') closeMainBar();
});

document.addEventListener('input', e => {
    if (e.target.dataset.action === 'scroll-range') {
        updateState('autoscroll', e.target.value);
    }
});

function closeMainBar() {
    DOM.mainBar.classList.remove('open');
    $$('.menu').forEach(m => m.classList.remove('active'));
    activeFeature = null;
}
/* --- SESI 04A: NAVIGATION RENDER END --- */

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
    // FIX 9%: Buang onclick
    pill.innerHTML = `<div data-action="swap-pill" data-type="${type}" style="display:flex; align-items:center; gap:8px; cursor:pointer"><div data-icon="iconDrop" style="font-size:0.9em; opacity:0.5"></div><span class="pill-content"></span></div>
        <b data-action="close-pill" data-type="${type}" style="padding-left:8px; margin-left:4px; border-left:1px solid var(--border-color); cursor:pointer">×</b>`;
    DOM.pillContainer.appendChild(pill);
    updatePillDisplay(type);
    startPillTimer(type);
    initIcons(pill);
}

// Delegasi buat pill - taruh di events.js
document.addEventListener('click', e => {
    const swap = e.target.closest('[data-action="swap-pill"]');
    if (swap) {
        swapToMain(swap.dataset.type);
        return;
    }
    const close = e.target.closest('[data-action="close-pill"]');
    if (close) {
        e.stopPropagation();
        stopFeatureLogic(close.dataset.type, true);
    }
});

function updatePillDisplay(type) {
    const el = $(`#pill-${type} .pill-content`);
    if (!el) return;
    
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
/* --- SESI 05: PILL ENGINE END --- */

/* --- SESI 06B: CHORD RENDER START --- */
function createChordSVG(name, data) {
    const frets = data.frets;
    const fingers = data.fingering || data.fingers || [];
    const active = frets.filter(f => f > 0);
    const baseFret = active.length > 0 && Math.min(...active) > 2? Math.min(...active) : 1;

    let circles = frets.map((f, i) => {
        const x = 10 + (i * 10);
        if (f > 0) {
            const finger = (fingers[i] && fingers[i]!== 0)? fingers[i] : '';
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
            ${baseFret > 1? `<text x="10" y="98" font-size="9" fill="var(--diagram-fret)" font-weight="700">fr${baseFret}</text>` : `<line x1="10" y1="20" x2="60" y2="20" stroke="var(--diagram-line)" stroke-width="3"/>`}
            ${circles}
        </svg>`;
}

let renderTimeout;
function debounceRenderChords() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderDynamicChords, 150);
}

function renderDynamicChords() {
    const pre = DOM.pre;
    if (!pre) return;

    const chordRegex = /\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M|°|ø)?(?:\d{1,2})?(?:[b#+-]\d{1,2})*(?:sus[24]?)?(?:\/[A-G][b#]?)?(?!\w)/g;

    const combinedRegex = new RegExp(/(<[^>]+>)/.source + '|' + chordRegex.source, 'g');

    pre.innerHTML = originalLyricsHTML.replace(combinedRegex, (match) => {
        
        if (match.startsWith('<')) {
            return match; 
        }

        const transposed = getTransposedChord(match, appState.transpose);
        const data = chordDbGlobal[transposed] || chordDbGlobal[match];
        
        if (data) {
            const mini = createChordSVG(transposed, data)
               .replace('width="90"', 'width="60"')
               .replace('height="110"', 'height="90"');
            return `<span class="chord-highlight" data-chord="${transposed}">${transposed}<span class="chord-tooltip">${mini}</span></span>`;
        }
        return transposed;
    });

    initBankChord();
    attachTooltipSafety();
}


function initBankChord() {
    const container = $('#chord-list');
    if (!container ||!DOM.pre) return;

    container.innerHTML = "";

    // Pake regex yang SAMA kayak di atas
    const chordRegex = /\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M|°|ø)?(?:\d{1,2})?(?:[b#+-]\d{1,2})*(?:sus[24]?)?(?:\/[A-G][b#]?)?(?!\w)/g;

    const matches = DOM.pre.innerText.match(chordRegex) || [];
    const uniqueChords = [...new Set(matches)];

    uniqueChords.forEach(chord => {
        const trans = getTransposedChord(chord, appState.transpose);
        const data = chordDbGlobal[trans] || chordDbGlobal[chord];

        if (data) {
            const card = document.createElement('div');
            card.className = 'chord-card';
            card.innerHTML = createChordSVG(trans, data);
            card.addEventListener('click', () => playChordSound(trans));
            container.appendChild(card);
        }
    });
}

function attachTooltipSafety() {
    $$('.chord-highlight').forEach(el => {
        const chordName = el.dataset.chord;
        // FIX 9%: onclick -> addEventListener
        if (chordName) el.addEventListener('click', () => playChordSound(chordName));

        el.addEventListener('mouseenter', () => {
            const tooltip = el.querySelector('.chord-tooltip');
            if (!tooltip) return;
            
            const scale = 1.6;
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.transform = `translateX(-50%) scale(${scale})`;
        
            requestAnimationFrame(() => {
                const rect = tooltip.getBoundingClientRect();
                const padding = 15;
                const screenWidth = window.innerWidth;
                let shiftX = 0;
        
                // Kepotong kanan
                if (rect.right > screenWidth - padding) {
                    shiftX = screenWidth - rect.right - padding;
                }
                
                // Kepotong kiri - ini yang lo fix
                if (rect.left < padding) {
                    // Bagi scale karena transform scale 1.6
                    shiftX = (padding - rect.left) / scale;
                }
                    
                tooltip.style.transform = `translateX(calc(-50% + ${shiftX}px)) scale(${scale})`;
            });
        });
        el.addEventListener('mouseleave', () => {
            const tooltip = el.querySelector('.chord-tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
                tooltip.style.transform = 'translateX(-50%) scale(0)';
            }
        });
    });
}
/* --- SESI 06B: CHORD RENDER END --- */

