/* Holding page: a planar 3-link arm replaying a joint-space trajectory.
   Joint values shown in the footer are the live commanded angles. */

(function () {
  const svg    = document.getElementById('cell');
  const armG   = document.getElementById('arm');
  const ghostG = document.getElementById('ghosts');
  const trace  = document.getElementById('trace');
  const readout= document.getElementById('joints');
  if (!svg || !armG) return;

  const NS    = 'http://www.w3.org/2000/svg';
  const BASE  = { x: 150, y: 360 };
  const LINK  = [110, 95, 55];

  // Joint-space waypoints: [shoulder absolute, elbow relative, wrist relative]
  const PLAN = [
    [ 95, -75, -35],
    [ 55, -40, -25],
    [ 80, -20, -40],
    [120, -45, -20],
    [ 65, -70,  10]
  ];

  const MOVE_MS  = 2200;
  const DWELL_MS = 650;
  const SEG_MS   = MOVE_MS + DWELL_MS;

  function fk(deg) {
    const pts = [{ x: BASE.x, y: BASE.y }];
    let t = 0;
    for (let i = 0; i < 3; i++) {
      t += deg[i];
      const r = t * Math.PI / 180;
      const p = pts[i];
      pts.push({ x: p.x + LINK[i] * Math.cos(r), y: p.y - LINK[i] * Math.sin(r) });
    }
    return { pts, tip: t };
  }

  const el = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // --- persistent arm elements ---------------------------------
  const links = LINK.map(() =>
    armG.appendChild(el('line', { stroke: '#EAF2F6', 'stroke-width': 3, 'stroke-linecap': 'round' })));

  const gripper = armG.appendChild(el('path', {
    fill: 'none', stroke: '#EAF2F6', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));

  const joints = [0, 1, 2, 3].map(i =>
    armG.appendChild(el('circle', {
      r: i === 0 ? 9 : 6.5, fill: '#141F28', stroke: '#7D9AAD', 'stroke-width': 2 })));

  const hub = armG.appendChild(el('path', { stroke: '#7D9AAD', 'stroke-width': 1.5 }));

  function draw(deg, activeJoint) {
    const { pts, tip } = fk(deg);

    for (let i = 0; i < 3; i++) {
      links[i].setAttribute('x1', pts[i].x);     links[i].setAttribute('y1', pts[i].y);
      links[i].setAttribute('x2', pts[i + 1].x); links[i].setAttribute('y2', pts[i + 1].y);
    }

    pts.forEach((p, i) => {
      joints[i].setAttribute('cx', p.x);
      joints[i].setAttribute('cy', p.y);
      joints[i].setAttribute('stroke', i === activeJoint ? '#FFB020' : '#7D9AAD');
    });

    // crosshair through the shoulder, CAD style
    hub.setAttribute('d',
      `M${pts[0].x - 16} ${pts[0].y}H${pts[0].x + 16}M${pts[0].x} ${pts[0].y - 16}V${pts[0].y + 16}`);

    // two-finger gripper, square to the last link
    const t = tip * Math.PI / 180;
    const ux = Math.cos(t), uy = -Math.sin(t);
    const px = -uy, py = ux;
    const e = pts[3], w = 9, d = 13;
    gripper.setAttribute('d',
      `M${e.x + px * w} ${e.y + py * w}L${e.x - px * w} ${e.y - py * w}` +
      `M${e.x + px * w} ${e.y + py * w}l${ux * d} ${uy * d}` +
      `M${e.x - px * w} ${e.y - py * w}l${ux * d} ${uy * d}`);

    return e;
  }

  function label(deg) {
    if (!readout) return;
    readout.textContent = deg
      .map((v, i) => `J${i + 1} ${v.toFixed(1).padStart(6)}°`)
      .join('   ');
  }

  // --- static fallback -----------------------------------------
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    PLAN.slice(0, 3).forEach((p, i) => {
      const { pts } = fk(p);
      ghostG.appendChild(el('polyline', {
        points: pts.map(q => `${q.x},${q.y}`).join(' '),
        fill: 'none', stroke: '#7D9AAD', 'stroke-width': 2,
        'stroke-opacity': 0.1 + i * 0.07, 'stroke-dasharray': '4 5'
      }));
    });
    draw(PLAN[3], 1);
    label(PLAN[3]);
    return;
  }

  // --- animation ------------------------------------------------
  const smooth = x => x * x * (3 - 2 * x);
  const path   = [];
  const ghosts = [];
  let lastGhost = 0, lastTrace = 0, start = null;

  function frame(now) {
    if (start === null) start = now;
    const elapsed = now - start;
    const seg = Math.floor(elapsed / SEG_MS);
    const from = PLAN[seg % PLAN.length];
    const to   = PLAN[(seg + 1) % PLAN.length];

    const k = smooth(Math.min(1, (elapsed % SEG_MS) / MOVE_MS));
    const deg = from.map((v, i) => v + (to[i] - v) * k);

    // the joint travelling furthest this segment wears the amber ring
    let active = 1, span = -1;
    to.forEach((v, i) => {
      const d = Math.abs(v - from[i]);
      if (d > span) { span = d; active = i + 1; }
    });

    const tip = draw(deg, active);
    label(deg);

    if (now - lastGhost > 270) {
      lastGhost = now;
      const { pts } = fk(deg);
      const g = el('polyline', {
        points: pts.map(q => `${q.x},${q.y}`).join(' '),
        fill: 'none', stroke: '#7D9AAD', 'stroke-width': 2,
        'stroke-dasharray': '4 5', 'stroke-opacity': 0.26
      });
      ghostG.appendChild(g);
      ghosts.push(g);
      if (ghosts.length > 6) ghostG.removeChild(ghosts.shift());
      ghosts.forEach((n, i) => n.setAttribute('stroke-opacity', 0.08 + i * 0.055));
    }

    if (now - lastTrace > 45) {
      lastTrace = now;
      path.push(`${tip.x.toFixed(1)},${tip.y.toFixed(1)}`);
      if (path.length > 120) path.shift();
      trace.setAttribute('points', path.join(' '));
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
