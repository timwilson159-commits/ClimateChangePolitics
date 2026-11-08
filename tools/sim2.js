// Difficulty simulator: node tools/sim2.js [games]
// Compares player types and reports how often each reaches the top two endings (hero, saviour).
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
      const yes = strategy(s, o, i);
      if (yes && NZ.canAfford(s, o)) NZ.approve(s, i); else NZ.reject(s, i);
    }
    NZ.endRound(s);
    if (NZ.electionDue(s)) NZ.runElection(s);
  }
  return NZ.report(s);
}
const val = (e, pay) => e + pay * 2;
const S = {
  nothing: () => false,
  random: () => Math.random() < 0.5,
  // trusts the badges, picks anything with a big promised cut
  casual: (s, o) => { const v = NZ.offerShown(o); return v.emis >= 5 && v.pop >= -6; },
  // trusts the badges, takes everything affordable that looks positive
  hasty: (s, o) => { const v = NZ.offerShown(o); return v.emis >= 3 || v.pay >= 2; },
  // reads fact-checks on sneaky-looking papers (advisers lob/spin, big promised cut) then uses the truth
  careful: (s, o, i) => {
    if (o.p.adv !== 'sci' && s.checks > 0 && NZ.offerShown(o).emis >= 5 && !o.checked) NZ.factCheck(s, i);
    const v = NZ.offerShown(o);
    const score = val(v.emis, v.pay) + (o.p.area === 'adapt' ? 2 : 0);
    if (v.pop < 0 && s.pop + v.pop < 38) return false;
    return score >= 5 && v.cost <= s.pts * 0.55;
  },
  // knows every true number (oracle for the planet), ignores votes
  oracle: (s, o) => { const p = o.p; return val(p.emis, p.pay) >= 5 && (p.emis > 0); },
  // knows the truth, balances votes and budget (a very good player)
  expert: (s, o) => { const p = o.p; const score = val(p.emis, p.pay) + (p.area === 'adapt' ? 2 : 0) + (p.syn ? 1 : 0); if (p.pop < 0 && s.pop + p.pop < 42) return false; return score >= 5 && p.cost <= s.pts * 0.6; }
};
const N = Number(process.argv[2]) || 200;
if (process.argv[4]) Object.assign(NZ.CFG, JSON.parse(process.argv[4]));
const only = process.argv[3] ? process.argv[3].split(",") : Object.keys(S);
for (const name of only) {
  const ends = {}; let T = 0, sc = 0, pop = 0, fooled = 0, left = 0;
  for (let i = 0; i < N; i++) {
    const r = play(S[name], 5000 + i);
    ends[r.ending] = (ends[r.ending] || 0) + 1; T += r.T; sc += r.score; pop += r.pop; fooled += r.fooled.length; left += r.pts;
  }
  const top2 = ((ends.hero || 0) + (ends.saviour || 0)) / N, hero = (ends.hero || 0) / N;
  const f = v => (v / N).toFixed(2);
  console.log(name.padEnd(8), 'T', f(T), 'score', f(sc), 'votes', (pop / N).toFixed(0), 'fooled', f(fooled), 'ptsLeft', (left / N).toFixed(0), '| hero', (hero * 100).toFixed(0) + '%', 'top2', (top2 * 100).toFixed(0) + '%', JSON.stringify(ends));
}
