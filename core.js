// Net Zero Desk - pure game logic (works in browser and node)
(function (root) {
  const CFG = {
    rounds: 12, startPts: 100, startPop: 60, baseE: 100, growth: 1.5, floorE: 4,
    startT: 1.40, k: 0.0003, checks: 3, reissueMult: 1.25, elections: [4, 8],
    firstYear: 2026, yearsPerRound: 2
  };
  const QOL_KEYS = ['jobs', 'health', 'living', 'nature', 'safety'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const baseline = r => CFG.baseE + CFG.growth * (r - 1);           // pollution if you do nothing, in term r
  const tempFromC = C => CFG.startT + CFG.k * C;
  const isGreenwash = p => !!p.shown && p.shown.emis !== undefined && p.shown.emis > p.emis + 2;

  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function newGame(papers, events, seed) {
    seed = seed === undefined ? (Date.now() ^ (Math.random() * 1e9)) : seed;
    const rnd = mulberry32(seed);
    const s = {
      seed, rnd, papers, events, byId: Object.fromEntries(papers.map(p => [p.id, p])),
      round: 0, phase: 'new', pts: CFG.startPts, pop: CFG.startPop, cut: 0, C: 0, E: baseline(1),
      qol: { jobs: 0, health: 0, living: 0, nature: 0, safety: 0 }, damage: 0,
      approved: [], rejected: [], sched: [], offers: [], idx: 0, checks: CFG.checks,
      deck: shuffle(papers.map(p => p.id), rnd), seen: [], offerLog: [], eventLog: [],
      history: [], popHistory: [], recent: [], used: {}, elections: [], protectedCount: 0,
      tempNow: CFG.startT, lastEvent: null, spent: 0, termBudget: 0, startPts: CFG.startPts, spentHistory: [], deceivedLog: [], caught: 0, factChecked: []
    };
    return s;
  }

  function tempProjected(s) {
    // forecast: what you have already approved (including delayed cuts) carries on to 2050
    const from = s.phase === 'desk' ? Math.max(1, s.round) : s.round + 1;
    let C = s.C;
    for (let r = from; r <= CFG.rounds; r++) {
      let cut = s.cut;
      s.sched.forEach(x => { if (x.at <= r) cut += x.amt; });
      C += CFG.yearsPerRound * Math.max(CFG.floorE, baseline(r) - cut);
    }
    return tempFromC(C);
  }
  function currentE(s) { return Math.max(CFG.floorE, baseline(Math.max(1, s.round)) - s.cut); }

  function qolValue(s, key) {
    const t = Math.max(0, s.tempNow - 1.45) * 35;
    const share = { jobs: 0, health: 0.2, living: 0.15, nature: 0.35, safety: 0.3 }[key];
    return clamp(Math.round(50 + s.qol[key] - t * share), 0, 100);
  }
  function qolAll(s) { const o = {}; QOL_KEYS.forEach(k => o[k] = qolValue(s, k)); return o; }

  // ---------- starting a round & dealing ----------
  function startRound(s) {
    if (s.phase === 'desk') return s.offers;          // already dealt this term (guards double income)
    if (s.round >= CFG.rounds) return s.offers;        // game is over
    s.round++;
    s.phase = 'desk';
    s.idx = 0;
    // paybacks
    s.income = 0;
    if (s.round > 1) {
      s.approved.forEach(a => { s.income += a.p.pay; });
      s.pts += s.income;
    }
    // delayed cuts that start now
    s.sched = s.sched.filter(x => { if (x.at <= s.round) { s.cut += x.amt; return false; } return true; });
    s.E = currentE(s);
    s.spent = 0;
    s.termBudget = budgetPerTerm(s);
    s.startPts = s.pts;
    s.offers = deal(s);
    s.offers.forEach(o => { if (!o.reissue) s.offerLog.push({ round: s.round, id: o.p.id }); });
    return s.offers;
  }

  // fair share of points per remaining term (counting expected paybacks)
  function budgetPerTerm(s) {
    const left = CFG.rounds - s.round + 1;
    const pay = s.approved.reduce((a, x) => a + x.p.pay, 0);
    return Math.max(0, Math.round((s.pts + pay * (left - 1)) / left));
  }

  function winOk(p, r) { return (p.from === undefined || r >= p.from) && (p.to === undefined || r <= p.to); }

  function deal(s) {
    const offers = [];
    const r = s.round;
    const areas = {};
    let greens = 0;
    // reissue of a past rejection (once, 50%)
    const ready = s.rejected.filter(x => x.round <= r - 2 && x.times < 2 && (x.p.emis >= 3 || x.p.area === 'adapt') && !isGreenwash(x.p) && winOk(x.p, r) && winOk(x.p, r + 3) && !s.approved.some(a => a.p.id === x.p.id));
    if (ready.length && s.rnd() < 0.5) {
      const x = ready[Math.floor(s.rnd() * ready.length)];
      x.times++;
      x.mult *= CFG.reissueMult;
      offers.push(mkOffer(x.p, Math.round(x.p.cost * x.mult), true));
      areas[x.p.area] = 1;
      s.rejected = s.rejected.filter(y => y !== x);
      s.rejected.push({ round: r, p: x.p, times: x.times, mult: x.mult, parked: true });
    }
    let tries = 0;
    while (offers.length < 3 && tries < 400) {
      tries++;
      if (!s.deck.length) {
        const unseen = s.papers.filter(p => !s.seen.includes(p.id) || true).map(p => p.id).filter(id => !offers.some(o => o.p.id === id) && !s.approved.some(a => a.p.id === id));
        s.deck = shuffle(unseen, s.rnd);
        if (!s.deck.length) break;
      }
      const id = s.deck.shift();
      const p = s.byId[id];
      if (!winOk(p, r)) { if (tries < 300) s.deck.push(id); continue; }
      if (offers.some(o => o.p.id === id) || s.approved.some(a => a.p.id === id)) continue;
      const g = isGreenwash(p);
      if (g && greens >= 1 && s.rnd() > 0.1) { s.deck.push(id); continue; }
      if (areas[p.area] && tries < 150 && s.rnd() < 0.8) { s.deck.push(id); continue; }
      // first term: gentle start - at least no more than one greenwash and keep the tutorial friendly
      if (r === 1 && g) { s.deck.push(id); continue; }
      if (!s.seen.includes(id)) s.seen.push(id);
      offers.push(mkOffer(p, p.cost, false));
      areas[p.area] = (areas[p.area] || 0) + 1;
      if (g) greens++;
    }
    return offers;
  }
  function mkOffer(p, cost, reissue) {
    const shownCost = (p.shown && p.shown.cost !== undefined && !reissue) ? p.shown.cost : cost;
    return { p, cost, shownCost, reissue, checked: false };
  }
  function offerShown(o) {
    const p = o.p;
    return {
      cost: o.checked ? o.cost : o.shownCost,
      pop: o.checked ? p.pop : (p.shown && p.shown.pop !== undefined ? p.shown.pop : p.pop),
      emis: o.checked ? p.emis : (p.shown && p.shown.emis !== undefined ? p.shown.emis : p.emis)
    };
  }

  // ---------- decisions ----------
  function synBonus(s, p) {
    let b = 0;
    if (p.syn) for (const id in p.syn) if (s.approved.some(a => a.p.id === id)) b += p.syn[id];
    return b;
  }
  function canAfford(s, o) { return s.pts >= o.cost; }

  function approve(s, i) {
    const o = s.offers[i];
    if (!o || o.done || s.phase !== 'desk') return { ok: false };
    if (s.approved.some(a => a.p.id === o.p.id)) return { ok: false, reason: 'dup' };
    if (!canAfford(s, o)) return { ok: false, reason: 'points' };
    const p = o.p;
    const bonus = synBonus(s, p);
    const amt = p.emis + bonus;
    s.pts -= o.cost;
    s.spent += o.cost;
    s.pop = clamp(s.pop + p.pop, 0, 100);
    p.qol.forEach((v, k) => { s.qol[QOL_KEYS[k]] += v; });
    const rec = { p, round: s.round, cost: o.cost, amt, delay: p.delay || 0, bonus, fooled: isGreenwash(p) && !o.checked, checked: o.checked };
    s.approved.push(rec);
    s.rejected = s.rejected.filter(x => x.p !== p);   // an approved paper can never be re-offered
    if (!rec.delay) { s.cut += amt; } else { s.sched.push({ at: s.round + rec.delay, amt, rec }); }
    s.E = currentE(s);
    o.done = 'approved';
    s.recent.push({ round: s.round, id: p.id });
    const deceived = isGreenwash(p) && !o.checked;
    if (deceived) s.deceivedLog.push({ round: s.round, id: p.id });
    return { ok: true, bonus, amt, deceived };
  }
  function reject(s, i) {
    const o = s.offers[i];
    if (!o || o.done || s.phase !== 'desk') return;
    o.done = 'rejected';
    if (isGreenwash(o.p)) s.caught++;
    const prev = s.rejected.find(x => x.p === o.p);
    if (!prev) s.rejected.push({ round: s.round, p: o.p, times: o.reissue ? 1 : 0, mult: o.reissue ? o.cost / o.p.cost : 1 });
    else prev.round = s.round;
  }
  function factCheck(s, i) {
    const o = s.offers[i];
    if (!o || o.done || o.checked || s.checks <= 0 || s.phase !== 'desk') return false;
    o.checked = true; s.checks--;
    return true;
  }

  // ---------- end of term ----------
  function endRound(s) {
    if (s.phase !== 'desk') return s.lastEvent;       // already ended this term
    // pollution this term and temperature
    s.E = currentE(s);
    s.C += CFG.yearsPerRound * s.E;
    s.tempNow = tempFromC(s.C);
    s.history.push({ round: s.round, E: s.E, base: baseline(s.round), T: s.tempNow });
    s.spentHistory.push({ round: s.round, spent: s.spent, budget: s.termBudget });
    // event
    const ev = resolveEvent(s);
    // pop drift from quality of life
    const q = qolAll(s);
    const avg = QOL_KEYS.reduce((a, k) => a + q[k], 0) / 5;
    // voters drift with quality of life, and slowly forget old anger (and old joy)
    const drift = Math.round((avg - 50) / 6) + Math.round((55 - s.pop) * 0.2);
    s.pop = clamp(s.pop + drift, 0, 100);
    s.popHistory.push(s.pop);
    ev.drift = drift;
    s.phase = 'news';
    return ev;
  }

  function hasAny(s, ids) { return ids.some(id => s.approved.some(a => a.p.id === id)); }

  function resolveEvent(s) {
    const r = s.round;
    const T = s.tempNow;
    let ev;
    if (r === 1) ev = s.events.find(e => e.id === 'summit');
    else {
      const eligible = e => {
        if (s.used[e.id] && r - s.used[e.id] < 4) return false;
        if (e.id === 'summit') return false;
        if (e.id === 'protest_workers') return hasAny(s, ['coal_close', 'no_new_mines', 'petrol_ban', 'carbon_price']);
        if (e.id === 'tech_breakthrough') return r >= 3;
        return true;
      };
      const pDis = clamp(0.28 + (T - 1.4) * 1.2, 0.2, 0.85);
      const roll = s.rnd();
      let pool;
      const techP = hasAny(s, ['science_fund']) ? 0.3 : 0.08;
      if (roll < techP && eligible(s.events.find(e => e.id === 'tech_breakthrough'))) pool = s.events.filter(e => e.id === 'tech_breakthrough');
      else if (s.rnd() < pDis) pool = s.events.filter(e => e.kind === 'disaster' && eligible(e));
      else pool = s.events.filter(e => e.kind === 'politics' && eligible(e));
      if (!pool || !pool.length) pool = s.events.filter(e => e.kind !== 'luck' && eligible(e));
      if (!pool.length) pool = s.events.filter(e => e.kind === 'disaster');
      ev = pool[Math.floor(s.rnd() * pool.length)];
    }
    s.used[ev.id] = r;
    const out = { event: ev, protected: false, pop: 0, pts: 0, qol: {}, text: '' };
    const m = 1 + Math.max(0, T - 1.5) * 3;
    if (ev.kind === 'disaster') {
      const prot = (ev.prot && hasAny(s, ev.prot)) || (ev.protTemp && T < ev.protTemp);
      out.protected = !!prot;
      if (prot) { out.pop = 2; out.text = ev.good; s.protectedCount++; }
      else { out.pop = -Math.round(4.5 * m); out.qol = { safety: -Math.round(2 * m), living: -1 }; out.text = ev.bad; }
    } else if (ev.kind === 'luck') {
      out.pts = 15; out.pop = 2; out.text = ev.good; out.protected = true;
    } else {
      switch (ev.id) {
        case 'fuel_spike': {
          const prot = hasAny(s, ev.prot); out.protected = prot;
          out.pop = prot ? -1 : -8; out.qol = prot ? {} : { living: -3 }; out.text = prot ? ev.good : ev.bad; break; }
        case 'protest_green': {
          const recent = s.approved.filter(a => a.round >= r - 1 && (a.amt >= 3)).length;
          const good = recent >= 2; out.protected = good; out.pop = good ? 6 : -8; out.text = good ? ev.good : ev.bad; break; }
        case 'protest_workers': {
          const prot = hasAny(s, ev.prot); out.protected = prot; out.pop = prot ? -2 : -8; out.qol = prot ? {} : { jobs: -2 }; out.text = prot ? ev.good : ev.bad; break; }
        case 'summit': {
          const good = r === 1 || s.approved.filter(a => a.amt >= 4).length >= 3;
          out.protected = good; out.pts = good ? 8 : 0; out.pop = good ? 3 : -2; out.text = good ? ev.good : ev.bad; break; }
        case 'fake_news': {
          const prot = hasAny(s, ev.prot); out.protected = prot; out.pop = prot ? 0 : -7; out.text = prot ? ev.good : ev.bad; break; }
      }
    }
    s.pop = clamp(s.pop + out.pop, 0, 100);
    s.pts += out.pts;
    for (const k in out.qol) s.qol[k] += out.qol[k];
    s.lastEvent = out;
    s.eventLog.push({ round: r, id: ev.id, protected: out.protected, kind: ev.kind });
    return out;
  }

  // ---------- elections ----------
  function electionDue(s) { return CFG.elections.includes(s.round); }
  function runElection(s) {
    const done = s.elections.find(e => e.round === s.round);
    if (done) return done;                            // one election per term
    const pop = s.pop;
    const res = { round: s.round, pop, won: pop >= 50, mandate: pop >= 70, pts: 0, reverted: null };
    if (res.won) {
      if (res.mandate) { res.pts = 12; s.pts += 12; }
    } else {
      res.pts = -Math.min(15, s.pts); s.pts += res.pts;
      // opposition scraps the most unpopular law you passed
      const cand = s.approved.filter(a => a.p.pop < 0).sort((a, b) => a.p.pop - b.p.pop)[0];
      if (cand) {
        res.reverted = cand.p;
        const idxBefore = s.approved.indexOf(cand);
        s.approved = s.approved.filter(a => a !== cand);
        const sc = s.sched.find(x => x.rec === cand);
        if (sc) s.sched = s.sched.filter(x => x !== sc); else s.cut -= cand.amt;
        cand.p.qol.forEach((v, k) => { s.qol[QOL_KEYS[k]] -= v; });
        // partners that got a pair bonus from this law lose it
        const ci = idxBefore;
        s.approved.forEach((a, j) => {
          if (j < ci || !a.p.syn || !a.p.syn[cand.p.id]) return;
          const b = a.p.syn[cand.p.id];
          a.amt -= b; a.bonus -= b;
          const sc2 = s.sched.find(x => x.rec === a);
          if (sc2) sc2.amt -= b; else s.cut -= b;
        });
        s.pop = clamp(s.pop + 10, 0, 100);   // new honeymoon
      } else { s.pop = clamp(s.pop + 5, 0, 100); }
    }
    s.elections.push(res);
    s.E = currentE(s);
    return res;
  }

  function isFinished(s) { return s.round >= CFG.rounds && s.phase === 'news'; }

  // ---------- "theoretical best" with perfect information ----------
  function simulateChoice(s, chosen, ignoreRound) {
    // chosen: Set of indexes into s.offerLog. returns final C.
    let pts = CFG.startPts, cut = 0, C = 0; const sched = []; const appr = []; const picked = [];
    for (let r = 1; r <= CFG.rounds; r++) {
      if (r > 1) appr.forEach(p => { pts += p.pay; });
      for (let i = sched.length - 1; i >= 0; i--) if (sched[i].at <= r) { cut += sched[i].amt; sched.splice(i, 1); }
      s.offerLog.forEach((o, idx) => {
        if (o.round !== r || !chosen.has(idx)) return;
        const p = s.byId[o.id];
        if (pts < p.cost || appr.includes(p)) return;
        pts -= p.cost;
        let amt = p.emis;
        if (p.syn) for (const id in p.syn) if (appr.some(a => a.id === id)) amt += p.syn[id];
        if (p.delay) sched.push({ at: r + p.delay, amt }); else cut += amt;
        appr.push(p); picked.push(idx);
      });
      C += CFG.yearsPerRound * Math.max(CFG.floorE, baseline(r) - cut);
    }
    return { C, picked };
  }
  function bestPossible(s) {
    const n = s.offerLog.length;
    let best = { C: Infinity, set: null };
    const rnd = mulberry32(12345);
    const starts = [];
    // greedy start by pollution cut per cost
    const order = s.offerLog.map((o, i) => i).sort((a, b) => {
      const pa = s.byId[s.offerLog[a].id], pb = s.byId[s.offerLog[b].id];
      return (pb.emis + pb.pay * 2) / pb.cost - (pa.emis + pa.pay * 2) / pa.cost;
    });
    starts.push(new Set(order.slice(0, 12)));
    for (let t = 0; t < 5; t++) starts.push(new Set(order.filter(() => rnd() < 0.4)));
    for (const st of starts) {
      let cur = new Set(simulateChoice(s, st).picked), curC = simulateChoice(s, cur).C;
      for (let it = 0; it < 1500; it++) {
        const nxt = new Set(cur);
        const a = Math.floor(rnd() * n); nxt.has(a) ? nxt.delete(a) : nxt.add(a);
        if (rnd() < 0.4) { const b = Math.floor(rnd() * n); nxt.has(b) ? nxt.delete(b) : nxt.add(b); }
        const res = simulateChoice(s, nxt);
        if (res.C < curC) { cur = new Set(res.picked); curC = res.C; }
      }
      if (curC < best.C) best = { C: curC, set: cur };
    }
    return best;
  }

  // ---------- final report ----------
  function report(s) {
    const T = tempFromC(s.C);
    let doNothingC = 0; for (let r = 1; r <= CFG.rounds; r++) doNothingC += CFG.yearsPerRound * baseline(r);
    const Tdn = tempFromC(doNothingC);
    const bp = bestPossible(s);
    const Tbest = Math.min(tempFromC(bp.C), T);
    const score = clamp((Tdn - T) / Math.max(0.01, Tdn - Tbest), 0, 1);
    const q = qolAll(s);
    const avgPop = s.popHistory.length ? Math.round(s.popHistory.reduce((a, b) => a + b, 0) / s.popHistory.length) : s.pop;
    const fooled = s.approved.filter(a => a.fooled);
    const greenCuts = s.approved.filter(a => a.amt >= 4);
    const lateCuts = greenCuts.filter(a => a.round >= 7).length;
    const earlyCuts = greenCuts.filter(a => a.round <= 3).length;
    const wonBoth = s.elections.length >= 2 && s.elections.every(e => e.won);
    // missed: rejected / ignored papers with the best cuts
    const approvedIds = new Set(s.approved.map(a => a.p.id));
    const missed = s.offerLog.map(o => s.byId[o.id]).filter((p, i, a) => !approvedIds.has(p.id) && a.indexOf(p) === i && !isGreenwash(p))
      .sort((a, b) => (b.emis + (b.syn ? 2 : 0)) - (a.emis + (a.syn ? 2 : 0))).slice(0, 3);
    const data = { T, Tdn, Tbest, score, q, avgPop, pop: s.pop, pts: s.pts, fooled, approvedCount: s.approved.length, earlyCuts, lateCuts, wonBoth, missed,
      protectedCount: s.protectedCount, checksLeft: s.checks, elections: s.elections, E: s.E };
    // ending
    let ending;
    if (fooled.length >= 3 && score < 0.7) ending = 'fooled';
    else if (s.approved.length <= 4 || score < 0.12) ending = 'nothing';
    else if (score >= 0.62 && s.pop >= 45) ending = 'hero';
    else if (score >= 0.55 && s.pop < 45) ending = 'saviour';
    else if (s.pop >= 62 && score < 0.45) ending = 'crowdpleaser';
    else if (greenCuts.length && lateCuts / greenCuts.length >= 0.5 && score < 0.6) ending = 'panic';
    else ending = 'steady';
    data.ending = ending;
    data.caught = s.caught;
    // medals
    const medals = [];
    if (!fooled.length) medals.push('nobody');
    if (earlyCuts >= 4) medals.push('early');
    if (avgPop >= 65) medals.push('crowd');
    if (s.pop < 45 && score >= 0.55) medals.push('tough');
    if (s.pts <= 3) medals.push('spender');
    if (s.pts >= 45) medals.push('saver');
    if (s.protectedCount >= 3) medals.push('storm');
    if (s.approved.filter(a => a.round <= 4 && a.p.pay > 0).length >= 4) medals.push('payitfwd');
    if (wonBoth) medals.push('elect');
    if (s.checks === 0 && fooled.length === 0) medals.push('checker');
    if (q.nature >= 60 && q.health >= 60) medals.push('thrive');
    if (score >= 0.9) medals.push('perfect');
    data.medals = medals;
    // stars
    const combined = score * 0.6 + (s.pop / 100) * 0.2 + (Object.values(q).reduce((a, b) => a + b, 0) / 500) * 0.2;
    data.stars = clamp(Math.round(combined * 5.5), 1, 5);
    return data;
  }

  root.NZ = { CFG, QOL_KEYS, newGame, startRound, approve, reject, factCheck, endRound, runElection, electionDue, isFinished,
    offerShown, budgetPerTerm, tempProjected, tempFromC, baseline, qolAll, currentE, canAfford, report, isGreenwash, synBonus };
  if (typeof module !== 'undefined') module.exports = root.NZ;
})(typeof window !== 'undefined' ? window : globalThis);
