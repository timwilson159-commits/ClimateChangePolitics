// Usage:
//   node render.js one <file.svg> <out.png> [width]      -> render a single SVG to PNG
//   node render.js sheet <dir> <out.png> [cols] [thumbW]  -> contact sheet of every SVG in dir (labelled)
//   node render.js check <dir>                            -> lint SVGs (size, forbidden features)
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [, , cmd, a, b, c, d] = process.argv;

function render(svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
  return r.render().asPng();
}

if (cmd === 'one') {
  const svg = fs.readFileSync(a, 'utf8');
  fs.writeFileSync(b, render(svg, Number(c) || 800));
  console.log('wrote', b);
} else if (cmd === 'sheet') {
  const files = fs.readdirSync(a).filter(f => f.endsWith('.svg')).sort();
  const cols = Number(c) || 3;
  const tw = Number(d) || 400;
  const th = Math.round(tw * 0.65);
  const pad = 14, lab = 22;
  const rows = Math.ceil(files.length / cols);
  const W = cols * (tw + pad) + pad;
  const H = rows * (th + lab + pad) + pad;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#e9e4d8"/>`;
  files.forEach((f, i) => {
    const x = pad + (i % cols) * (tw + pad);
    const y = pad + Math.floor(i / cols) * (th + lab + pad);
    const data = Buffer.from(fs.readFileSync(path.join(a, f))).toString('base64');
    out += `<rect x="${x - 2}" y="${y - 2}" width="${tw + 4}" height="${th + 4}" fill="#fff" stroke="#999"/>`;
    out += `<image x="${x}" y="${y}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/svg+xml;base64,${data}"/>`;
    out += `<text x="${x}" y="${y + th + 17}" font-family="Arial" font-size="15" fill="#222">${f}</text>`;
  });
  out += '</svg>';
  fs.writeFileSync(b, render(out, W));
  console.log('wrote', b, files.length, 'svgs');
} else if (cmd === 'check') {
  const files = fs.readdirSync(a).filter(f => f.endsWith('.svg')).sort();
  let bad = 0;
  for (const f of files) {
    const s = fs.readFileSync(path.join(a, f), 'utf8');
    const issues = [];
    if (s.length > 20000) issues.push('over 20KB');
    if (!/viewBox="0 0 400 260"/.test(s)) issues.push('viewBox must be 0 0 400 260');
    if (/<text|<image|<script|<foreignObject|href="http/i.test(s)) issues.push('forbidden element (text/image/script/external)');
    try { render(s, 200); } catch (e) { issues.push('does not render: ' + e.message); }
    if (issues.length) { bad++; console.log(f + ': ' + issues.join('; ')); }
  }
  console.log(files.length + ' checked, ' + bad + ' with issues');
}
