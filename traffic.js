/* Vehicles, seen from directly above.

   From a roof a car is a roof: a rounded slab, a windscreen at one end, a
   rear window at the other, and almost nothing else. That means the whole job
   of telling one vehicle from another falls to silhouette and roof furniture,
   not to detail. Three things have to be recognisable at a glance from four
   blocks up, because all three are jokes this city tells about itself:

     - the Waymo, by the lidar dome sitting proud of a white roof
     - the Muni bus, by being three times longer than anything else
     - the scooter, by being barely there at all

   Same convention as walker.js: drawn facing +x, rotated into the heading. */

const TAU = Math.PI * 2;

/* len is along the direction of travel, wid across it. */
export const KINDS = [
  { id: 'waymo', len: 13.5, wid: 6.3, body: '#f4f4f2', glass: '#5d6b74',
    lidar: true,  weight: 3, speed: [52, 64] },
  { id: 'car',   len: 12.5, wid: 6.0, body: '#7a3f3a', glass: '#4f5a62',
    weight: 2, speed: [60, 82] },
  { id: 'car2',  len: 12.8, wid: 6.1, body: '#33465c', glass: '#4f5a62',
    weight: 2, speed: [60, 82] },
  { id: 'car3',  len: 12.2, wid: 5.9, body: '#2f3330', glass: '#4f5a62',
    weight: 2, speed: [58, 78] },
  { id: 'car4',  len: 12.6, wid: 6.0, body: '#d7d2c6', glass: '#4f5a62',
    weight: 2, speed: [58, 78] },
  /* The bus ran at 38-48, which is about right for a bus and quite wrong for
     this map: nothing can overtake, so one of them at the head of a street
     set the pace for every car behind it. Still the slowest thing on four
     wheels, just no longer a cork. */
  { id: 'bus',   len: 25,   wid: 7.4, body: '#ebe7dd', glass: '#54606a',
    stripe: '#9d2f2a', bus: true, weight: 1, speed: [46, 56] },
  { id: 'scoot', len: 6.5,  wid: 2.8, body: '#3d4a3f', glass: null,
    weight: 1, speed: [44, 58] },
];

/* A weighted bag, so most of what goes past is a car and the bus is an event. */
export const BAG = KINDS.flatMap(k => Array(k.weight).fill(k));

function slab(g, len, wid, r, fill, outline) {
  g.beginPath();
  if (g.roundRect) g.roundRect(-len / 2, -wid / 2, len, wid, r);
  else g.rect(-len / 2, -wid / 2, len, wid);
  g.fillStyle = fill; g.fill();
  /* A hairline edge. The silver car is within three values of the asphalt it
     drives on and simply disappeared without this; everything else gains a
     crisper silhouette at map scale, where a car is about ten pixels long. */
  if (outline) { g.strokeStyle = outline; g.lineWidth = 0.45; g.stroke(); }
}

export function drawVehicle(g, o) {
  const { x, y, heading = 0, scale = 1, kind, braking = false } = o;
  const S = scale, L = kind.len, W = kind.wid;

  g.save();
  g.translate(x, y);
  g.rotate(heading);
  g.scale(S, S);

  /* shadow, thrown slightly off the body so it reads as above the road */
  g.save();
  g.translate(-0.6, 1.1);
  slab(g, L, W, W * 0.34, 'rgba(28,24,18,.18)');
  g.restore();

  slab(g, L, W, W * 0.3, kind.body, 'rgba(40,36,30,.45)');

  /* ---- the bus, from above ----
     It used to get a maroon band down each flank and then a row of side
     windows painted along the top of them, which from four blocks up is not
     a bus: it is a red ladder lying in the road. You cannot see the side of
     a bus from directly overhead. What you can see is a long pale roof, the
     hatches on it, and the joint in the middle of the articulated ones —
     so that is what it gets, with the maroon left as a hairline at the very
     edge where the top of the band would actually show. */
  if (kind.bus) {
    g.fillStyle = kind.stripe;
    g.fillRect(-L / 2 + 1.4, -W / 2 + 0.25, L - 2.8, 0.7);
    g.fillRect(-L / 2 + 1.4,  W / 2 - 0.95, L - 2.8, 0.7);
    g.fillStyle = 'rgba(58,54,46,.2)';                    // roof hatches
    g.fillRect(-L / 2 + L * 0.2, -W / 2 + 1.7, 3.4, W - 3.4);
    g.fillRect(-L / 2 + L * 0.62, -W / 2 + 1.7, 3.4, W - 3.4);
    g.fillStyle = 'rgba(40,36,30,.3)';                    // where it bends
    g.fillRect(-0.55, -W / 2 + 0.4, 1.1, W - 0.8);
  }

  if (kind.glass) {
    /* Windscreen forward, rear window aft. Two panes is all it takes for the
       eye to decide which end is the front. */
    g.fillStyle = kind.glass;
    if (kind.bus) {
      /* Windscreen only. Which end is the front is the one thing the shape
         still has to say, and it is the one thing you really do see. */
      g.fillRect(L / 2 - 3.2, -W / 2 + 1.3, 2.1, W - 2.6);
    } else {
      g.beginPath();
      if (g.roundRect) g.roundRect(L / 2 - 4.4, -W / 2 + 1.05, 2.9, W - 2.1, 0.8);
      else g.rect(L / 2 - 4.4, -W / 2 + 1.05, 2.9, W - 2.1);
      g.fill();
      g.beginPath();
      if (g.roundRect) g.roundRect(-L / 2 + 1.6, -W / 2 + 1.2, 2.4, W - 2.4, 0.8);
      else g.rect(-L / 2 + 1.6, -W / 2 + 1.2, 2.4, W - 2.4);
      g.fill();
    }
  }

  /* THE DOME. The one piece of roof furniture that identifies a Waymo from
     above, and the reason it is worth drawing vehicles at all. */
  if (kind.lidar) {
    g.beginPath(); g.arc(1.1, 0, 2.05, 0, TAU);
    g.fillStyle = '#23262a'; g.fill();
    g.beginPath(); g.arc(1.1, 0, 1.05, 0, TAU);
    g.fillStyle = '#4a5157'; g.fill();
    /* the little sensor pods at the corners */
    g.fillStyle = '#2b2f33';
    g.fillRect(L / 2 - 2.3, -W / 2 - 0.35, 1.5, 1.1);
    g.fillRect(L / 2 - 2.3,  W / 2 - 0.75, 1.5, 1.1);
  }

  if (braking) {
    g.fillStyle = '#c4402a';
    g.fillRect(-L / 2 + 0.2, -W / 2 + 0.9, 0.9, 1.3);
    g.fillRect(-L / 2 + 0.2,  W / 2 - 2.2, 0.9, 1.3);
  }

  g.restore();
}
