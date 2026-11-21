/* BROKE IN SF — the sound of the street.

   All of it is synthesised. There is no audio file in this folder and there
   is not going to be one: the game is a single folder you can open with no
   build step, the whole thing is smaller than one mp3, and a sound you make
   out of an oscillator raises no question about who owns it. Otondo's
   audio.js fetched a 650KB amapiano loop, which was right for a camp in
   Nigeria and is wrong for a Tuesday in the Tenderloin.

   What a game about walking across a city needs is not a track. It needs
   the floor under your feet and the traffic two streets over, so standing
   still is quiet and Market Street is not.

   ---- why it sounds the way it does ----
   The first pass was bare sine and triangle tones, dry, at whatever
   frequency happened to suit — which is the sound of a web page from 2005.
   Three things fix that and they are all structural rather than a matter of
   picking nicer numbers:

     - ONE SCALE. Every pitch in here is a degree of A minor pentatonic, so
       two sounds landing together can never clash, however they overlap.
     - NO BARE OSCILLATORS. A note is two detuned triangles and a sine an
       octave down, run through a lowpass that falls as it decays. That is a
       pluck with a body, not a beep.
     - AIR. Everything has a send to a short reverb. Dry is what makes small
       sounds feel cheap; a tail is most of what "produced" means.

   A compressor across the end glues the layers and stops a milestone
   landing on top of traffic from peaking.

   ---- the iOS lesson, inherited, because it cost two attempts to learn ----
   Web Audio defaults to the AMBIENT category, which on iPhone is the ringer
   channel: the context reports itself running, the scheduler ticks, and the
   phone stays silent. navigator.audioSession.type = 'playback' (iOS 16.4+)
   puts Web Audio on the playback channel and fixes it. Where there is no
   audioSession there is no safe path, so on those devices we stay quiet and
   say so rather than offering a player something broken. */

const KEY = 'sfgame:sound';

let ctx = null, master = null, rev = null, started = false;
let on = true;
try { on = localStorage.getItem(KEY) !== 'off'; } catch {}

const isIOS = () => /iP(hone|ad|od)/.test(navigator.platform || '') ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

export const available = () => !(isIOS() && !navigator.audioSession);
export const isOn = () => on && available();

/* A minor pentatonic. Not a tune — a palette, so that the money landing
   while a cable car is ringing two streets away is still consonant. */
const N = {
  A1: 55,    E2: 82.41,  A2: 110,    C3: 130.81, D3: 146.83,
  E3: 164.81, G3: 196,   A3: 220,    C4: 261.63, D4: 293.66,
  E4: 329.63, G4: 392,   A4: 440,    C5: 523.25, D5: 587.33,
  E5: 659.25, G5: 783.99, A5: 880,   C6: 1046.5, D6: 1174.66, E6: 1318.51,
};

/* ---------- the noise the whole street is built out of ----------
   Brown rather than white: white noise is a hiss, brown noise is a rumble,
   and a city two streets away is a rumble. Generated once and looped. */
function brown(seconds = 4) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3.4;
  }
  return buf;
}

/* A room, made out of noise that decays. Short and dark — this is a street
   at dusk, not a cathedral. */
function impulse(sec = 1.5, decay = 3.4) {
  const n = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < n; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return b;
}

/* Brown noise is a rumble, which is what a city two streets away is — but
   it falls away at six decibels an octave, so a bandpass up at 800Hz for a
   footstep has almost nothing left to pass. Measured: the footstep came out
   at 1.07x the ambient bed, which is inaudible. Transients get white. */
function white(seconds = 2) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

let noiseBuf = null, snapBuf = null;
let traffic = null, air = null, sub = null;

