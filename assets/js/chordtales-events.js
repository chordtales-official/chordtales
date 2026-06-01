/* --- CHORDTALES EVENTS / TRIGGERS --- */

/* --- SESI 01: SEARCH ENGINE START --- */
(function() {
  'use strict';
  let SEARCH_DB = [], searchLoaded = false, searchLoading = false;

  const SEARCH_DOM = {
    desktopInput: document.getElementById('search-input-desktop'),
    desktopResults: document.getElementById('search-results-desktop'),
    mobileInput: document.getElementById('search-input-mobile'),
    mobileResults: document.getElementById('search-results-mobile'),
    // FIX 1%: Selector Hero dibikin fleksibel. Cukup data-scope="hero" aja
    heroInput: document.querySelector('.search-hero input[data-scope="hero"]'),
    heroResults: document.getElementById('search-results-hero')
  };

  async function loadSearchDB() {
    if (searchLoaded || searchLoading) return;
    searchLoading = true;
    try {
      const res = await fetch('/search.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      SEARCH_DB = await res.json();
      searchLoaded = true;
    } catch (e) {
      console.error('[Search] Gagal load:', e);
    } finally {
      searchLoading = false;
    }
  }

  function renderResults(query, container) {
    if (!container) return;
    if (!query || query.length < 2) {
      container.innerHTML = '';
      container.classList.remove('active');
      return;
    }

    if (!searchLoaded) {
      container.innerHTML = `<div class="result-item"><p style="color:var(--text-muted)">Loading database...</p></div>`;
      container.classList.add('active');
      return;
    }

    const q = query.toLowerCase();
    const filtered = SEARCH_DB.filter(i =>
      i.title.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q)
    ).slice(0, 6);

    container.innerHTML = filtered.length? filtered.map(item => `
      <a href="${item.url}" class="result-item">
          <div class="result-icon"><div data-icon="pop"></div></div>
          <div class="result-info">
            <h4>${item.title.replace("Kunci Gitar ", "")}</h4>
            <p>Artis: ${item.artist}</p>
          </div>
          <div class="result-chevron">
            <div data-icon="next"></div>
          </div>
        </a>
    `).join('') : `
      <div class="result-item">
        <p style="color:var(--text-muted)">Lagu tidak ditemukan</p>
      </div>`;

    container.classList.add('active');

    // FIX 1%: setTimeout -> rAF
    if (typeof initIcons === 'function') {
      requestAnimationFrame(() => initIcons(container));
    }
  }

  function debounce(fn, t) {
    let i;
    return (...a) => { clearTimeout(i); i = setTimeout(() => fn(...a), t); };
  }

  function closeAllResults(e) {
    const isDesktop = e.target.closest('.search-wrapper-desktop');
    const isMobile = e.target.closest('#search-slidedown');
    const isHero = e.target.closest('.search-hero');

    if (!isDesktop) SEARCH_DOM.desktopResults?.classList.remove('active');
    if (!isMobile) SEARCH_DOM.mobileResults?.classList.remove('active');
    if (!isHero) SEARCH_DOM.heroResults?.classList.remove('active');
  }

  function initSearchEvents() {
    const debounced = debounce((v, c) => renderResults(v, c), 200);

    SEARCH_DOM.desktopInput?.addEventListener('input', e => debounced(e.target.value, SEARCH_DOM.desktopResults));
    SEARCH_DOM.mobileInput?.addEventListener('input', e => debounced(e.target.value, SEARCH_DOM.mobileResults));
    SEARCH_DOM.heroInput?.addEventListener('input', e => debounced(e.target.value, SEARCH_DOM.heroResults));

    // FIX 1%: Blur tetep pake setTimeout karena butuh delay, tapi dibungkus
    let blurTimer;
    const handleBlur = (results) => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => results?.classList.remove('active'), 200);
    };

    SEARCH_DOM.desktopInput?.addEventListener('blur', () => handleBlur(SEARCH_DOM.desktopResults));
    SEARCH_DOM.heroInput?.addEventListener('blur', () => handleBlur(SEARCH_DOM.heroResults));

    document.addEventListener('click', closeAllResults);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadSearchDB();
      initSearchEvents();
    });
  } else {
    loadSearchDB();
    initSearchEvents();
  }
})();
/* --- SESI 01: SEARCH ENGINE END --- */

/* --- SESI 02: CHORD INIT START --- */
async function initChordEngine() {
    if (!DOM.pre) return;
    try {
        const res = await fetch('/assets/chord.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        chordDbGlobal = await res.json();
        originalLyricsHTML = DOM.pre.innerHTML;
        renderDynamicChords();
        // FIX 1%: onclick -> addEventListener
        const toggleDiagram = $('#toggle-diagram');
        toggleDiagram?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDiagram.classList.toggle('active');
            $('#chord-collapsible').classList.toggle('is-expanded');
        });
    } catch (e) {
        console.error('Gagal load chord.json:', e);
        if (DOM.pre) DOM.pre.innerHTML += '\n\n[Gagal load database chord]';
    }
}
/* --- SESI 02: CHORD INIT END --- */

