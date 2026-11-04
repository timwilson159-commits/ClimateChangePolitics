// Net Zero Desk - UI
(function () {
  const app = document.getElementById('app');
  const muteBtn = document.getElementById('mute');
  let G = null, busy = false, seenIntro = false;
  const CFG = NZ.CFG;
  const DN_TEMP = (() => { let c = 0; for (let r = 1; r <= CFG.rounds; r++) c += CFG.yearsPerRound * NZ.baseline(r); return NZ.tempFromC(c); })();
  // use a supplied image (assets/manifest.js, written by art_mapper.html) when there is one, else the SVG
  window.__fb = img => { if (!img.dataset.f && /\.(png|webp|jpg)$/.test(img.src)) { img.dataset.f = 1; img.src = img.src.replace(/\.(png|webp|jpg)$/, '.svg'); } else img.style.display = 'none'; };
  const FB = 'onerror="__fb(this)"';
  const art = p => { const m = p.match(/^assets\/(\w+)\/(\w+)\.svg$/); const e = m && (window.RASTER || {})[m[1] + '/' + m[2]]; return e ? 'assets/' + m[1] + '/' + m[2] + '.' + e : p; };
  const ENDINGS = {
    hero:         { title: 'Climate Hero',            img: 'ending_hero',         line: 'Cooler planet AND voters who still like you. Rare and brilliant.' },
    saviour:      { title: 'The Lonely Saviour',      img: 'ending_saviour',      line: 'You saved the climate, but made some enemies. History may thank you.' },
    crowdpleaser: { title: 'Popular but Toasty',      img: 'ending_crowdpleaser', line: 'Everyone loved you. The planet is sweating, though.' },
    panic:        { title: 'The Last-Minute Panicker',img: 'ending_panic',        line: 'You acted late. Pollution you made early is still heating the Earth.' },
    fooled:       { title: 'The Greenwash Champion',  img: 'ending_fooled',       line: 'Too many shiny promises fooled you. Next time, check the fine print!' },
    nothing:      { title: 'The Sleepy Leader',       img: 'ending_nothing',      line: 'Barely anything got stamped. The Earth noticed.' },
    steady:       { title: 'The Steady Hand',         img: 'ending_steady',       line: 'A fair effort with some wins. Can you push it further?' }
  };
  const MEDALS = {
    nobody:   ['🕵️', 'Nobody’s Fool', 'You fell for no greenwash at all.'],
    early:    ['⏰', 'Early Bird', '4+ big pollution cuts in your first 3 terms.'],
    crowd:    ['🎉', 'Crowd Favourite', 'Average popularity of 65+.'],
    tough:    ['💪', 'Tough Love', 'Unpopular, but you cut warming a lot.'],
    spender:  ['💸', 'Big Spender', 'Spent nearly every point.'],
    saver:    ['🐷', 'Penny Pincher', 'Finished with 45+ points unspent.'],
    storm:    ['⛈️', 'Storm Proof', 'Protected your people from 3+ disasters.'],
    payitfwd: ['🔁', 'Pay It Forward', '4+ money-back policies in the first 4 terms.'],
    elect:    ['🗳️', 'Election Winner', 'Won both elections.'],
    checker:  ['🔍', 'Fact-Checker', 'Used all 3 fact-checks and fell for no greenwash.'],
    thrive:   ['🌿', 'Thriving Country', 'Nature and Health both 60+ in 2050.'],
    perfect:  ['🏆', 'Near Perfect', 'Reached 90% of the best warming result.']
  };
  const DISCUSS = [
    'Which paper would you take back, and why?',
    'Which advisor did you trust the most? Were they right?',
    'Was it worth losing votes to cut more pollution?',
    'Why do early actions help more than late ones?',
    'Which greenwash paper almost fooled you? What was the clue?',
    'In real life, who pays the cost of climate action? Who pays the cost of doing nothing?'
  ];
  const QLABEL = { jobs: ['💼', 'Jobs'], health: ['❤️', 'Health'], living: ['🛒', 'Cost of living'], nature: ['🌳', 'Nature'], safety: ['🚑', 'Safety'] };

  // ---------- helpers ----------
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const yearOf = r => CFG.firstYear + CFG.yearsPerRound * (r - 1);
  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
  const face = p => p >= 80 ? '🤩' : p >= 62 ? '😄' : p >= 48 ? '🙂' : p >= 34 ? '😐' : p >= 20 ? '🙁' : '😡';
  const T2 = t => '+' + t.toFixed(2) + '°C';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function show(node) { document.body.classList.toggle('on-title', node.classList.contains('title-screen')); app.innerHTML = ''; app.appendChild(node); window.scrollTo(0, 0); }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ---------- sound ----------
  let ac = null, muted = load('nzd_muted', false);
  function actx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ac; }
  function tone(f, d, type = 'sine', v = 0.15, when = 0, slide = 0) {
    if (muted) return; const a = actx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(); const t = a.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, v = 0.2, when = 0) {
    if (muted) return; const a = actx(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * d, a.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = v; s.connect(g).connect(a.destination); s.start(a.currentTime + when);
  }
  const sfx = {
    stamp: () => { noise(0.12, 0.35); tone(130, 0.18, 'sine', 0.4, 0, -80); },
    reject: () => { noise(0.1, 0.3); tone(90, 0.22, 'square', 0.12, 0, -40); },
    coin: () => { tone(988, 0.08, 'square', 0.08); tone(1319, 0.18, 'square', 0.08, 0.08); },
    swish: () => noise(0.18, 0.08),
    nope: () => { tone(160, 0.12, 'sawtooth', 0.12); tone(120, 0.18, 'sawtooth', 0.12, 0.12); },
    good: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.1)); },
    bad: () => { [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.15)); },
    alarm: () => { [0, 0.25, 0.5].forEach(t => tone(880, 0.15, 'square', 0.08, t)); },
    check: () => { tone(660, 0.1, 'sine', 0.12); tone(880, 0.15, 'sine', 0.12, 0.1); },
    click: () => tone(500, 0.05, 'square', 0.06)
  };
  function syncMute() { muteBtn.textContent = muted ? '🔇' : '🔊'; }
  muteBtn.onclick = () => { muted = !muted; save('nzd_muted', muted); syncMute(); if (!muted) sfx.click(); };
  syncMute();

  // ---------- title ----------
  function showTitle() {
    const runs = load('nzd_runs', []);
    const best = runs.slice().sort((a, b) => b.score - a.score).slice(0, 5);
    const n = h(`<div class="screen title-screen">
      <div class="hero"><img src="${art('assets/endings/title_screen.svg')}" ${FB} alt="A globe under a giant stamp"></div>
      <h1 class="logo">NET ZERO DESK</h1>
      <p class="tag">You are the Prime Minister. Stamp the papers. Stop the planet overheating by 2050.</p>
      <div class="row"><button class="btn green big" id="play">▶ Play</button><button class="btn ghost" id="how">How to play</button></div>
      ${best.length ? `<div class="best-runs"><h3>🏅 Your best runs</h3>${best.map(r => `<div><span>${esc(r.title)}</span><span>${T2(r.T)} · ${r.pop}% votes · ${'★'.repeat(r.stars)}</span></div>`).join('')}</div>` : ''}
    </div>`);
    show(n);
    n.querySelector('#play').onclick = () => { actx(); sfx.click(); showStory(0); };
    n.querySelector('#how').onclick = () => { actx(); sfx.click(); showStory(0); };
  }

  // ---------- story / how to play ----------
  const SLIDES = [
    { img: 'assets/people/pm.svg', html: '<h2>Everyone is sick of normal politicians.</h2><p>So they voted for <b>YOU</b> and your brand-new <b>Real Action Party</b>.</p><p>Now you are Prime Minister. Time to do something real.</p>' },
    { img: 'assets/endings/ending_hero.svg', html: '<h2>Your mission</h2><p>It is <b>2026</b>. You have <b>12 terms</b> of 2 years to <b>keep global warming as low as possible by 2050</b>.</p><p>Pretend the whole world copies Australia. Whatever you do, everyone does.</p><p>🌡️ Warming is already about +1.4°C. Do nothing and it hits about <b>+2.2°C</b>. <b>Lower is better.</b></p>' },
    { img: 'assets/papers/solar_rooftop.svg', html: '<h2>Papers on your desk</h2><p>Each term, <b>3 papers</b> land on your desk. Stamp <b>APPROVE ✅</b> or <b>REJECT ❌</b>.</p><p>💰 <b>Points</b> pay for policies (money + political effort).<br>😊 <b>Votes</b> show if people like you.<br>🏭 <b>Pollution</b> means the gases that heat the planet. Cut it!<br>🔁 Some papers give points back every term.<br>⏳ Some take years to start working.</p>' },
    { img: 'assets/ui/election_win.svg', html: '<h2>Elections</h2><p>After terms <b>4</b> and <b>8</b> there is an <b>election</b>.</p><p>You need <b>50% of the votes</b> to win. Lose, and you lose points and a law.</p><p>Voters hate big costs. Voters love good news!</p>' },
    { img: null, html: '<h2>Watch out for tricks!</h2><p>Some papers look great but hide the truth. Read the 🔍 <b>fine print</b> and use your <b>3 fact-checks</b> wisely.</p><p>Your advisors will help, but not all of them are on your side.</p><div class="advrow">' +
      ['sci', 'lob', 'spin'].map(k => `<div><img src="${art(ADVISORS[k].img)}" ${FB} alt=""><b>${ADVISORS[k].name}</b><span>${ADVISORS[k].blurb}</span></div>`).join('') + '</div>' }
  ];
  function showStory(i) {
    const s = SLIDES[i];
    const n = h(`<div class="screen story"><div class="card">
      ${s.img ? `<div class="pic"><img src="${art(s.img)}" ${FB} alt=""></div>` : ''}
      <div>${s.html}</div>
      <div class="dots">${SLIDES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="row">${i > 0 ? '<button class="btn ghost" id="back">◀ Back</button>' : ''}<button class="btn green" id="next">${i === SLIDES.length - 1 ? 'Start the game ▶' : 'Next ▶'}</button></div>
    </div></div>`);
    show(n);
    n.querySelector('#next').onclick = () => { sfx.click(); i === SLIDES.length - 1 ? startGame() : showStory(i + 1); };
    const b = n.querySelector('#back'); if (b) b.onclick = () => { sfx.click(); showStory(i - 1); };
  }

  // ---------- game flow ----------
  function startGame() {
    G = NZ.newGame(PAPERS, EVENTS);
    nextTerm();
  }
  function nextTerm() {
    NZ.startRound(G);
    renderDesk(true);
  }

  function hudHTML() {
    const proj = NZ.tempProjected(G);
    const col = proj < 1.78 ? 'good' : proj < 2.0 ? '' : 'bad';
    const pips = Array.from({ length: CFG.rounds }, (_, k) => `<i class="${k + 1 < G.round || (G.phase === 'news' && k + 1 === G.round) ? 'done' : k + 1 === G.round ? 'now' : ''}" title="${yearOf(k + 1)}"></i>`).join('');
    const left = G.phase === 'desk' ? G.offers.length - G.idx : 0;
    return `<div class="hud">
      <div class="tile pts"><small>Points</small><div class="big" id="ptsv">💰 ${G.pts}</div><div class="sub">${G.phase === 'desk' ? 'to last until 2050' : 'left to spend'}</div></div>
      <div class="tile"><small>Year</small><div class="big">${yearOf(G.round)}</div><div class="pips">${pips}</div><div class="sub">Term ${G.round}/${CFG.rounds}${G.phase === 'desk' ? ' · ' + left + ' paper' + (left === 1 ? '' : 's') + ' left' : ''}</div></div>
      <div class="tile"><small>Votes</small><div class="big" id="popv">${face(G.pop)} ${G.pop}%</div><div class="meter"><b style="width:${G.pop}%"></b><b class="cover" style="width:${100 - G.pop}%"></b><u></u></div></div>
      <div class="tile"><small>2050 forecast</small><div class="big ${col}" id="fcv">🌡️ ${T2(proj)}</div><div class="sub">Lower is better. Do nothing: ${T2(DN_TEMP)}</div></div>
    </div>`;
  }

  function budgetState() {
    const left = CFG.rounds - G.round, per = G.pts / (left + 1);
    if (G.round <= 3) return { cls: 'ok', msg: '💡 Early policies help most. Spend, but keep some for later.' };
    if (per >= 4) return { cls: 'ok', msg: '✅ Plenty of points left' };
    if (per >= 2) return { cls: 'warn', msg: '⚠️ Points are getting low' };
    return { cls: 'over', msg: '🚨 Almost out of points' };
  }
  function budgetHTML_old() {
    const B = Math.max(1, G.termBudget), X = G.spent, ratio = X / B;
    const cls = ratio <= 1.4 ? 'ok' : ratio <= 2.4 ? 'warn' : 'over';
    const msg = ratio <= 1.4 ? '✅ On track' : ratio <= 2.4 ? '⚠️ Spending fast' : '🚨 Overspending. Later terms will run short';
    const left = CFG.rounds - G.round;
    return `<div class="budget ${cls}"><div class="bhead"><b>🧾 This term’s budget</b><span>Spent <b>💰${X}</b> of about <b>💰${B}</b></span></div>
      <div class="bbar"><i style="width:${Math.min(100, Math.round(ratio * 100))}%"></i><u></u></div>
      <div class="bmsg"><span>${msg}</span><span>💰${G.pts} left · ${left} more term${left === 1 ? '' : 's'} after this${G.income ? ' · +' + G.income + ' paid back' : ''}</span></div></div>`;
  }

  function budgetHTML() {
    const st = budgetState(), left = CFG.rounds - G.round, pct = Math.max(0, Math.min(100, Math.round(G.pts / CFG.startPts * 100)));
    return `<div class="budget ${st.cls}"><div class="bhead"><b>🧾 Points left: 💰${G.pts}</b><span>Spent this term: <b>💰${G.spent}</b></span></div>
      <div class="bbar"><i style="width:${pct}%"></i></div>
      <div class="bmsg"><span>${st.msg}</span><span>${left} more term${left === 1 ? '' : 's'} after this${G.income ? ' · +' + G.income + ' paid back' : ''}</span></div></div>`;
  }

  const COACH = [
    '👆 Read the paper. The 3 badges show what it COSTS, what VOTERS think, and how much POLLUTION it cuts.',
    '🗣️ Advisors give advice, but not all are honest! Tap 🔍 to read the fine print.',
    '✅ Fact-check shows the TRUE numbers. You only get 3, so save them for papers that look too good to be true.',
    '🧾 Points do not refill much (only from 🔁 papers). They have to last until 2050, so spend them on the best papers, early.'
  ];

  function badgeHTML(o) {
    const p = o.p, sh = NZ.offerShown(o);
    const tr = { cost: o.cost, pop: p.pop, emis: p.emis };
    const wrong = (k) => o.checked && sh[k] !== (k === 'cost' ? o.shownCost : (p.shown && p.shown[k] !== undefined ? p.shown[k] : tr[k])) ;
    const old = (k) => (o.checked && p.shown && p.shown[k] !== undefined && p.shown[k] !== tr[k]) || (k === 'cost' && o.checked && o.shownCost !== o.cost) ? `<s>${k === 'cost' ? o.shownCost : p.shown[k]}${k === 'emis' ? '%' : ''}</s>` : '';
    const emisV = sh.emis, popV = sh.pop;
    const afford = G.pts >= sh.cost;
    return `<div class="badges">
      <div class="badge cost ${o.checked ? 'checked' : ''}"><div class="ic">💰</div><div class="v">${old('cost')}${sh.cost}</div><div class="l">Cost</div></div>
      <div class="badge ${popV > 0 ? 'pos' : popV < 0 ? 'neg' : ''} ${o.checked ? 'checked' : ''}"><div class="ic">${popV > 0 ? '😊' : popV < 0 ? '😠' : '😐'}</div><div class="v ${popV > 0 ? 'good' : popV < 0 ? 'bad' : ''}">${old('pop')}${sgn(popV)}</div><div class="l">Votes</div></div>
      <div class="badge ${emisV > 0 ? 'pos' : ''} ${o.checked ? 'checked' : ''}"><div class="ic">🏭</div><div class="v ${emisV > 0 ? 'good' : ''}">${old('emis')}${emisV > 0 ? '−' + emisV + '%' : '0%'}</div><div class="l">Pollution</div></div>
    </div>`;
  }
  function chipsHTML(o) {
    const p = o.p, c = [];
    if (o.reissue) c.push(`<span class="chip r">📈 Back again, now ${Math.round((o.cost / p.cost - 1) * 100)}% pricier</span>`);
    if (p.pay) c.push(`<span class="chip g">🔁 Pays back 💰${p.pay} every term</span>`);
    if (p.delay) c.push(`<span class="chip y">⏳ Pollution cut starts in ${p.delay * 2} years</span>`);
    if (p.syn) { const ids = Object.keys(p.syn).filter(id => G.byId[id]); const have = ids.filter(id => G.approved.some(a => a.p.id === id));
      if (have.length) c.push(`<span class="chip b">🔗 Team-up bonus with ${esc(G.byId[have[0]].title)}</span>`);
      else c.push(`<span class="chip b">🔗 Team up with ${esc(G.byId[ids[0]].title)} for extra pollution cut</span>`); }
    if (p.area === 'adapt') c.push(`<span class="chip b">🛡️ Protects against disasters</span>`);
    return c.length ? `<div class="chips">${c.join('')}</div>` : '';
  }

  function renderDesk(newTerm) {
    const o = G.offers[G.idx];
    const area = AREAS[o.p.area], adv = ADVISORS[o.p.adv];
    const afford = G.pts >= o.cost;
    const sh = NZ.offerShown(o);
    const n = h(`<div class="screen deskwrap">
      ${hudHTML()}
      <aside class="keyguide" aria-label="Keyboard shortcuts"><b>Quick keys</b>
        <div class="kk" data-k="a"><kbd>A</kbd><span>Approve</span></div>
        <div class="kk" data-k="x"><kbd>X</kbd><span>Reject</span></div>
        <div class="kk" data-k="f"><kbd>F</kbd><span>Fact-check</span></div>
        <div class="kk" data-k="r"><kbd>R</kbd><span>Fine print</span></div>
        ${G.round === 1 ? `<div class="ktip">${COACH[G.idx] || COACH[3]}</div>` : ''}
      </aside>
      <div class="stage">
        ${G.round === 1 ? `<div class="coach inline">${COACH[G.idx] || COACH[3]}</div>` : ''}
        ${budgetHTML()}
        <div class="paper" id="paper"><div class="pgrid"><div class="pcol-l">
          <div class="ptop"><span class="area">${area.icon} ${area.name}</span><span>Paper ${G.idx + 1} of ${G.offers.length}</span></div>
          <div class="pimg"><img src="${art('assets/papers/' + o.p.id + '.svg')}" alt="${esc(o.p.title)}" ${FB}></div>
          </div><div class="pcol-r">
          <h2>${esc(o.p.title)}</h2>
          <p class="desc">${esc(o.p.text)}</p>
          ${badgeHTML(o)}
          ${chipsHTML(o)}
          <div class="advice"><div class="face"><img src="${art(adv.img)}" ${FB} alt="${adv.name}"></div>
            <div class="bubble"><b>${adv.name} · ${adv.role}</b>“${esc(o.p.say)}”</div></div>
          <div class="tools">
            <button class="tool" id="fineb">🔍 Fine print <kbd>R</kbd></button>
            <button class="tool" id="factb" ${o.checked || G.checks <= 0 ? 'disabled' : ''}>${o.checked ? '✅ Fact-checked' : `✅ Fact-check (${G.checks} left) <kbd>F</kbd>`}</button>
          </div>
          <div class="fine" id="fine" hidden><b>Fine print</b>${esc(o.p.fine)}</div>
        </div></div></div>
        <div class="stamps">
          <button class="stampbtn rj" id="btnrj">❌ REJECT <kbd>X</kbd><small>Costs nothing</small></button>
          <button class="stampbtn ap" id="btnap" ${afford ? '' : 'disabled'}>✅ APPROVE <kbd>A</kbd><small>${afford ? '💰 ' + o.cost + ' · leaves ' + (G.pts - o.cost) : 'Need 💰 ' + (o.cost - G.pts) + ' more'}</small></button>
        </div>
      </div>
      ${newTerm && G.idx === 0 ? `<div class="termbanner"><div>${yearOf(G.round)}<small>Term ${G.round} of ${CFG.rounds}</small></div></div>` : ''}
    </div>`);
    if (window.__still) { n.classList.add("still"); n.querySelector(".paper").classList.add("still"); window.__still=false; }
    show(n);
    if (!n.classList.contains("still")) sfx.swish();
    const fine = n.querySelector('#fine');
    n.querySelector('#fineb').onclick = () => { fine.hidden = !fine.hidden; sfx.click(); };
    n.querySelector('#factb').onclick = () => { if (NZ.factCheck(G, G.idx)) { sfx.check(); renderDeskKeep(true); } };
    n.querySelector('#btnrj').onclick = () => decide(false);
    n.querySelector('#btnap').onclick = () => { if (!afford) { sfx.nope(); n.querySelector('#btnap').classList.add('shake'); return; } decide(true); };
  }
  function renderDeskKeep(fineOpen) { window.__still=true; const was = !document.getElementById('fine').hidden; renderDesk(false); if (was || fineOpen) { const f = document.getElementById('fine'); if (f) f.hidden = false; } }

  function floatText(txt, cls, x, y) {
    const e = document.createElement('div'); e.className = 'float ' + cls; e.textContent = txt; e.style.left = x + 'px'; e.style.top = y + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 1300);
  }
  async function decide(ok) {
    if (busy) return; busy = true;
    const paper = document.getElementById('paper');
    const i = G.idx, o = G.offers[i];
    const before = { pts: G.pts, pop: G.pop };
    const mark = h(`<div class="stampmark ${ok ? 'ap' : 'rj'}">${ok ? 'APPROVED' : 'REJECTED'}</div>`);
    paper.appendChild(mark);
    let res = null;
    if (ok) { res = NZ.approve(G, i); sfx.stamp(); sfx.coin(); } else { NZ.reject(G, i); sfx.reject(); }
    const r = paper.getBoundingClientRect();
    if (ok) {
      const real = o.p;
      floatText('−' + o.cost + ' 💰', 'bad', r.left + 20, r.top + 30);
      if (real.pop) floatText(sgn(real.pop) + ' votes', real.pop > 0 ? 'good' : 'bad', r.left + r.width / 2 - 30, r.top + 60);
      if (real.emis + (res.bonus || 0) > 0) setTimeout(() => floatText('−' + (real.emis + (res.bonus || 0)) + '% pollution' + (real.delay ? ' (later)' : ''), 'good', r.left + r.width - 190, r.top + 90), 150);
      if (res.bonus) setTimeout(() => floatText('🔗 Pair bonus!', 'good', r.left + r.width / 2 - 50, r.top + 130), 300);
    }
    if (!ok && NZ.isGreenwash(o.p)) floatText('🕵️ Good catch! That one was misleading.', 'good', Math.max(10, r.left - 10), r.top + 20);
    await wait(650);
    if (res && res.deceived) { await showDeceived(o, res.penalty); }
    paper.classList.add(ok ? 'out-approve' : 'out-reject');
    await wait(420);
    busy = false;
    G.idx++;
    if (G.idx >= G.offers.length) return finishTerm();
    renderDesk(false);
  }

  function showDeceived(o, penalty) {
    return new Promise(resolve => {
      sfx.alarm();
      const p = o.p, adv = ADVISORS[p.adv];
      const shown = (p.shown && p.shown.emis !== undefined) ? p.shown.emis : p.emis;
      const m = h(`<div class="modal"><div class="mcard"><div class="mi">🚨</div><h2>You were tricked!</h2>
        <p class="big"><b>${esc(p.title)}</b> promised <b class="good">−${shown}%</b> pollution.<br>The truth: only <b class="bad">${p.emis > 0 ? '−' + p.emis + '%' : '0%'}</b>.</p>
        <p class="why"><b>The catch:</b> ${esc(p.fine)}</p>
        ${penalty ? `<p class="bad"><b>You also lost 💰${penalty} points cleaning up the mess.</b></p>` : ""}
        <p><b>Greenwash</b> = sounds green, does little. ${adv.name} (${adv.role}) pitched this one. Think about whether to trust them next time.</p>
        <p class="tip">💡 Next time, read the 🔍 fine print or spend a ✅ fact-check on papers that look too good to be true.</p>
        <button class="btn green" id="gotit">Got it</button></div></div>`);
      document.body.appendChild(m);
      m.querySelector('#gotit').onclick = () => { sfx.click(); m.remove(); resolve(); };
    });
  }

  // ---------- news ----------
  function chartSVG() {
    const W = 520, H = 190, L = 40, R = 12, T = 12, B = 28, n = CFG.rounds;
    const x = r => L + (W - L - R) * ((r - 1) / (n - 1));
    const maxY = 125, minY = 0;
    const y = v => T + (H - T - B) * (1 - (v - minY) / (maxY - minY));
    const base = Array.from({ length: n }, (_, k) => [x(k + 1), y(NZ.baseline(k + 1))]);
    const mine = G.history.map(hh => [x(hh.round), y(hh.E)]);
    // forecast of the rest using what is approved
    const fc = [];
    if (G.history.length) {
      fc.push(mine[mine.length - 1]);
      for (let r = G.round + 1; r <= n; r++) { let cut = G.cut; G.sched.forEach(s => { if (s.at <= r) cut += s.amt; }); fc.push([x(r), y(Math.max(CFG.floorE, NZ.baseline(r) - cut))]); }
    }
    const pl = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    let grid = '';
    [0, 50, 100].forEach(v => { grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#d9dde6" stroke-width="2"/><text x="${L - 6}" y="${y(v) + 4}" font-size="14" text-anchor="end" fill="#6b7488" font-family="Arial">${v}%</text>`; });
    let xl = '';
    [1, 4, 8, 12].forEach(r => { xl += `<text x="${x(r)}" y="${H - 8}" font-size="14" text-anchor="middle" fill="#6b7488" font-family="Arial">${yearOf(r)}</text>`; });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pollution over time">${grid}${xl}
      <polyline points="${pl(base)}" fill="none" stroke="#8a94a6" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>
      ${fc.length > 1 ? `<polyline points="${pl(fc)}" fill="none" stroke="#2e9e5b" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round" opacity=".7"/>` : ''}
      ${mine.length ? `<polyline points="${pl(mine)}" fill="none" stroke="#2e9e5b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${mine[mine.length - 1][0]}" cy="${mine[mine.length - 1][1]}" r="6" fill="#ffd23f" stroke="#1f2a44" stroke-width="3"/>` : ''}
    </svg>`;
  }

  function finishTerm() {
    const ev = NZ.endRound(G);
    renderNews(ev);
  }
  function renderNews(ev) {
    const e = ev.event;
    const isLast = G.round >= CFG.rounds;
    const chips = [];
    if (ev.pop) chips.push(`<span class="eff ${ev.pop > 0 ? 'g' : 'r'}">${ev.pop > 0 ? '😊' : '😠'} ${sgn(ev.pop)} votes</span>`);
    if (ev.pts) chips.push(`<span class="eff g">💰 +${ev.pts} points</span>`);
    for (const k in ev.qol) chips.push(`<span class="eff r">${QLABEL[k][0]} ${QLABEL[k][1]} ${sgn(ev.qol[k])}</span>`);
    if (ev.drift) chips.push(`<span class="eff ${ev.drift > 0 ? 'g' : 'r'}">🏘️ Daily life ${ev.drift > 0 ? 'improving' : 'getting worse'}: ${sgn(ev.drift)} votes</span>`);
    const mine = G.approved.filter(a => a.round === G.round);
    const factSrc = mine.length ? mine[Math.floor(Math.random() * mine.length)].p : G.offers[0].p;
    const hist = G.history[G.history.length - 1];
    const sp = G.spentHistory[G.spentHistory.length - 1];
    const leftTerms = CFG.rounds - G.round;
    const nextB = leftTerms > 0 ? Math.max(0, Math.round((G.pts + G.approved.reduce((a, x) => a + x.p.pay, 0) * leftTerms) / leftTerms)) : 0;
    const bw = 520, bh = 120, maxV = Math.max(30, ...G.spentHistory.map(x => Math.max(x.spent, x.budget)));
    const bars = G.spentHistory.map((x, k) => {
      const w = (bw - 30) / CFG.rounds, bx = 24 + k * w, hh = (bh - 28) * x.spent / maxV, by = bh - 18 - hh, mk = bh - 18 - (bh - 28) * x.budget / maxV;
      const c = x.spent <= x.budget * 1.4 ? '#2e9e5b' : x.spent <= x.budget * 2.4 ? '#ffb100' : '#e5533d';
      return '<rect x="' + (bx + 3) + '" y="' + by + '" width="' + (w - 6) + '" height="' + Math.max(1, hh) + '" rx="4" fill="' + c + '" stroke="#1f2a44" stroke-width="2"/>' +
        '<line x1="' + bx + '" x2="' + (bx + w) + '" y1="' + mk + '" y2="' + mk + '" stroke="#1f2a44" stroke-width="3" stroke-dasharray="4 3"/>' +
        '<text x="' + (bx + w / 2) + '" y="' + (bh - 4) + '" font-size="13" text-anchor="middle" fill="#6b7488" font-family="Arial">' + String(yearOf(x.round)).slice(2) + '</text>';
    }).join('');
    const budgetMsg = sp.spent <= sp.budget * 1.4 ? '✅ You kept to your budget this term.' : sp.spent <= sp.budget * 2.4 ? '⚠️ You spent more than your fair share. Watch the next term.' : '🚨 You overspent a lot. Your points may run short later.';
    const goodEv = ev.protected;
    const n = h(`<div class="screen news">
      ${hudHTML()}
      <div class="card" style="margin-top:14px">
        <div class="paperhead"><span>The Daily Globe</span><span>${yearOf(G.round)}–${yearOf(G.round) + 2}</span></div>
        <div class="evimg"><img src="${art('assets/events/' + e.id + '.svg')}" alt="" ${FB}></div>
        <div class="evtitle">${esc(e.title)}</div>
        <p style="font-size:1.15rem;margin:.2em 0">${esc(ev.text)}</p>
        <div class="effects">${chips.join('')}</div>
      </div>
      <div class="card">
        <h3>📉 Pollution so far</h3>
        <div class="sumrow">
          <span class="eff">🏭 This term: ${Math.round(hist.E)}% of today</span>
          <span class="eff">Do nothing would be: ${Math.round(hist.base)}%</span>
          <span class="eff ${NZ.tempProjected(G) < 1.9 ? 'g' : 'r'}">🌡️ 2050 forecast ${T2(NZ.tempProjected(G))}</span>
        </div>
        <div class="chartbox">${chartSVG()}</div>
        <div class="legend"><span><i style="background:#2e9e5b"></i>You</span><span><i style="background:#8a94a6"></i>Do nothing</span><span><i style="background:#2e9e5b;opacity:.5"></i>Your forecast</span></div>
        <div class="didyou">💡 ${esc(factSrc.fact)}</div>
      </div>
      <div class="card">
        <h3>🧾 Budget check</h3>
        <div class="sumrow"><span class="eff ${sp.spent <= sp.budget * 1.4 ? 'g' : 'r'}">Spent this term: 💰${sp.spent} (budget ≈ 💰${sp.budget})</span><span class="eff">💰${G.pts} left</span><span class="eff">${leftTerms} term${leftTerms === 1 ? '' : 's'} to go</span>${leftTerms ? `<span class="eff">Next budget ≈ 💰${nextB} a term</span>` : ''}${G.deceivedLog.length ? `<span class="eff r">🚨 Deceived so far: ${G.deceivedLog.length}</span>` : ''}</div>
        <p style="margin:4px 0"><b>${budgetMsg}</b></p>
        <div class="chartbox"><svg viewBox="0 0 ${bw} ${bh}" role="img" aria-label="Points spent each term">${bars}</svg></div>
        <div class="legend"><span><i style="background:#2e9e5b"></i>Spent each term</span><span><i style="background:#1f2a44;height:3px"></i>Fair share</span></div>
        <div class="didyou">💡 Money-back policies (🔁) bought early give you more points to spend in later terms.</div>
      </div>
      <div class="row" style="margin-top:14px"><button class="btn green big" id="go">${isLast ? '🌏 See the Year 2050' : NZ.electionDue(G) ? '🗳️ Election time!' : 'Next term ▶'}</button></div>
    </div>`);
    show(n);
    (goodEv ? sfx.good : sfx.bad)();
    n.querySelector('#go').onclick = () => {
      sfx.click();
      if (isLast) return showFinal();
      if (NZ.electionDue(G)) return showElection();
      nextTerm();
    };
  }

  // ---------- election ----------
  function showElection() {
    const popBefore = G.pop;
    const res = NZ.runElection(G);
    const n = h(`<div class="screen election"><div class="card">
      <h2 style="text-align:center">🗳️ Election ${yearOf(G.round) + 2}</h2>
      <div class="evimg"><img src="${art('assets/ui/' + (res.won ? 'election_win' : 'election_loss') + '.svg')}" alt="" ${FB}></div>
      <div class="votebar"><b style="width:0%" id="vb"></b><u></u></div>
      <p style="text-align:center;margin:0;font-weight:800">${face(popBefore)} ${popBefore}% of voters back you. You need 50%.</p>
      <h2 style="text-align:center;margin-top:12px">${res.won ? (res.mandate ? 'LANDSLIDE WIN!' : 'You scraped in!') : 'You lost the election!'}</h2>
      <p style="text-align:center;font-size:1.1rem">${res.won
        ? (res.mandate ? 'Voters love you! Bonus: <b>+12 💰</b>.' : 'You stay in charge. Keep voters happy!')
        : `Your opponent takes over for a while and takes <b>15 💰</b>${res.reverted ? ` and scraps <b>${esc(res.reverted.title)}</b>` : ''}. Then voters give you a second chance.`}</p>
      <div class="row"><button class="btn green big" id="go">Next term ▶</button></div>
    </div></div>`);
    show(n);
    setTimeout(() => { const b = document.getElementById('vb'); if (b) b.style.width = popBefore + '%'; }, 80);
    (res.won ? sfx.good : sfx.bad)();
    n.querySelector('#go').onclick = () => { sfx.click(); nextTerm(); };
  }

  // ---------- final ----------
  function whyEnding(R) {
    const cut = Math.round(R.score * 100), v = R.pop;
    switch (R.ending) {
      case 'hero': return 'You cut warming a lot (' + cut + '% of the best) AND voters still like you (' + v + '%).';
      case 'saviour': return 'You cut warming a lot (' + cut + '% of the best), but only ' + v + '% of voters like you.';
      case 'crowdpleaser': return 'Voters like you (' + v + '%), but you only cut ' + cut + '% of the best possible warming.';
      case 'panic': return 'Most of your big pollution cuts came late. Early cuts matter more.';
      case 'fooled': return 'You fell for ' + R.fooled.length + ' greenwash papers, so your cuts were smaller than they looked.';
      case 'nothing': return 'You approved only ' + R.approvedCount + ' papers, so pollution kept rising.';
      default: return 'You cut ' + cut + '% of the best possible warming, and ' + v + '% of voters like you.';
    }
  }
  function showFinal() {
    const R = NZ.report(G);
    const E = ENDINGS[R.ending];
    const title = E.title;
    const runs = load('nzd_runs', []);
    runs.push({ title, T: R.T, pop: R.pop, stars: R.stars, score: R.score }); save('nzd_runs', runs.slice(-30));
    const lo = 1.35, hi = Math.max(2.3, R.Tdn + 0.05);
    const pct = t => Math.round(100 * (t - lo) / (hi - lo));
    const bar = (label, t, col) => `<div class="tbar"><span>${label}</span><div class="track"><div class="fill" data-w="${pct(t)}" style="background:${col}"></div></div><span class="val">${T2(t)}</span></div>`;
    const q = R.q;
    const qrow = k => { const v = q[k], d = v - 50; return `<div class="qrow"><span>${QLABEL[k][0]} ${QLABEL[k][1]}</span><div class="track"><div class="fill" data-w="${v}" style="background:${d >= 0 ? '#5fd48a' : '#ff8a8a'}"></div><span class="mid"></span></div><span class="${d >= 0 ? 'good' : 'bad'}">${d >= 0 ? '▲' : '▼'} ${v}</span></div>`; };
    const medals = Object.keys(MEDALS).map(k => { const m = MEDALS[k], got = R.medals.includes(k); return `<div class="medal ${got ? '' : 'locked'}"><div class="mi">${got ? m[0] : '🔒'}</div><b>${m[1]}</b>${m[2]}</div>`; }).join('');
    const stars = '★'.repeat(R.stars) + '☆'.repeat(5 - R.stars);
    const saved = (R.Tdn - R.T);
    const share = `Net Zero Desk 2050 | ${title} | 🌡️ ${T2(R.T)} (do nothing ${T2(R.Tdn)}, best ${T2(R.Tbest)}) | ${face(R.pop)} ${R.pop}% votes | ${stars}`;
    const n = h(`<div class="screen final">
      <div class="card endhero">
        <div class="eimg"><img src="${art('assets/endings/ending_' + R.ending + '.svg')}" alt="" ${FB}></div>
        <p style="margin:10px 0 0;font-weight:800;color:var(--muted)">Year 2050 · Your legacy</p>
        <h1>${esc(title)}</h1>
        <div class="stars">${stars}</div>
        <p style="font-size:1.15rem;margin:4px 0">${esc(E.line)}</p>
        <p class="why-end"><b>Why:</b> ${esc(whyEnding(R))}</p>
      </div>

      <div class="card">
        <h2>🌡️ Global warming by 2050</h2>
        <div class="tbars">
          ${bar('Do nothing', R.Tdn, '#e5533d')}
          ${bar('YOU', R.T, '#2e9e5b')}
          ${bar('Best possible', R.Tbest, '#4aa3df')}
        </div>
        <p class="bigstat">You kept <b>${saved.toFixed(2)}°C</b> of warming off the planet. You reached <b>${Math.round(R.score * 100)}%</b> of the best result possible with the papers you were dealt.</p>
        <p style="margin:6px 0 0;color:var(--muted);font-size:.9rem">The “best possible” is the best a player could do if they knew every true number and ignored votes.</p>
      </div>

      <div class="two">
        <div class="card"><h2>😊 Popularity</h2><div class="face-big">${face(R.pop)}</div>
          <p style="text-align:center;margin:0"><b>${R.pop}%</b> of voters at the end<br>Average over the game: <b>${R.avgPop}%</b></p>
          <p style="text-align:center;margin:6px 0 0">${R.elections.map(e => `Election ${yearOf(e.round) + 2}: ${e.won ? '✅ Won' : '❌ Lost'}`).join('<br>')}</p></div>
        <div class="card"><h2>🏡 Life in 2050</h2>${['jobs', 'health', 'living', 'nature', 'safety'].map(qrow).join('')}
          <p style="margin:4px 0 0;font-size:.8rem;color:var(--muted)">50 = same as now</p></div>
      </div>

      <details class="card"><summary><b>🏅 Medals</b> · you earned ${R.medals.length} of ${Object.keys(MEDALS).length}</summary><div class="medals" style="margin-top:8px">${medals}</div></details>

      <div class="card"><h2>🧐 What really happened</h2>
        ${R.caught ? `<div class="listitem ok">🕵️ You rejected <b>${R.caught}</b> misleading paper${R.caught > 1 ? 's' : ''}.</div>` : ''}
        ${R.fooled.length ? `<p><b>You fell for ${R.fooled.length} greenwash paper${R.fooled.length > 1 ? 's' : ''}:</b></p>` + R.fooled.map(a => `<div class="listitem"><b>${esc(a.p.title)}</b>: looked like −${a.p.shown.emis}% pollution, was really −${a.p.emis}%.<br><small>${esc(a.p.fine)}</small></div>`).join('')
          : `<div class="listitem ok">🕵️ <b>You were not fooled by any greenwash. Well spotted!</b></div>`}
        ${R.missed.length ? `<p style="margin-top:12px"><b>Strong papers you skipped:</b></p>` + R.missed.map(p => `<div class="listitem" style="border-color:#ffb100;background:#fff7dd"><b>${esc(p.title)}</b>: −${p.emis}% pollution. <small>${esc(p.say)}</small></div>`).join('') : ''}
      </div>

      <div class="card"><div class="discuss">💬 Think about it: ${esc(DISCUSS[Math.floor(Math.random() * DISCUSS.length)])}</div></div>

      <div class="row"><button class="btn green big" id="again">🔄 Play again</button><button class="btn ghost" id="share">📋 Copy my result</button><button class="btn ghost" id="menu">Menu</button></div>
    </div>`);
    show(n);
    setTimeout(() => n.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%'), 150);
    (['hero', 'saviour', 'steady', 'crowdpleaser'].includes(R.ending) ? sfx.good : sfx.bad)();
    n.querySelector('#again').onclick = () => { sfx.click(); startGame(); };
    n.querySelector('#menu').onclick = () => { sfx.click(); showTitle(); };
    n.querySelector('#share').onclick = (ev) => {
      const b = ev.currentTarget;
      const done = () => { b.textContent = '✅ Copied!'; setTimeout(() => b.textContent = '📋 Copy my result', 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(share).then(done, () => prompt('Copy your result:', share)); else prompt('Copy your result:', share);
    };
  }

  // keyboard shortcuts on the desk
  document.addEventListener('keydown', e => {
    if (!G || G.phase !== 'desk' || busy) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;           // leave browser shortcuts (Ctrl+R etc.) alone
    if (document.querySelector('.modal')) return;                          // ignore keys while an alert is open
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (!document.getElementById('paper')) return;
    const k = e.key.toLowerCase();
    let id, kk;
    if (k === 'a' || e.key === 'ArrowRight') { id = 'btnap'; kk = 'a'; }
    else if (k === 'x' || e.key === 'ArrowLeft') { id = 'btnrj'; kk = 'x'; }
    else if (k === 'f') { id = 'factb'; kk = 'f'; }
    else if (k === 'r') { id = 'fineb'; kk = 'r'; }
    else return;
    const cap = document.querySelector('.kk[data-k="' + kk + '"]');
    if (cap) { cap.classList.add('press'); setTimeout(() => cap.classList.remove('press'), 180); }
    const b = document.getElementById(id);
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  });

  window.NZ_DEBUG = { get G() { return G; } };
  showTitle();
})();