function build() {
  /* Glue across the whole output, so a milestone chord arriving on top of
     heavy traffic ducks it instead of clipping it. */
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 24;
  comp.ratio.value = 3.2; comp.attack.value = 0.006; comp.release.value = 0.22;
  comp.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = on ? 0.55 : 0;
  master.connect(comp);

  const conv = ctx.createConvolver();
  conv.buffer = impulse();
  rev = ctx.createGain(); rev.gain.value = 1;
  const wet = ctx.createGain(); wet.gain.value = 0.42;
  rev.connect(conv); conv.connect(wet); wet.connect(master);

  noiseBuf = brown();
  snapBuf = white();

  /* Traffic: the rumble, low-passed hard so it sits under everything. Its
     level follows how much is actually moving near you, set from the frame
     loop — so a back street is quiet and Market Street is not. */
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf; src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 0.6;
  traffic = ctx.createGain(); traffic.gain.value = 0.0001;
  src.connect(lp); lp.connect(traffic); traffic.connect(master);
  src.start();

  /* Air: the thin top end of being outdoors. The thing you would only
     notice if it stopped. */
  const src2 = ctx.createBufferSource();
  src2.buffer = noiseBuf; src2.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.5;
  air = ctx.createGain(); air.gain.value = 0.012;
  src2.connect(bp); bp.connect(air); air.connect(master);
  src2.start();

  /* And underneath all of it, the note the city hums on. Barely audible,
     slowly breathing, and the single cheapest thing you can add to make a
     scene feel like somewhere rather than nowhere. */
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.value = N.A1;
  const o2 = ctx.createOscillator();
  o2.type = 'sine'; o2.frequency.value = N.E2; o2.detune.value = -6;
  sub = ctx.createGain(); sub.gain.value = 0.016;
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.045; lfoG.gain.value = 0.009;
  lfo.connect(lfoG); lfoG.connect(sub.gain);
  o.connect(sub); o2.connect(sub); sub.connect(master);
  o.start(); o2.start(); lfo.start();
}

export function unlock() {
  if (started || !available()) return;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    build();
    started = true;
  } catch { started = false; }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function setOn(v) {
  on = !!v;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
  if (master) master.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
  if (on) unlock();
}

export function ambience(level) {
  if (!started || !on) return;
  const t = ctx.currentTime;
  traffic.gain.setTargetAtTime(0.0001 + level * 0.1, t, 0.4);
  air.gain.setTargetAtTime(0.008 + level * 0.012, t, 0.6);
}

/* ---------- a note with a body ----------
   Two triangles pulled a few cents apart and a sine an octave below, run
   through a lowpass that closes as the note decays. The detune is what
   stops it sounding like a test tone and the moving filter is what makes
   it a pluck rather than an organ. */
function pluck(freq, { at = 0, dur = 0.55, peak = 0.08, send = 0.5,
                       detune = 7, bright = 3000, type = 'triangle' } = {}) {
  if (!started || !on) return;
  const t = ctx.currentTime + at;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.Q.value = 0.8;
  f.frequency.setValueAtTime(bright, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(240, freq * 1.5), t + dur * 0.75);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.014);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  for (const d of [-detune, detune]) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq; o.detune.value = d;
    o.connect(f); o.start(t); o.stop(t + dur + 0.03);
  }
  const body = ctx.createOscillator(), bg = ctx.createGain();
  body.type = 'sine'; body.frequency.value = freq / 2; bg.gain.value = 0.4;
  body.connect(bg); bg.connect(f); body.start(t); body.stop(t + dur + 0.03);

  f.connect(g); g.connect(master);
  if (send > 0) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(rev); }
}

/* A filtered burst of the same brown noise — a transient, for the things
   that are an impact rather than a note. */
function hit(freq, Q, { at = 0, dur = 0.09, peak = 0.05, send = 0.25 } = {}) {
  if (!started || !on) return;
  const t = ctx.currentTime + at;
  const s = ctx.createBufferSource();
  s.buffer = snapBuf;
  s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = Q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  if (send > 0) { const sd = ctx.createGain(); sd.gain.value = send; g.connect(sd); sd.connect(rev); }
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}

/* A chord, struck like a guitar rather than a piano — a few milliseconds
   between the notes is the whole difference. */
const strum = (notes, o = {}) =>
  notes.forEach((n, i) => pluck(n, { at: (o.at || 0) + i * (o.gap || 0.045), ...o }));

/* ---------- a foot on a pavement ---------- */
export function step() {
  /* Measured against the ambient bed: at 0.028 the footstep came out
     QUIETER than the traffic it was supposed to be heard over, which makes
     the one sound that grounds the whole game the one sound you cannot
     hear. A little body under the transient, and enough level to sit on
     top of a busy street. */
  hit(760 + Math.random() * 380, 1.0, { dur: 0.08, peak: 0.1, send: 0.14 });
  hit(190 + Math.random() * 70, 1.6, { dur: 0.06, peak: 0.07, send: 0.05 });
}