/* --- SESI 03: HEADER LOGIC START --- */
// FIX 1%: Semua onclick -> addEventListener
const themeToggle = $('#theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme === 'dark'? null : 'light');

    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light'? null : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme || 'dark');
    });
}

const searchToggle = $('#search-toggle');
const searchSlidedown = $('#search-slidedown');
const siteHeader = $('.site-header');

if (searchToggle && searchSlidedown) {
    searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        searchSlidedown.classList.toggle('active');
        if (searchSlidedown.classList.contains('active')) {
            $('#search-input-mobile').focus();
        }
    });

    document.addEventListener('click', (e) => {
        const isClickInsideHeader = siteHeader.contains(e.target);
        const isSlidedownOpen = searchSlidedown.classList.contains('active');
        if (!isClickInsideHeader && isSlidedownOpen) {
            searchSlidedown.classList.remove('active');
        }
    });

    searchSlidedown.addEventListener('click', (e) => e.stopPropagation());
}

const menuToggle = $('#menu-toggle');
const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebar-overlay');
const sidebarClose = $('#sidebar-close');

function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
menuToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSidebar();
});
sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

const kategoriToggle = $('#kategori-toggle');
kategoriToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    kategoriToggle.parentElement.classList.toggle('open');
});
/* --- SESI 03: HEADER LOGIC END --- */

/* --- SESI 04: GLOBAL EVENTS START --- */
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
/* --- SESI 04: GLOBAL EVENTS END --- */

/* --- SESI 05: INIT START --- */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initIcons === 'function') initIcons(); // HAPUS setTimeout, LANGSUNG PANGGIL

    // 1. Typing Animation Hero...
    const typingEl = document.querySelector('.typing-text');
    if (typingEl && typingEl.dataset.words) {
        const words = JSON.parse(typingEl.dataset.words);
        let wordIndex = 0, charIndex = 0, isDeleting = false;

        function type() {
            const current = words[wordIndex];
            if (!current) return;

            typingEl.textContent = current.substring(0, isDeleting? charIndex-- : charIndex++);

            let typeSpeed = isDeleting? 50 : 100;
            if (!isDeleting && charIndex === current.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }
            setTimeout(type, typeSpeed);
        }
        type();
    }

    // 2. Count Up Animation...
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length) {
        const animateCount = (el) => {
            const target = parseInt(el.dataset.target);
            if (isNaN(target)) return;
            const duration = 2000;
            const startTime = performance.now();

            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.floor(progress * target);
                el.textContent = current.toLocaleString('id-ID');
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }

    initChordEngine();
    initBelajarChord();
});
/* --- SESI 05: INIT END --- */

/* --- SESI 06: BELAJAR CHORD START --- */
function initBelajarChord() {
    const section = document.querySelector('#belajar-chord');
    if (!section) return;

    fetch('/assets/chord.json')
    .then(res => res.json())
    .then(chordData => {
            // 1. Group chord per keluarga
            const families = {};
            Object.keys(chordData).forEach(chordName => {
                const match = chordName.match(/^([A-G][#b]?)/);
                if (match) {
                    const root = match[1];
                    if (!families[root]) families[root] = [];
                    families[root].push({ name: chordName, data: chordData[chordName] });
                }
            });

            // 2. Urutan yang mau ditampilin
            const order = ['C','C#','D','D#','E','Eb','F','F#','G','G#','A','Ab','A#','B','Bb'];

            // 3. Loop sesuai urutan
            order.forEach(root => {
                const gridId = `grid-${root.replace('#', 's').replace('b', 'f')}`;
                const grid = document.getElementById(gridId);
                if (!grid ||!families[root]) return;

                families[root].sort((a, b) => a.name.localeCompare(b.name));

                families[root].forEach(chord => {
                    const card = document.createElement('div');
                    card.className = 'chord-card';
                    card.innerHTML = createChordSVG(chord.name, chord.data);

                    card.addEventListener('click', () => {
                        if (typeof playChordSound === 'function') {
                            playChordSound(chord.name);
                        }
                    });

                    grid.appendChild(card);
                });
            });
        })
    .catch(err => console.error('[Belajar Chord] Gagal load:', err));

    // Accordion toggle - sistem buka 1, tutup lainnya
    section.querySelectorAll('.family-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = content.classList.contains('show');

            // Tutup semua dulu
            section.querySelectorAll('.family-content.show').forEach(openContent => {
                openContent.classList.remove('show');
                openContent.previousElementSibling.classList.remove('active');
            });

            // Buka yang diklik kalau sebelumnya ketutup
            if (!isOpen) {
                content.classList.add('show');
                header.classList.add('active');
            }
        });
    });
}
/* --- SESI 06: BELAJAR CHORD END --- */