/* A person, seen from directly above.

   What you actually see from a roof: the top of a head, the shoulders, and
   the arms and feet swinging out past the shoulder line. There is no face and
   there are no legs to speak of — the body hides them — so the whole read of
   "this is a person walking" comes from the rhythm of four small shapes
   appearing and disappearing past the torso. Get the swing wrong and it reads
   as a spider; get it right and it reads as a person from three blocks away.

   The cycle is driven by DISTANCE COVERED, never by elapsed time. Tie it to
   time and the feet keep paddling while the player stands still, or skate
   when the speed changes. Drive it by distance and it is correct at any
   speed and stops dead the moment they do.

   Local space has the walker facing +x, and the whole thing is rotated into
   the heading, so everything below is written as if they were walking right. */

const TAU = Math.PI * 2;

export function drawWalker(g, o) {
  const {
    x, y, heading = 0, phase = 0, scale = 1,
    skin = '#c98f63', coat = '#2f3a4a', trouser = '#39404d',
    hair = '#241c18', pack = null, moving = true, shadow = true,
  } = o;

  /* Settle to a neutral stance when stopped rather than freezing mid-stride
     with one foot hanging in the air. */
  const sw = moving ? Math.sin(phase) : 0;
  const bob = moving ? Math.cos(phase * 2) * 0.35 : 0;

  g.save();
  g.translate(x, y);

  if (shadow) {
    g.save(); g.rotate(heading);
    g.beginPath();
    g.ellipse(-1.2 * scale, 1.6 * scale, 7.2 * scale, 5.4 * scale, 0, 0, TAU);
    g.fillStyle = 'rgba(28,24,18,.17)'; g.fill();
    g.restore();
  }

  g.rotate(heading);
  g.translate(0, bob * scale);

  const S = scale;
  const ell = (cx, cy, rx, ry, fill) => {
    g.beginPath(); g.ellipse(cx * S, cy * S, rx * S, ry * S, 0, 0, TAU);
    g.fillStyle = fill; g.fill();
  };

  /* FEET — furthest from the camera, so they go down first. They swing
     opposite each other, and each one is only visible while it is out past
     the body; the stride carries it fore and aft of the torso. */
  const stride = sw * 3.6;
  ell(stride, -2.1, 1.9, 1.5, trouser);
  ell(-stride, 2.1, 1.9, 1.5, trouser);

  /* ARMS — opposite phase to the leg on the same side, which is what makes a
     walk look like a walk and not like a shuffle. */
  const swing = -sw * 2.9;
  ell(swing, -4.6, 1.7, 1.35, coat);
  ell(-swing, 4.6, 1.7, 1.35, coat);
  /* hands, just past the sleeve */
  ell(swing * 1.42, -4.9, 1.05, 0.95, skin);
  ell(-swing * 1.42, 4.9, 1.05, 0.95, skin);

  /* SHOULDERS — wider across than front-to-back, which is the single cue
     that says you are looking down at somebody rather than at a blob. */
  g.beginPath();
  g.ellipse(0, 0, 3.5 * S, 4.9 * S, 0, 0, TAU);
  g.fillStyle = coat; g.fill();

  /* the delivery bag, worn on the back — you can see what you are carrying */
  if (pack) {
    g.save();
    g.translate(-1.5 * S, 0);
    g.fillStyle = pack;
    const w = 3.5 * S, h = 6.2 * S, r = 1.1 * S;
    g.beginPath();
    g.roundRect ? g.roundRect(-w/2, -h/2, w, h, r)
                : g.rect(-w/2, -h/2, w, h);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 0.7 * S; g.stroke();
    g.restore();
  }

  /* HEAD — sits a touch forward of the shoulders, the way a head does when
     somebody is actually going somewhere.

     Hair first at full size, then the face laid over the front of it. This
     used to be the other way round with the hair clipped to the skull, which
     looked identical and cost a clip() and a restore() per figure per frame —
     with fifty people on screen that was the single most expensive thing in
     the renderer. What matters is only that a crescent of forehead survives
     at the front: from above it is the ONLY cue to which way somebody faces,
     and without it the head is a disc that could be going either way. */
  ell(0.75, 0, 3.05, 3.05, hair);
  ell(1.5, 0, 2.4, 2.62, skin);

  g.restore();
}

/* Advance the cycle by how far the walker just moved. One full stride every
   ~17 world px, which at this map's scale is a believable pace. */
export const stepPhase = (phase, dist) => (phase + dist * 0.37) % TAU;

/* A few looks, so a street full of people is not a street full of clones. */
export const LOOKS = [
  { skin: '#8d5a3b', coat: '#334a63', trouser: '#2d3340', hair: '#1b1410' },
  { skin: '#c98f63', coat: '#6a4738', trouser: '#3a3630', hair: '#3a2a1c' },
  { skin: '#e3b48c', coat: '#4a5c44', trouser: '#3b4038', hair: '#6b4a24' },
  { skin: '#5e3b26', coat: '#7a3f3f', trouser: '#33302e', hair: '#140f0c' },
  { skin: '#f0cda8', coat: '#2f3a4a', trouser: '#39404d', hair: '#8a6a3a' },
];
