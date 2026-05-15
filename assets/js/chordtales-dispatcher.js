/* --- CHORDTALES DISPATCHER --- */
/* --- SESI 04B: NAVIGATION LOGIC START --- */
function handleMenuClick(type, el) {
    if (type === 'tuner') { openTuner(); return; }
    $$('.menu').forEach(m => m.classList.remove('active'));
    if(el) el.classList.add('active');
    if (activeFeature === type) { minimizeToPill(); return; }
    if (activeFeature) createPill(activeFeature);
    renderMainBar(type);
}

function updateState(feature, value) {
    const numValue = Number(value);
    if (value!== 'reset' && isNaN(numValue)) {
        console.warn('Invalid value for', feature, value);
        return;
    }

    if (feature === 'metronome') {
        appState.metronome.bpm = Math.max(20, Math.min(300, appState.metronome.bpm + numValue));
        if (appState.metronome.isActive) restartMetronome();
    } else if (feature === 'autoscroll') {
        appState.autoscroll.speed = Math.max(0.1, Math.min(10, numValue));
    } else if (feature === 'transpose') {
        appState.transpose = value === 'reset'? 0 : Math.max(-11, Math.min(11, appState.transpose + numValue));
        debounceRenderChords();
    } else if (feature === 'sizeFont') {
        appState.fontSize = value === 'reset'? 15 : Math.max(10, Math.min(40, appState.fontSize + numValue));
        if (DOM.pre) DOM.pre.style.fontSize = `${appState.fontSize}px`;
    }
    renderMainBar(feature);
    updatePillDisplay(feature);
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

function toggleAutoScroll() {
    appState.autoscroll.isActive? stopAutoScroll() : startAutoScroll();
    renderMainBar('autoscroll');
    updatePillDisplay('autoscroll');
}
/* --- SESI 04B: NAVIGATION LOGIC END --- */

/* --- SESI 05A: PILL LOGIC START --- */
function swapToMain(type) {
    if (activeFeature && activeFeature!== type) createPill(activeFeature);
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

function openTuner() { minimizeToPill(); $('#tuner-screen').style.display = 'flex'; }
function closeTuner() { $('#tuner-screen').style.display = 'none'; }
/* --- SESI 05A: PILL LOGIC END --- */