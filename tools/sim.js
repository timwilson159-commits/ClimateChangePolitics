// Balance simulator: node tools/sim.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\nthis.PAPERS=PAPERS;this.EVENTS=EVENTS;', ctx);
const NZ = require(path.join(root, 'core.js'));

function play(strategy, seed) {
  const s = NZ.newGame(ctx.PAPERS, ctx.EVENTS, seed);
  for (let r = 1; r <= NZ.CFG.rounds; r++) {
    NZ.startRound(s);
    for (let i = 0; i < s.offers.length; i++) {
      const o = s.offers[i];
      if (strategy(s, o, i) && NZ.canAfford(s, o)) NZ.approve(s, i); else NZ.reject(s, i);
    }
    NZ.endRound(s);
    if (NZ.electionDue(s)) NZ.runElection(s);
  }
  return NZ.report(s);
}
const strategies = {
  nothing: () => false,
  random: () => Math.random() < 0.5,
  naive_shown: (s, o) => NZ.offerShown(o).emis >= 6,
  popular: (s, o) => o.p.pop >= 1 && o.p.emis >= 1,
  smart_true: (s, o) => (o.p.emis + (o.p.pay * 2) >= 5 || (o.p.pay >= 2 && o.p.emis >= 3)) && (o.p.pop > -11 || s.pop > 55),
  green_all: (s, o) => o.p.emis >= 3 || o.p.pay >= 2,
  skilled: (s, o) => { const p=o.p; const val=p.emis+(p.pay*2)+(p.area==='adapt'?3:0); if(p.pop>=0) return val>=3; if(s.pop-(-p.pop)>=48 || (s.round===1||s.round===5)&&s.pop-(-p.pop)>=42) return val>=5; return false; },
  balanced: (s, o) => (o.p.emis >= 4 && (o.p.pop >= -6 || s.pop > 65)) || (o.p.pay >= 3 && o.p.emis >= 3)
};
const N = Number(process.argv[2]) || 200;
const out = {};
for (const name in strategies) {
  let agg = { T: 0, pop: 0, avgPop: 0, score: 0, pts: 0, n: 0, lost: 0, ends: {} };
  for (let i = 0; i < N; i++) {
    const r = play(strategies[name], 1000 + i);
    agg.T += r.T; agg.pop += r.pop; agg.avgPop += r.avgPop; agg.score += r.score; agg.pts += r.pts; agg.n += r.approvedCount;
    agg.lost += r.elections.filter(e => !e.won).length;
    agg.ends[r.ending] = (agg.ends[r.ending] || 0) + 1;
  }
  const f = v => (v / N).toFixed(2);
  console.log(name.padEnd(12), 'T', f(agg.T), 'score', f(agg.score), 'pop', f(agg.pop), 'avgPop', f(agg.avgPop), 'ptsLeft', f(agg.pts), 'approved', f(agg.n), 'electionsLost/2', f(agg.lost), JSON.stringify(agg.ends));
}
const r0 = play(strategies.smart_true, 1);
console.log('sample: Tdn', r0.Tdn.toFixed(2), 'Tbest', r0.Tbest.toFixed(2), 'T', r0.T.toFixed(2), 'medals', r0.medals.join(','));
