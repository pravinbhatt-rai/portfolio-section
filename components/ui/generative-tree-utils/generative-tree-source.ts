export const generativeTreeSource = String.raw`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body><canvas></canvas><script>
let GROWTH_SPEED_BASE = 0.006;
const HOLD_DURATION = 400;
const PARTICLE_COUNT = 50;
const _pad = parseFloat(new URLSearchParams(location.search).get('p')) || 1;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, branches = [], seed = 42, started = 0;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function resize() { W = innerWidth; H = innerHeight; const d = Math.min(devicePixelRatio || 1, 1.5); canvas.width = W * d; canvas.height = H * d; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(d,0,0,d,0,0); createTree(); }
function branch(x,y,a,len,depth,width) {
  if (depth <= 0 || len < 2) return;
  const bend = (random() - .5) * .16;
  const ex = x + Math.cos(a + bend) * len, ey = y + Math.sin(a + bend) * len;
  branches.push({x,y,ex,ey,width,depth,order:branches.length});
  branch(ex,ey,a - .48 - random()*.17,len*.72,depth-1,width*.72);
  if (random() > .15) branch(ex,ey,a + .48 + random()*.17,len*.7,depth-1,width*.7);
}
function createTree() { seed = 42; branches = []; branch(W*.5,H*.92,-Math.PI/2,H*.22*_pad,9,5); }
function frame(time) {
  if (window.__GENERATIVE_TREE_CONTROLS && window.__GENERATIVE_TREE_CONTROLS.paused) { requestAnimationFrame(frame); return; }
  if (!started) started = time;
  const elapsed = time - started;
  const progress = Math.min(1, elapsed / (4800 / Math.max(.01, GROWTH_SPEED_BASE / .006)));
  ctx.clearRect(0,0,W,H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const count = Math.floor(branches.length * progress);
  for (let i=0; i<count; i++) {
    const b = branches[i];
    const color = b.depth < 3 ? 'rgba(233,150,116,.78)' : 'rgba(189,111,94,.42)';
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(.65,b.width); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.ex,b.ey); ctx.stroke();
    if (b.depth === 1) { ctx.fillStyle = 'rgba(241,185,132,.72)'; ctx.beginPath(); ctx.arc(b.ex,b.ey,1.5+random()*1.8,0,Math.PI*2); ctx.fill(); }
  }
  if (progress >= 1) {
    for (let i=0;i<PARTICLE_COUNT;i++) {
      const phase = (elapsed*.00012 + i/PARTICLE_COUNT) % 1;
      const px = W*(.22 + ((i*37)%61)/100) + Math.sin(elapsed*.0005+i)*12;
      const py = H*(.18 + phase*.68);
      ctx.fillStyle = 'rgba(230,161,128,'+(1-phase)*.48+')'; ctx.beginPath(); ctx.arc(px,py,1+(i%3)*.35,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
  requestAnimationFrame(frame);
}
function startTreeWhenSized() { resize(); if (W<=0 || H<=0) { requestAnimationFrame(startTreeWhenSized); return; }
  createTree(); requestAnimationFrame(frame);
}
window.addEventListener('resize', resize);
requestAnimationFrame(startTreeWhenSized);
</script></body></html>`;
