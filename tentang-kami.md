---
layout: default
title: Tentang Kami
permalink: /tentang/
---

<div class="about-page">
  <div class="about-hero">
    <h1>Tentang CHORDTALES</h1>
    <p>Tempat nongkrongnya musisi kamar yang mager baca chord ribet</p>
  </div>

  <div class="about-content">
    <section class="about-section">
      <h2>Apa itu CHORDTALES?</h2>
      <p>
        CHORDTALES adalah tempat buat kamu yang suka main musik tapi mager cari chord yang ribet. 
        Kami kumpulin chord lagu Indonesia dan mancanegara yang udah disederhanain. 
        Tujuannya satu: biar kamu bisa langsung petik gitar atau main piano tanpa pusing baca not balok.
      </p>
    </section>

    <section class="about-section">
      <h2>Kenapa CHORDTALES?</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h3>Chord Akurat & Mudah</h3>
          <p>Chord disesuaikan buat pemula. Ada transpose, auto-scroll, mode gelap juga.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <h3>Update Setiap Minggu</h3>
          <p>Lagu baru, viral TikTok, lagu lawas yang kangen didengerin. Semua masuk sini.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3>Gratis Selamanya</h3>
          <p>Gak ada paywall. Gak ada login wajib. Buka, cari, main.</p>
        </div>
      </div>
    </section>

    <section class="about-section highlight">
      <h2>Tujuan Kami</h2>
      <p>
        Musik itu buat dinikmatin, bukan buat bikin stres. CHORDTALES hadir biar kamu fokus 
        ke yang penting: main musik dan senang-senang.
      </p>
      <p class="cta-text">
        Ada chord salah atau lagu yang mau diminta? 
        <a href="mailto:halo.chordtales@gmail.com">Kirim email ke halo.chordtales@gmail.com</a>
      </p>
    </section>

    <div class="about-footer">
      <p>Dibuat dengan ❤️ buat musisi kamar di seluruh Indonesia</p>
    </div>
  </div>
</div>

<style>
.about-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.about-hero {
  text-align: center;
  margin-bottom: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border-color);
}

.about-hero h1 {
  font-size: 2.5rem;
  color: var(--text-main);
  margin-bottom: 12px;
}

.about-hero p {
  font-size: 1.2rem;
  color: var(--text-muted);
}

.about-section {
  margin-bottom: 50px;
}

.about-section h2 {
  font-size: 1.8rem;
  color: var(--text-main);
  margin-bottom: 20px;
}

.about-section p {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature-card {
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: transform 0.2s, border-color 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-1);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(138, 180, 248, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-1);
  margin-bottom: 16px;
}

.feature-icon svg {
  width: 22px;
  height: 22px;
}

.feature-card h3 {
  font-size: 1.2rem;
  color: var(--text-main);
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.about-section.highlight {
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.about-section.highlight .cta-text {
  margin-top: 20px;
  font-size: 1.05rem;
}

.about-section.highlight .cta-text a {
  color: var(--accent-1);
  font-weight: 700;
  text-decoration: none;
}

.about-section.highlight .cta-text a:hover {
  text-decoration: underline;
}

.about-footer {
  text-align: center;
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 1rem;
}

@media (max-width: 768px) {
  .about-hero h1 {
    font-size: 2rem;
  }
  
  .about-hero p {
    font-size: 1rem;
  }
  
  .about-page {
    padding: 30px 16px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>