/* The cable car. A bell is inharmonic — that is what makes it a bell and
   not a note — so these partials are deliberately off the scale. */
export function bell() {
  const ring = (at) => {
    [1, 2.76, 5.4, 8.9].forEach((m, i) =>
      pluck(524 * m, { at, dur: 1.5 - i * 0.22, peak: 0.03 / (i + 1.3),
                       send: 0.8, detune: 2, bright: 7000, type: 'sine' }));
  };
  ring(0); ring(0.28);
}

/* ---------- what just happened ----------
   One gesture per thing the game does, all of it in the same key, so the
   flash message is a confirmation rather than the only way to know. */
const EVENTS = {
  /* Measured at bed level even after the move to white noise — forty
     milliseconds through a narrow bandpass is almost nothing. Wider, a
     touch longer, and with a note under it so it reads as a confirmation
     rather than a tick. */
  tap:    () => { hit(2100, 1.3, { dur: 0.055, peak: 0.22, send: 0.12 });
                  pluck(N.E6, { dur: 0.16, peak: 0.05, send: 0.3, bright: 6000 }); },
  panel:  () => pluck(N.A3, { dur: 0.3, peak: 0.045, send: 0.3, bright: 1500 }),

  pickup: () => { hit(520, 0.8, { dur: 0.17, peak: 0.05 });
                  pluck(N.D4, { at: 0.03, dur: 0.3, peak: 0.045, bright: 1800 }); },
  paid:   () => strum([N.E5, N.A5], { dur: 0.6, peak: 0.07, send: 0.55, gap: 0.075 }),
  spend:  () => strum([N.D4, N.A3], { dur: 0.4, peak: 0.05, send: 0.35, gap: 0.06 }),

  no:     () => pluck(N.C3, { dur: 0.45, peak: 0.055, send: 0.3, bright: 900 }),
  hired:  () => strum([N.A4, N.C5, N.E5], { dur: 0.75, peak: 0.07, send: 0.6, gap: 0.07 }),
  shift:  () => strum([N.G3, N.D3], { dur: 0.7, peak: 0.055, send: 0.4, gap: 0.1 }),
  eat:    () => pluck(N.D5, { dur: 0.32, peak: 0.05, send: 0.35 }),

  /* A key turning, then the room it opens into. */
  keys:   () => { hit(3400, 3, { dur: 0.06, peak: 0.045 });
                  hit(2700, 3, { at: 0.07, dur: 0.07, peak: 0.035 });
                  strum([N.A3, N.E4, N.A4, N.C5],
                        { at: 0.12, dur: 1.5, peak: 0.055, send: 0.8, gap: 0.06 }); },
  /* Fifteen years old, and it starts. */
  car:    () => { pluck(N.A1, { dur: 0.9, peak: 0.1, send: 0.2,
                                bright: 420, detune: 14, type: 'sawtooth' });
                  strum([N.A2, N.E3], { at: 0.14, dur: 0.9, peak: 0.05, send: 0.5 }); },

  friend: () => strum([N.D5, N.G5], { dur: 0.6, peak: 0.055, send: 0.55, gap: 0.08 }),
  met:    () => strum([N.A4, N.C5, N.E5, N.A5],
                      { dur: 1.1, peak: 0.055, send: 0.7, gap: 0.075 }),

  bad:    () => pluck(N.C3, { dur: 0.5, peak: 0.06, send: 0.3,
                              bright: 700, detune: 18 }),
  sleep:  () => strum([N.A2, N.E3], { dur: 1.3, peak: 0.045, send: 0.6, gap: 0.14,
                                      bright: 800 }),

  /* Two names on one lease. The only time the game plays a whole phrase. */
  end:    () => strum([N.A4, N.C5, N.E5, N.G5, N.A5],
                      { dur: 2.2, peak: 0.06, send: 0.9, gap: 0.13 }),
  /* You ran out of couch. The same notes, going the other way. */
  lost:   () => strum([N.A3, N.G3, N.E3, N.C3],
                      { dur: 1.8, peak: 0.055, send: 0.7, gap: 0.22, bright: 1100 }),
};

export function ping(name) {
  const e = EVENTS[name];
  if (e && started && on) e();
}
