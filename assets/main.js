/* My Little Cup — motion & interactions */
(function () {
  window.__mlc = true;
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const anim = hasGsap && !reduce;
  const DATA = window.MLC || { drinks: [], aromas: [], facts: [] };
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const isMobile = () => window.innerWidth < 761;

  if (!anim) {
    root.classList.remove('js');
    const c = $('.curtain'); if (c) c.style.display = 'none';
  }
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }

  /* =========================================================
     Tasses en coupe (couches de la boisson)
     ========================================================= */
  const SHAPES = {
    demi:  { body: 'M62 96H138V124A28 28 0 0 1 110 152H90A28 28 0 0 1 62 124Z', top: 102, bot: 152, handle: 'M138 104h8a12 12 0 0 1 0 24h-9', saucer: 'M36 162H164' },
    gib:   { body: 'M64 80H136L131 162H69Z', top: 92, bot: 162 },
    cup:   { body: 'M44 72H156V118A42 42 0 0 1 114 160H86A42 42 0 0 1 44 118Z', top: 80, bot: 160, handle: 'M156 86h10a17 17 0 0 1 0 34h-12', saucer: 'M22 172H178' },
    glass: { body: 'M60 34H140L134 168H66Z', top: 48, bot: 168 }
  };
  let cupId = 0;
  function cupSVG(d) {
    const sh = SHAPES[d.cup] || SHAPES.cup;
    const id = 'cl' + (++cupId);
    const total = d.L.reduce((a, l) => a + l[0], 0);
    let y = sh.bot; const span = sh.bot - sh.top;
    const lays = d.L.map((l, i) => {
      const h = l[0] / total * span; y -= h;
      return `<rect class="lay" data-i="${i}" x="0" y="${y.toFixed(1)}" width="200" height="${(h + .6).toFixed(1)}" fill="${l[1]}"/>`;
    }).join('');
    const ice = d.ice ? [[78, 70, -12], [104, 92, 10], [84, 118, 6]].map(([x, yy, r]) => `<rect x="${x}" y="${yy}" width="22" height="22" rx="5" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" transform="rotate(${r} ${x + 11} ${yy + 11})"/>`).join('') : '';
    const shine = `<rect x="0" y="0" width="200" height="200" fill="url(#${id}g)"/>`;
    const steam = d.cold ? '' : `<g class="steam" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"><path d="M84 ${sh.top - 18}c-5-7 5-11 0-18"/><path d="M100 ${sh.top - 18}c-5-7 5-11 0-18"/><path d="M116 ${sh.top - 18}c-5-7 5-11 0-18"/></g>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><clipPath id="${id}"><path d="${sh.body}"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset=".25" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      ${steam}<g clip-path="url(#${id})">${lays}${ice}${shine}</g>
      <rect class="stream" x="98" y="0" width="4" height="${sh.bot}" fill="${d.L[0][1]}" opacity="0"/>
      <path d="${sh.body}" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      ${sh.handle ? `<path d="${sh.handle}" fill="none" stroke="currentColor" stroke-width="4"/>` : ''}
      ${sh.saucer ? `<path d="${sh.saucer}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>` : ''}</svg>`;
  }
  const drinkBy = k => DATA.drinks.find(d => d.k === k);
  $$('[data-cup]').forEach(el => { const d = drinkBy(el.dataset.cup); if (d) el.innerHTML = cupSVG(d); });

  /* =========================================================
     Heures d'ouverture (heure de Bruxelles)
     ========================================================= */
  const HOURS = { 1: [7.5, 17], 2: [7.5, 17], 3: [7.5, 17], 4: [7.5, 17], 5: [7.5, 17], 6: [9, 17], 0: [9, 17] };
  function brussels() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const g = t => (p.find(x => x.type === t) || {}).value;
    return { day: wd[g('weekday')] ?? new Date().getDay(), h: (+g('hour') % 24) + (+g('minute')) / 60 };
  }
  const now = brussels();
  const [o, c] = HOURS[now.day];
  const open = now.h >= o && now.h < c;
  $$('[data-status]').forEach(el => {
    el.classList.toggle('closed', !open);
    const label = el.querySelector('b');
    if (label) label.textContent = open ? ($('[data-countdown]') ? 'Ouvert maintenant' : 'Ouvert maintenant · jusqu’à 17:00') : (now.h < o ? `Fermé · ouvre à ${o === 7.5 ? '07:30' : '09:00'}` : 'Fermé · à demain');
  });
  $$('[data-day]').forEach(el => { if (el.dataset.day.split(',').map(Number).includes(now.day)) el.classList.add('today'); });
  const fmtH = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  function countdown() {
    const t = brussels(); const [oo, cc] = HOURS[t.day];
    const el = $('[data-countdown]'); if (!el) return;
    if (t.h >= oo && t.h < cc) { const m = Math.round((cc - t.h) * 60); el.textContent = `Ferme dans ${m >= 60 ? Math.floor(m / 60) + ' h ' : ''}${String(m % 60).padStart(2, '0')} min`; }
    else if (t.h < oo) el.textContent = `Ouvre aujourd’hui à ${fmtH(oo)}`;
    else { const nd = (t.day + 1) % 7; el.textContent = `Ouvre demain à ${fmtH(HOURS[nd][0])}`; }
  }
  countdown(); setInterval(countdown, 30000);
  const todayBar = $('.week li.today .bar');
  if (todayBar && now.h >= 6 && now.h <= 19) { const n = document.createElement('span'); n.className = 'now'; n.style.setProperty('--n', ((now.h - 6) / 13).toFixed(4)); n.title = 'Maintenant'; todayBar.appendChild(n); }

  /* =========================================================
     Menu mobile, header, copier, onglets, formulaires
     ========================================================= */
  const burger = $('.burger');
  if (burger) burger.addEventListener('click', () => {
    const on = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', on);
    if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start();
  });
  const header = $('.header');
  const scup = $('.scup'); const scupFill = scup && $('.scup-fill', scup);
  let lastY = 0;
  function onScroll(y) {
    if (header) {
      header.classList.toggle('scrolled', y > 30);
    }
    if (scup) {
      scup.hidden = y < 400;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (scupFill) scupFill.style.transform = `scaleY(${Math.min(1, y / Math.max(1, max)).toFixed(3)})`;
    }
    lastY = y;
  }
  window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  if (scup) scup.addEventListener('click', () => window.__lenis ? window.__lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' }));

  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const done = () => { const t = b.textContent; b.textContent = 'Copié'; setTimeout(() => b.textContent = t, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done).catch(() => {});
  }));

  const form = $('#contact-form');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('.f-msg', form);
    const key = form.querySelector('[name=access_key]').value;
    if (!form.checkValidity()) { msg.className = 'f-msg err'; msg.textContent = 'Merci de remplir votre nom, un e-mail valide et votre message.'; return; }
    if (!key || key.startsWith('VOTRE')) { msg.className = 'f-msg err'; msg.textContent = 'Formulaire pas encore relié : ajoutez la clé Web3Forms dans contact.html.'; return; }
    msg.className = 'f-msg'; msg.textContent = 'Envoi…';
    try {
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const j = await r.json();
      if (!j.success) throw new Error();
      msg.className = 'f-msg ok'; msg.textContent = 'Merci ! Votre message est bien parti, on vous répond vite.'; form.reset();
    } catch { msg.className = 'f-msg err'; msg.textContent = 'L’envoi n’a pas marché. Réessayez ou écrivez-nous à contact@mylittlecupcoffee.com.'; }
  });
  const news = $('.news');
  if (news) news.addEventListener('submit', e => { e.preventDefault(); news.innerHTML = '<p style="opacity:.85">Merci, à très vite dans votre boîte mail.</p>'; });

  /* =========================================================
     ZOOM : un élément cliqué s'agrandit au centre de l'écran
     ========================================================= */
  const Z = $('.zoom');
  const ZV = Z && $('.zoom-visual', Z);
  let zState = null;

  const CHERRY_VIS = {
    cut: `<svg viewBox="0 0 100 100"><path d="M50 10c2 6 4 10 10 12" stroke="#4F6638" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 16c8-8 20-8 26-2-8 6-18 6-26 2z" fill="#3F5C2C"/>
      <circle cx="50" cy="56" r="34" fill="#B3261E"/><circle cx="50" cy="56" r="28" fill="#F4E9C9"/>
      <ellipse cx="38" cy="56" rx="11" ry="19" fill="#9FB878"/><ellipse cx="62" cy="56" rx="11" ry="19" fill="#9FB878"/>
      <path d="M41 40c4 10 4 22 0 32M59 40c-4 10-4 22 0 32" stroke="#6E8A4A" stroke-width="2.2" fill="none"/><circle cx="36" cy="34" r="5" fill="#E25A4A" opacity=".6"/></svg>`,
    peaberry: `<svg viewBox="0 0 100 100"><path d="M50 10c2 6 4 10 10 12" stroke="#4F6638" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="56" r="34" fill="#B3261E"/><circle cx="50" cy="56" r="28" fill="#F4E9C9"/>
      <ellipse cx="50" cy="56" rx="17" ry="20" fill="#9FB878"/><path d="M50 38c5 12 5 24 0 36" stroke="#6E8A4A" stroke-width="2.2" fill="none"/></svg>`,
    flower: `<svg viewBox="0 0 100 100">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="26" rx="11" ry="22" fill="#FFFDF6" stroke="#E6DCC6" stroke-width="1.4" transform="rotate(${a} 50 50)"/>`).join('')}
      <circle cx="50" cy="50" r="7" fill="#F2C94C"/>${[0, 72, 144, 216, 288].map(a => `<line x1="50" y1="50" x2="50" y2="38" stroke="#C9A63A" stroke-width="1.4" transform="rotate(${a + 36} 50 50)"/>`).join('')}</svg>`
  };

  const GROUPS = {
    aroma: {
      items: () => DATA.aromas,
      render: a => ({
        visual: `<div class="disc" style="background:${a.bg}">${a.svg}</div>`,
        kicker: a.f, title: a.n, desc: a.d,
        extra: `<p class="origin">On les trouve souvent · ${a.o}</p>`
      }),
      origin: i => $(`.token[data-aroma="${i}"] .token-disc`),
      lift: i => { const t = $(`.token[data-aroma="${i}"]`); return t; }
    },
    drink: {
      items: () => DATA.drinks,
      render: d => ({
        visual: `<div class="disc" style="background:rgba(243,244,241,.06)"><span class="cupviz">${cupSVG(d)}</span></div>`,
        kicker: `${d.cat} · ${d.p} €`, title: d.n, desc: d.d,
        extra: `<div class="zoom-specs">${d.s.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
          <div class="legend">${d.L.slice().reverse().map(l => `<span><i style="background:${l[1]}"></i>${l[2]}</span>`).join('')}</div>`
      }),
      after: v => pour(v),
      origin: (i, el) => el && ($('.cupviz', el) || el)
    },
    fact: {
      items: () => DATA.facts,
      render: (f, i, n) => ({
        visual: `<div class="disc" style="background:#F3EADC">${CHERRY_VIS[f.v] || CHERRY_VIS.cut}</div>`,
        kicker: `Le saviez-vous ? · ${i + 1} / ${n}`, title: f.t, desc: f.d, extra: ''
      })
    }
  };

  function pour(v) {
    if (!anim) return;
    const lays = $$('.lay', v); const stream = $('.stream', v);
    if (!lays.length) return;
    gsap.set(lays, { scaleY: 0, transformOrigin: '50% 100%' });
    const tl = gsap.timeline({ delay: .45 });
    if (stream) tl.fromTo(stream, { opacity: 1, scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: .35, ease: 'power2.in' });
    lays.forEach((l, i) => tl.to(l, { scaleY: 1, duration: i === 0 ? .7 : .55, ease: 'power2.out' }, i === 0 ? '-=.05' : '-=.12'));
    if (stream) tl.to(stream, { opacity: 0, duration: .3 }, '-=.2');
  }

  function fill(group, i) {
    const g = GROUPS[group]; const items = g.items(); const r = g.render(items[i], i, items.length);
    ZV.innerHTML = r.visual;
    $('.zoom-kicker', Z).textContent = r.kicker;
    $('#zoom-title', Z).textContent = r.title;
    $('.zoom-desc', Z).textContent = r.desc;
    $('.zoom-extra', Z).innerHTML = r.extra;
    $('.zoom-nav', Z).hidden = items.length < 2;
  }

  function openZoom(group, i, fromEl, liftEl) {
    if (!Z) return;
    zState = { group, i, fromEl, liftEl, lastFocus: document.activeElement };
    fill(group, i);
    Z.hidden = false;
    document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    if (liftEl) liftEl.style.visibility = 'hidden';
    $('.zoom-close', Z).focus({ preventScroll: true });
    if (anim) {
      gsap.fromTo($('.zoom-bg', Z), { opacity: 0 }, { opacity: 1, duration: .5 });
      if (fromEl) {
        const fr = fromEl.getBoundingClientRect(), vr = ZV.getBoundingClientRect();
        gsap.fromTo(ZV, { x: fr.left + fr.width / 2 - (vr.left + vr.width / 2), y: fr.top + fr.height / 2 - (vr.top + vr.height / 2), scale: Math.max(.08, fr.width / vr.width), rotate: -12 },
          { x: 0, y: 0, scale: 1, rotate: 0, duration: 1, ease: 'expo.out' });
      } else gsap.fromTo(ZV, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .9, ease: 'expo.out' });
      gsap.fromTo($$('.zoom-text > *', Z), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .06, delay: .2, ease: 'expo.out' });
    }
    const g = GROUPS[group]; if (g.after) g.after(ZV);
  }

  function closeZoom() {
    if (!zState || Z.hidden) return;
    const { fromEl, liftEl, lastFocus } = zState;
    const done = () => {
      Z.hidden = true; document.body.style.overflow = '';
      if (window.__lenis) window.__lenis.start();
      if (liftEl) liftEl.style.visibility = '';
      if (hasGsap) gsap.set(ZV, { clearProps: 'all' });
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      zState = null;
    };
    if (!anim) return done();
    const tl = gsap.timeline({ onComplete: done });
    tl.to($$('.zoom-text > *', Z), { opacity: 0, y: 16, duration: .25, stagger: .02 }, 0);
    const fr = fromEl && fromEl.getBoundingClientRect();
    if (fr && fr.width && fr.bottom > 0 && fr.top < window.innerHeight && zState.i === zState.startI) {
      const vr = ZV.getBoundingClientRect();
      const cx = vr.left + vr.width / 2 - gsap.getProperty(ZV, 'x'), cy = vr.top + vr.height / 2 - gsap.getProperty(ZV, 'y');
      tl.to(ZV, { x: fr.left + fr.width / 2 - cx, y: fr.top + fr.height / 2 - cy, scale: fr.width / (vr.width / gsap.getProperty(ZV, 'scale')), duration: .65, ease: 'expo.inOut' }, 0);
    } else tl.to(ZV, { scale: .5, opacity: 0, duration: .4, ease: 'power2.in' }, 0);
    tl.to($('.zoom-bg', Z), { opacity: 0, duration: .45 }, .15);
  }

  function step(dir) {
    if (!zState) return;
    const g = GROUPS[zState.group]; const n = g.items().length;
    const ni = (zState.i + dir + n) % n;
    const swap = () => {
      if (zState.liftEl) zState.liftEl.style.visibility = '';
      zState.i = ni;
      const lift = g.lift ? g.lift(ni) : null;
      zState.fromEl = g.origin ? g.origin(ni, null) : null;
      zState.liftEl = lift; zState.startI = ni;
      if (lift) lift.style.visibility = 'hidden';
      fill(zState.group, ni);
      if (anim) {
        gsap.fromTo(ZV, { scale: .7, opacity: 0, rotate: dir * 20, x: 0, y: 0 }, { scale: 1, opacity: 1, rotate: 0, duration: .7, ease: 'expo.out' });
        gsap.fromTo($$('.zoom-text > *', Z), { x: dir * 30, opacity: 0 }, { x: 0, opacity: 1, duration: .6, stagger: .04, ease: 'expo.out' });
      }
      if (g.after) g.after(ZV);
    };
    if (anim) gsap.to([ZV, ...$$('.zoom-text > *', Z)], { opacity: 0, duration: .2, onComplete: swap }); else swap();
  }

  if (Z) {
    $('.zoom-close', Z).addEventListener('click', closeZoom);
    $('.zoom-bg', Z).addEventListener('click', closeZoom);
    $('.zoom-next', Z).addEventListener('click', () => step(1));
    $('.zoom-prev', Z).addEventListener('click', () => step(-1));
    document.addEventListener('keydown', e => {
      if (Z.hidden) return;
      if (e.key === 'Escape') closeZoom();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'Tab') { // garder le focus dans la fenêtre
        const f = $$('button', Z).filter(b => !b.closest('[hidden]'));
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  const startZoom = (group, i, fromEl, liftEl) => { openZoom(group, i, fromEl, liftEl); if (zState) zState.startI = i; };

  // Arômes
  $$('.token').forEach(t => t.addEventListener('click', () => {
    const i = +t.dataset.aroma; startZoom('aroma', i, $('.token-disc', t), t);
  }));
  // Boissons (signatures + carte)
  $$('[data-drink]').forEach(el => {
    const go = () => {
      const i = DATA.drinks.findIndex(d => d.k === el.dataset.drink);
      if (i < 0) return;
      const cup = $('.cupviz', el) || el;
      startZoom('drink', i, cup, cup);
    };
    el.addEventListener('click', go);
    if (el.getAttribute('role') === 'button') el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // Grains flottants : un petit saut au clic
  $$('.bean').forEach(b => b.addEventListener('click', () => {
    if (!anim) return;
    gsap.timeline().to(b, { y: '-=60', rotate: '+=360', scale: 1.5, duration: .55, ease: 'power2.out' })
      .to(b, { y: '+=60', scale: 1, duration: .8, ease: 'bounce.out' });
  }));

  /* =========================================================
     Galerie : la photo s'agrandit depuis sa vignette
     ========================================================= */
  const lb = $('.lightbox');
  if (lb) {
    const lbImg = $('img', lb), cap = $('.lb-cap', lb);
    const figs = $$('.masonry figure');
    let cur = -1;
    const show = (i, from) => {
      cur = (i + figs.length) % figs.length;
      const s = $('img', figs[cur]);
      lbImg.src = s.currentSrc || s.src; lbImg.alt = s.alt;
      cap.textContent = $('figcaption', figs[cur]).textContent;
      lb.classList.add('on');
      if (window.__lenis) window.__lenis.stop();
      if (anim && from) {
        const fr = from.getBoundingClientRect();
        requestAnimationFrame(() => {
          const r = lbImg.getBoundingClientRect();
          if (!r.width) return;
          gsap.fromTo(lbImg, { x: fr.left + fr.width / 2 - (r.left + r.width / 2), y: fr.top + fr.height / 2 - (r.top + r.height / 2), scale: fr.width / r.width },
            { x: 0, y: 0, scale: 1, duration: .9, ease: 'expo.out' });
        });
      } else if (anim) gsap.fromTo(lbImg, { opacity: 0, scale: .95 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' });
    };
    const close = () => { lb.classList.remove('on'); if (window.__lenis) window.__lenis.start(); if (figs[cur]) figs[cur].focus({ preventScroll: true }); };
    figs.forEach((f, i) => {
      const go = () => { const s = $('img', f); if (s && s.style.visibility !== 'hidden') show(i, $('.ph', f)); };
      f.addEventListener('click', go);
      f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-next', lb).addEventListener('click', () => show(cur + 1));
    $('.lb-prev', lb).addEventListener('click', () => show(cur - 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1);
    });
    let sx = 0;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
  }

  if (!anim) return;

  /* =========================================================
     MOTION (GSAP)
     ========================================================= */
  if (window.Lenis && !isMobile()) {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', e => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -140 });
    }));
  }

  // Découpe du texte en lettres
  $$('.split').forEach(el => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            [...part].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.appendChild(s); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  });

  // Rideau d'entrée : la tasse se remplit (complet à la 1re visite, rapide ensuite)
  const curtain = $('.curtain');
  let seen = false; try { seen = sessionStorage.getItem('mlc-seen') === '1'; sessionStorage.setItem('mlc-seen', '1'); } catch (e) {}
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (curtain) {
    const cf = $('.cfill', curtain);
    if (cf) intro.fromTo(cf, { scaleY: 0 }, { scaleY: 1, duration: seen ? .35 : 1.1, ease: 'power2.inOut' });
    intro.to($$('svg, .curtain-word', curtain), { y: -20, opacity: 0, duration: .35, ease: 'power2.in' })
         .to(curtain, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.1')
         .set(curtain, { display: 'none' });
  }
  const heroSplit = $$('.hero .split .ch, .phead .split .ch');
  if (heroSplit.length) intro.from(heroSplit, { yPercent: 110, rotate: 6, duration: 1.2, stagger: .018 }, curtain ? '-=.55' : 0);
  if ($$('.hero .rv, .phead .rv').length) intro.to('.hero .rv, .phead .rv', { opacity: 1, y: 0, duration: 1, stagger: .08 }, '-=.9');
  if ($$('.hero .rv-clip').length) intro.to('.hero .rv-clip', { clipPath: 'inset(0% 0 0 0)', duration: 1.4, stagger: .12, ease: 'expo.inOut' }, '-=1');
  if ($('.badge')) intro.from('.badge', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)' }, '-=1');
  if ($$('.bean').length) intro.from('.bean', { scale: 0, rotate: '-=180', duration: 1, stagger: .07, ease: 'back.out(2)' }, '-=1');

  // Transition sortante entre pages
  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href) || a.target === '_blank') return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (!curtain) { location.href = href; return; }
      document.body.classList.remove('menu-open');
      gsap.set(curtain, { display: 'flex', yPercent: 100 });
      gsap.set($$('svg, .curtain-word', curtain), { y: 0, opacity: 1 });
      gsap.set($('.cfill', curtain), { scaleY: 0 });
      gsap.timeline({ onComplete: () => location.href = href })
        .to(curtain, { yPercent: 0, duration: .7, ease: 'expo.inOut' })
        .to($('.cfill', curtain), { scaleY: 1, duration: .35, ease: 'power2.inOut' }, '-=.25');
    });
  });
  window.addEventListener('pageshow', e => { if (e.persisted && curtain) gsap.set(curtain, { display: 'none' }); });

  // Apparitions au scroll
  ScrollTrigger.batch('.rv:not(.hero .rv):not(.phead .rv)', {
    start: 'top 88%', once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .09 })
  });
  $$('.rv-clip').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  $$('.split:not(.hero .split):not(.phead .split)').forEach(el => {
    gsap.from($$('.ch', el), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .012, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  // Parallaxe photos + grains
  $$('[data-speed]').forEach(el => {
    const img = $('img', el) || el;
    gsap.fromTo(img, { yPercent: -8, scale: 1.16 }, { yPercent: 8, scale: 1.16, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.bean').forEach(b => {
    const d = parseFloat(b.dataset.depth) || 1;
    gsap.to(b, { yPercent: -120 * d, rotate: `+=${90 * d}`, ease: 'none', scrollTrigger: { trigger: b.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  });

  if ($('.badge')) gsap.to('.badge', { rotate: 200, ease: 'none', scrollTrigger: { trigger: 'body', start: 0, end: 'max', scrub: 1 } });

  $$('.manifesto').forEach(m => {
    gsap.to($$('.w2', m), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: m, start: 'top 75%', end: 'bottom 45%', scrub: true } });
  });

  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count); const ob = { v: 0 };
    gsap.to(ob, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => el.textContent = Math.round(ob.v) + (el.dataset.suffix || '') });
  });

  // Roue des arômes : tourne avec le scroll
  const wheel = $('.wheel');
  if (wheel) gsap.fromTo(wheel, { '--spin': '-40deg' }, { '--spin': '80deg', ease: 'none', scrollTrigger: { trigger: wheel, start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // Une journée au comptoir : défilement horizontal
  const day = $('.day');
  if (day && !isMobile()) {
    const track = $('.day-track', day);
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.day-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
    gsap.to('.day-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.day-pin', start: 'top top', end: () => '+=' + dist(), scrub: true } });
  }

  // Torréfaction : le grain change de couleur avec la température
  const roast = $('.roast');
  if (roast) {
    const STAGES = [
      { t: 20, c: '#8FA36A', k: '#5F7243' }, { t: 150, c: '#D6BF78', k: '#A8914E' }, { t: 175, c: '#B07A45', k: '#7E5230' },
      { t: 196, c: '#7E4F2D', k: '#4E2E18' }, { t: 205, c: '#5A3622', k: '#2E1A0E' }
    ];
    const body = $('.rb-body', roast), crease = $('.rb-crease', roast), rb = $('.rb', roast), tEl = $('#roast-t');
    const lis = $$('.roast-steps li', roast); const shards = $$('.shards path', roast);
    let lastActive = -1;
    const crack = () => {
      gsap.fromTo(shards, { opacity: 1, scale: .2, x: 0, y: 0 }, { opacity: 0, scale: 1.4, x: () => gsap.utils.random(-40, 40), y: () => gsap.utils.random(-50, 30), rotate: () => gsap.utils.random(-180, 180), duration: .9, stagger: .03, ease: 'power3.out' });
      gsap.fromTo(rb, { rotate: -4 }, { rotate: 0, duration: .5, ease: 'elastic.out(1,.3)' });
    };
    ScrollTrigger.create({
      trigger: roast, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: self => {
        const f = self.progress * (STAGES.length - 1);
        const i = Math.min(STAGES.length - 2, Math.floor(f)), t = f - i;
        const a = STAGES[i], b = STAGES[i + 1];
        body.setAttribute('fill', gsap.utils.interpolate(a.c, b.c, t));
        crease.setAttribute('stroke', gsap.utils.interpolate(a.k, b.k, t));
        const temp = Math.round(a.t + (b.t - a.t) * t);
        tEl.textContent = temp;
        gsap.set(rb, { scale: 1 + self.progress * .16 });
        const act = Math.max(0, STAGES.filter(s => s.t <= temp).length - 1);
        if (act !== lastActive) {
          lis.forEach((li, k) => li.classList.toggle('on', k === act));
          if (act === 3 && lastActive < 3) crack();
          lastActive = act;
        }
      }
    });
    lis[0] && lis[0].classList.add('on');
  }

  // Boutons magnétiques (souris uniquement)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* =========================================================
     LA LIANE : une branche de caféier qui pousse en descendant
     - tige fine au bout qui pousse, plus épaisse derrière (elle « mûrit »)
     - paires de feuilles qui se déplient, vrilles qui s'enroulent, petites branches
     - fleurs qui éclosent pétale par pétale, cerises qui mûrissent du vert au rouge
     - les feuilles prennent le vent quand on scrolle vite et frémissent sous la souris
     - des pétales tombent de temps en temps
     ========================================================= */
  const NS = 'http://www.w3.org/2000/svg';
  const LEAF = 'M0 0C6-9 22-12 40-2C33 1 30 4 26 7C18 10 8 8 0 0Z';
  const VEIN = 'M2 0C14-3 26-3 38-2';
  const f1 = n => n.toFixed(1);
  const rad = a => a * Math.PI / 180;
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let V = null;

  function leafPairHTML(ang, s, spread, rnd, delay) {
    const out = [];
    [1, -1].forEach((sg, j) => {
      const a = ang + sg * spread * (0.85 + rnd() * .3);
      const grad = 'vl' + (1 + Math.floor(rnd() * 3));
      const k = (0.5 + rnd() * .9).toFixed(2);
      out.push({ a, html: `<g transform="rotate(${f1(a)}) scale(${s.toFixed(2)})"><g class="sw" style="--k:${k}"><g class="rs"><g class="o leaf" style="transition-delay:${delay + j * 120}ms"><path d="${LEAF}" fill="url(#${grad})"/><path d="${VEIN}" stroke="#C3D79A" stroke-width=".9" fill="none" opacity=".55"/></g></g></g></g>` });
    });
    return out;
  }

  function cherryHTML(fi, clickable, delay = 0) {
    const pos = [[-7, 14], [6, 16], [0, 26]];
    const green = pos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="url(#vu)"/>`).join('');
    const red = pos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="url(#vc)"/>`).join('');
    const shine = pos.map(([x, y]) => `<circle cx="${x - 2.4}" cy="${y - 2.6}" r="2" fill="#fff" opacity=".55"/>`).join('');
    const stalk = '<path d="M0 0Q-3 5-7 9M0 0Q3 5 6 10M0 0L0 19" stroke="#4F6638" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    const st = `style="transition-delay:${delay}ms"`;
    if (!clickable) return `<g class="o cl" ${st}>${stalk}<g class="berry">${green}${shine}</g></g>`;
    const f = DATA.facts[fi];
    return `<g class="o cl cherry" ${st} role="button" tabindex="0" data-fact="${fi}" aria-label="Cerise de café : ${f ? f.t : ''}"><circle cx="0" cy="18" r="${window.innerWidth < 761 ? 32 : 22}" fill="transparent"/><circle class="halo" cx="0" cy="19" r="16"/>${stalk}<g class="berry">${green}<g class="ripe">${red}</g>${shine}</g></g>`;
  }

  function flowerHTML(n, rnd, delay = 0) {
    let h = '';
    for (let f = 0; f < n; f++) {
      const ox = (rnd() - .5) * 16, oy = (rnd() - .5) * 12, sc = .7 + rnd() * .4, rot = rnd() * 72;
      h += `<g transform="translate(${f1(ox)} ${f1(oy)}) rotate(${f1(rot)}) scale(${sc.toFixed(2)})">` +
        [0, 72, 144, 216, 288].map((a, i) => `<g transform="rotate(${a})"><ellipse class="pt" cx="0" cy="-7" rx="3.4" ry="7" fill="#FFFDF6" stroke="#E2D8C2" stroke-width=".8" style="transition-delay:${delay + f * 200 + i * 70}ms"/></g>`).join('') +
        `<circle class="pt" r="2.4" fill="#F2C94C" style="transition-delay:${delay + f * 200 + 380}ms"/></g>`;
    }
    return `<g class="flower">${h}</g>`;
  }

  function tendrilD(x, y, nx, ny, sgn, size) {
    const cx = x + nx * size * 1.2, cy = y + ny * size * 1.2;
    const phi = Math.atan2(y - cy, x - cx);
    let d = `M${f1(x)} ${f1(y)}`;
    for (let i = 1; i <= 42; i++) {
      const t = i / 42, th = phi + sgn * t * Math.PI * 3.4, r = size * 1.2 * (1 - t * .84);
      d += `L${f1(cx + Math.cos(th) * r)} ${f1(cy + Math.sin(th) * r)}`;
    }
    return d;
  }

  function buildVine() {
    if (V) { V.layer.remove(); V = null; }
    const rnd = rng(20261015);
    const footer = $('.footer');
    const W = document.documentElement.clientWidth;
    const mob = W < 761;
    const gut = Math.max(0, (W - 1320) / 2) + 20;
    const L = mob ? 6 : Math.max(16, Math.min(gut * .5, 80));
    const R = W - L;
    const endY = footer ? footer.offsetTop + 90 : document.documentElement.scrollHeight - 40;
    const amp = mob ? 4 : 13;

    // passages d'un bord à l'autre : dans le haut (vide) des sections .sec
    const cross = [];
    if (W >= 900) $$('main .sec').forEach(s => {
      const pt = parseFloat(getComputedStyle(s).paddingTop);
      const top = s.getBoundingClientRect().top + window.scrollY;
      if (pt >= 90) cross.push([top + 14, top + pt - 14]);
    });
    const pts = []; let side = L, y = -30, ci = 0;
    while (y < endY) {
      const c = cross[ci];
      if (c && y + 150 > c[0]) {
        const other = side === L ? R : L;
        pts.push([side, c[0]]);
        pts.push([(side + other) / 2 + (other > side ? -1 : 1) * W * .08, (c[0] + c[1]) / 2 + 10]);
        pts.push([other, c[1]]);
        side = other; y = c[1] + 150; ci++; continue;
      }
      pts.push([side + Math.sin(y / 190) * amp * (side === L ? 1 : -1), y]);
      y += 150;
    }
    pts.push([side, endY]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }

    const H = endY + 140;
    const layer = document.createElement('div'); layer.className = 'vine'; layer.style.height = H + 'px';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.innerHTML = `<defs>
      <linearGradient id="vl1" x1="0" x2="1"><stop offset="0" stop-color="#2F4A22"/><stop offset=".6" stop-color="#4E7234"/><stop offset="1" stop-color="#7C9A4E"/></linearGradient>
      <linearGradient id="vl2" x1="0" x2="1"><stop offset="0" stop-color="#3B5A2A"/><stop offset=".55" stop-color="#5E8A3C"/><stop offset="1" stop-color="#9DBE63"/></linearGradient>
      <linearGradient id="vl3" x1="0" x2="1"><stop offset="0" stop-color="#26401C"/><stop offset=".7" stop-color="#3F5F2B"/><stop offset="1" stop-color="#5E7F3E"/></linearGradient>
      <radialGradient id="vc" cx="35%" cy="30%"><stop offset="0" stop-color="#EE6A58"/><stop offset=".65" stop-color="#B3261E"/><stop offset="1" stop-color="#7A1510"/></radialGradient>
      <radialGradient id="vu" cx="35%" cy="30%"><stop offset="0" stop-color="#D3E39A"/><stop offset="1" stop-color="#7E9A44"/></radialGradient></defs>`;
    const mk = (cls, w) => { const s = document.createElementNS(NS, 'path'); s.setAttribute('d', d); s.setAttribute('class', 'stem ' + cls); s.setAttribute('stroke-width', w); svg.appendChild(s); return s; };
    const s3 = mk('s3', mob ? 2.4 : 5.2), s2 = mob ? null : mk('s2', 3.2), s1 = mk('s1', mob ? 1.3 : 1.9);
    const tg = document.createElementNS(NS, 'g'); svg.appendChild(tg);   // vrilles
    const bg = document.createElementNS(NS, 'g'); svg.appendChild(bg);   // branches
    const orn = document.createElementNS(NS, 'g'); svg.appendChild(orn); // feuilles, fleurs, cerises
    const bud = document.createElementNS(NS, 'g'); bud.setAttribute('class', 'bud');
    bud.innerHTML = '<g transform="rotate(-30)"><path d="M0 0C4-5 11-6 15-1C10 1 5 1 0 0Z" fill="#A8C46A"/></g><g transform="rotate(30)"><path d="M0 0C4 5 11 6 15 1C10-1 5-1 0 0Z" fill="#8FB257"/></g><circle r="2.6" fill="#7C9A4E"/>';
    svg.appendChild(bud);
    layer.appendChild(svg); document.body.appendChild(layer);

    const len = s1.getTotalLength();
    [s1, s2, s3].forEach(s => { if (s) { s.style.strokeDasharray = len; s.style.strokeDashoffset = len; } });

    // tables précalculées : longueur -> point, et hauteur -> longueur (rien de lourd pendant le scroll)
    const N = Math.ceil(len / 12); const ys = new Float32Array(N + 1), ls = new Float32Array(N + 1), px = new Float32Array(N + 1), py = new Float32Array(N + 1);
    let my = -1e9;
    for (let i = 0; i <= N; i++) { const l = len * i / N; const p = s1.getPointAtLength(l); px[i] = p.x; py[i] = p.y; my = Math.max(my, p.y); ys[i] = my; ls[i] = l; }
    const ptAt = l => { const f = Math.max(0, Math.min(N, l / len * N)); const i = Math.min(N - 1, Math.floor(f)), t = f - i; return { x: px[i] + (px[i + 1] - px[i]) * t, y: py[i] + (py[i + 1] - py[i]) * t, a: Math.atan2(py[i + 1] - py[i], px[i + 1] - px[i]) * 180 / Math.PI }; };
    const lenAtY = Y => { if (Y <= ys[0]) return 0; if (Y >= ys[N]) return len; let a = 0, b = N; while (b - a > 1) { const m = (a + b) >> 1; ys[m] < Y ? a = m : b = m; } const t = (Y - ys[a]) / Math.max(1, ys[b] - ys[a]); return ls[a] + (ls[b] - ls[a]) * t; };

    const items = [], leaves = [], flowers = [];
    let factIdx = 0;
    const sc = mob ? .5 : 1;
    const addLeaves = (g, x, y, list, l) => { $$('.rs', g).forEach((rs, i) => { const a = rad(list[i].a); leaves.push({ x: x + Math.cos(a) * 20 * list[i].s, y: y + Math.sin(a) * 20 * list[i].s, el: rs, l, t: 0 }); }); };
    const place = (parent, x, y, html, extra = '') => { const g = document.createElementNS(NS, 'g'); g.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${extra}`); g.innerHTML = html; parent.appendChild(g); return g; };

    const step = mob ? 118 : 100;
    for (let l = 46, k = 0; l < len - 30; l += step, k++) {
      const p = ptAt(l);
      const ang = p.a;
      const nx = -Math.sin(rad(ang)), ny = Math.cos(rad(ang));
      const sideSign = k % 2 ? 1 : -1;
      const vertical = Math.abs(Math.cos(rad(ang))) < .5;

      // paire de feuilles opposées
      const s = (0.8 + rnd() * .35) * sc;
      const pair = leafPairHTML(ang, s, mob ? 30 : 44 + rnd() * 14, rnd, 0);
      const lg = place(orn, p.x, p.y, pair.map(o => o.html).join(''));
      addLeaves(lg, p.x, p.y, pair.map(o => ({ a: o.a, s })), l);
      items.push({ l, g: lg });

      // vrille qui s'enroule
      if (k % 3 === 1) {
        const td = document.createElementNS(NS, 'path');
        td.setAttribute('d', tendrilD(p.x, p.y, nx * sideSign, ny * sideSign, sideSign, mob ? 5 : 8 + rnd() * 4));
        td.setAttribute('class', 'td'); td.setAttribute('pathLength', '1');
        const tw = document.createElementNS(NS, 'g'); tw.appendChild(td); tg.appendChild(tw);
        items.push({ l: l + 6, g: tw });
      }

      // cerises ou fleurs
      if (k % 5 === 2) {
        const ripe = k % 10 !== 7;
        const fi = ripe ? factIdx++ % DATA.facts.length : 0;
        const cg = place(orn, p.x, p.y, cherryHTML(fi, ripe), ` rotate(${f1((rnd() - .5) * 30)}) scale(${mob ? .6 : 1.15})`);
        items.push({ l: l + 4, g: cg });
      } else if (k % 4 === 0) {
        const fx = p.x + nx * sideSign * 9 * sc, fy = p.y + ny * sideSign * 9 * sc;
        const fg = place(orn, fx, fy, flowerHTML(1 + Math.floor(rnd() * 2), rnd), ` scale(${mob ? .55 : .95})`);
        items.push({ l: l + 2, g: fg }); flowers.push({ x: fx, y: fy, l });
      }

      // petite branche qui part de la tige
      if (!mob && vertical && k % 6 === 3) {
        const left = p.x < W / 2;
        const inward = left ? gut - p.x - 12 : p.x - (W - gut) - 12;
        const outward = left ? p.x - 6 : W - p.x - 6;
        const dirX = inward >= outward ? (left ? 1 : -1) : (left ? -1 : 1);
        const blen = 85 + rnd() * 45;
        const fan = Math.max(.2, Math.min(.72, Math.max(inward, outward) * .9 / blen));
        const down = Math.sqrt(1 - fan * fan) * (ang > 0 ? 1 : -1);
        const P = { x: p.x, y: p.y }, C = { x: p.x + dirX * fan * blen * .12, y: p.y + down * blen * .6 }, E = { x: p.x + dirX * fan * blen, y: p.y + down * blen };
        const at = t => ({ x: (1 - t) * (1 - t) * P.x + 2 * (1 - t) * t * C.x + t * t * E.x, y: (1 - t) * (1 - t) * P.y + 2 * (1 - t) * t * C.y + t * t * E.y });
        const tan = t => Math.atan2(2 * (1 - t) * (C.y - P.y) + 2 * t * (E.y - C.y), 2 * (1 - t) * (C.x - P.x) + 2 * t * (E.x - C.x)) * 180 / Math.PI;
        const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'vb');
        let html = `<path class="br" pathLength="1" d="M${f1(P.x)} ${f1(P.y)}Q${f1(C.x)} ${f1(C.y)} ${f1(E.x)} ${f1(E.y)}"/>`;
        const bl = [];
        [[.42, .62, 380], [.76, .52, 650]].forEach(([t, bs, dl]) => {
          const pt = at(t); const pr = leafPairHTML(tan(t), bs, 50, rnd, dl);
          html += `<g transform="translate(${f1(pt.x)} ${f1(pt.y)})">${pr.map(o => o.html).join('')}</g>`;
          bl.push({ pt, pr, bs });
        });
        const endFact = factIdx++ % DATA.facts.length;
        html += `<g transform="translate(${f1(E.x)} ${f1(E.y)}) scale(.95)">${k % 12 === 3 ? flowerHTML(2, rnd, 850) : cherryHTML(endFact, true, 850)}</g>`;
        g.innerHTML = html; bg.appendChild(g);
        const groups = [...g.children].slice(1, 3);
        bl.forEach((b, i) => { $$('.rs', groups[i]).forEach((rs, j) => { const a = rad(b.pr[j].a); leaves.push({ x: b.pt.x + Math.cos(a) * 20 * b.bs, y: b.pt.y + Math.sin(a) * 20 * b.bs, el: rs, l: l + 40, t: 0 }); }); });
        if (k % 12 === 3) flowers.push({ x: E.x, y: E.y, l: l + 40 });
        items.push({ l: l + 10, g });
      }
    }
    items.sort((a, b) => a.l - b.l);

    $$('.cherry', svg).forEach(ch => {
      const go = () => startZoom('fact', +ch.dataset.fact, $('.berry', ch), null);
      ch.addEventListener('click', go);
      ch.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    V = { layer, s1, s2, s3, bud, len, lenAtY, ptAt, items, leaves, flowers, mob, drawn: 0, lastD: -1, shown: 0, wind: 0, windSet: 0, lastY: window.scrollY, petals: 0 };
  }

  function petal(x, y) {
    if (!V || V.petals >= 6) return;
    const el = document.createElement('i'); el.className = 'petal';
    el.style.left = f1(x) + 'px'; el.style.top = f1(y) + 'px';
    el.style.setProperty('--dx', Math.round((Math.random() - .5) * 140) + 'px');
    el.style.setProperty('--t', (2.8 + Math.random() * 1.8).toFixed(2) + 's');
    el.style.setProperty('--r', Math.round(300 + Math.random() * 400) + 'deg');
    const v = V; v.petals++;
    el.addEventListener('animationend', () => { el.remove(); v.petals--; });
    V.layer.appendChild(el);
  }

  let mx = -999, my = -999, moved = false;
  if (finePointer) window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; moved = true; }, { passive: true });

  function tickVine() {
    if (!V) return;
    const sy = window.scrollY;
    const target = V.lenAtY(sy + window.innerHeight * .8);
    V.drawn += (target - V.drawn) * .085;
    if (Math.abs(target - V.drawn) < .3) V.drawn = target;
    const d = V.drawn;
    if (Math.abs(d - V.lastD) > .4) {
      V.lastD = d;
      V.s1.style.strokeDashoffset = f1(V.len - d);
      if (V.s2) V.s2.style.strokeDashoffset = f1(V.len - Math.max(0, d - 110));
      V.s3.style.strokeDashoffset = f1(V.len - Math.max(0, d - (V.mob ? 220 : 380)));
      const p = V.ptAt(d);
      V.bud.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(d > 3 ? p.a : 90)}) scale(${V.mob ? .7 : 1})`);
      while (V.shown < V.items.length && V.items[V.shown].l <= d) V.items[V.shown++].g.classList.add('on');
      while (V.shown > 0 && V.items[V.shown - 1].l > d + 40) V.items[--V.shown].g.classList.remove('on');
    }
    // le vent : les feuilles se couchent quand on scrolle vite (ordinateur uniquement, pour rester fluide sur téléphone)
    if (V.mob) return;
    const vel = sy - V.lastY; V.lastY = sy;
    V.wind += (Math.max(-14, Math.min(14, vel * .45)) - V.wind) * .08;
    if (Math.abs(V.wind - V.windSet) > .06) { V.windSet = V.wind; V.layer.style.setProperty('--wind', V.wind.toFixed(2)); }
    // la souris fait frémir les feuilles (et tomber un pétale)
    if (moved) {
      moved = false;
      const X = mx, Y = my + sy, now = performance.now();
      for (const lf of V.leaves) {
        if (lf.l > d || Math.abs(lf.y - Y) > 46 || Math.abs(lf.x - X) > 46 || now - lf.t < 1100) continue;
        lf.t = now; lf.el.classList.add('rustle');
        setTimeout(() => lf.el.classList.remove('rustle'), 950);
      }
      for (const fl of V.flowers) {
        if (fl.l <= d && Math.abs(fl.y - Y) < 30 && Math.abs(fl.x - X) < 30 && Math.random() < .25) petal(fl.x, fl.y);
      }
    }
  }

  // un pétale tombe de temps en temps d'une fleur visible
  setInterval(() => {
    if (!V || document.hidden || (V.mob && Math.random() < .5)) return;
    const top = window.scrollY, bot = top + window.innerHeight;
    const vis = V.flowers.filter(f => f.l <= V.drawn && f.y > top + 60 && f.y < bot - 60);
    if (vis.length) { const f = vis[Math.floor(Math.random() * vis.length)]; petal(f.x, f.y); }
  }, 2600);

  let vineTimer;
  let lastW = window.innerWidth, lastH = document.documentElement.scrollHeight;
  const ensureVine = () => { const dd = V ? V.drawn : 0; buildVine(); V.drawn = Math.min(dd, V.len); lastH = document.documentElement.scrollHeight; };
  const rebuild = () => { clearTimeout(vineTimer); vineTimer = setTimeout(ensureVine, 250); };
  window.addEventListener('load', () => { ScrollTrigger.refresh(); ensureVine(); });
  if (document.readyState === 'complete') ensureVine();
  else setTimeout(() => { if (!V) ensureVine(); }, 1200);
  window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; rebuild(); } });
  ScrollTrigger.addEventListener('refresh', () => { const h = document.documentElement.scrollHeight; if (V && Math.abs(h - lastH) > 40) { lastH = h; rebuild(); } });
  gsap.ticker.add(tickVine);
})();
