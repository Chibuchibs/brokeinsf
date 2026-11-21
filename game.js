/* BROKE IN SF — the rules. No DOM in this file.

   The shape of the game: you arrive with very little, you sleep on a friend's
   couch, and you walk. Delivery work pays today; a real job pays next month.
   The ladder is couch -> steady work -> your own lease -> a car -> a life that
   does not fall over when one thing goes wrong.

   What the game is NOT: the street's people are never the obstacle. The things
   that cost you are city things — a Waymo stopped dead in the crosswalk, a
   wallet left on a counter, fog, a bus that never comes, the rent itself. */

import { PLACES } from './city.js?v=20261121141823';

export const DAY_START = 7 * 60;          // 07:00, in minutes
export const DAY_END   = 23 * 60;         // 23:00 — the day ends whether you like it or not
/* How fast the city clock runs. At 3 a walk of four blocks burned over an
   hour of the day, so the app was quoting 74 minutes to carry a bag from
   Hyde Street to Civic Center — which is not a delivery, it is an expedition.
   At 1.4 the quotes land in the twenties and thirties, where real ones are.
   The day is longer in real time as a result, but you also get more done in
   it, so it costs the player nothing. */
export const MIN_PER_SEC = 1.4;

/* The couch has a shelf life: thirty days. Simulated at 14 the lease landed on
   day 14 almost exactly, so the run came down to a coin flip on one morning
   rather than to how well it was played. Thirty leaves room to play badly and
   recover, which is where the story actually is. */
export const COUCH_DAYS = 30;
/* First month plus deposit on a Tenderloin studio. These two have to agree:
   the move-in cost IS two months of the rent that follows it, and at 2800
   against 2100 they did not. You arrive with 2000, which is enough to eat
   and not panic and nowhere near enough for your own door. */
export const RENT = 2250;

/* A residential hotel room. Half the rent of a studio and none of the
   screening: no employer, no stubs, no income multiple, just the month up
   front. Simulation said a player of moderate effort earns about $3,200 a
   month, which cannot clear 2.5x a studio's rent and clears this easily —
   which is exactly the choice real people on that income are making. */
export const SRO_RENT = 1200;
/* First and last, which is what these places ask. At 1,400 it was payable
   out of the money in your pocket on the morning you arrived, so the couch,
   the thirty days and the friend who gave them to you could all be skipped
   before the first delivery. Two months up front means you have to earn
   your way off the couch rather than walk off it. */
export const SRO_MOVE_IN = SRO_RENT * 2;  // 2,400

/* What a San Francisco landlord asks for, in order: an employer, two or
   three recent pay stubs, income of two and a half to three times the rent,
   and a screening fee per applicant. Declared up here with the rest of the
   money because the ladder below reads them while the module is still
   initialising — defined further down, they throw on load. */
export const STUDIO_COST = RENT * 2;      // 4,500
export const STUBS_NEEDED = 3;
export const INCOME_MULTIPLE = 2.5;
export const APP_FEE = 55;
export const MOVE_IN_COST = STUDIO_COST + APP_FEE;
export const CAR_COST = 4200;
export const START_CASH = 2000;

/* Whose couch it is. You pick at the door, and they are the reason you have
   a roof for thirty days — so they get a name, a face, and the last word. */
export const HOSTS = [
  { id: 'dre',    name: 'Dre' },
  { id: 'amanda', name: 'Amanda' },
];
export const hostOf = s => HOSTS.find(h => h.id === s.host) || HOSTS[0];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
export const money = n =>
  (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
export const clock = m =>
  String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' +
  String(Math.floor(m) % 60).padStart(2, '0');

/* ---------- the ladder ----------
   Each rung names itself in the HUD, so the player always knows what they are
   working toward. `reached` is checked after every change to state. */
/* ---------- the last stretch ----------
   Everything above is about staying in the city. This is about living in it.
   It opens when the car is bought rather than on a fixed day: the car lands
   around day 36 in simulation, so a hard gate at day 55 would have dropped a
   second empty fortnight into exactly the place we were trying to fill. One
   constant if that turns out to be the wrong call. */
/* A bed, a wage, and a month survived. Gating this on the car meant anybody
   who never cleared $4,200 never saw the last act at all; gating it on a bed
   and a wage alone swung it the other way and the ending arrived on day
   fourteen, before the lease or the car existed. A month in the city is the
   honest line: you have found your feet, and now you look up from them. */
export const SETTLED_DAY = 30;
export const socialOpen = s => housed(s) && !!s.job && s.day >= SETTLED_DAY;
export const FRIENDS_FIRST = 3;        // you know a few people before you meet one
export const CLOSE_ENOUGH = 100;

export const PREFS = [
  { id: 'women', label: 'Women' },
  { id: 'men',   label: 'Men' },
  { id: 'any',   label: 'Anyone' },
];

const NAMES = {
  women: ['Marisol', 'Thuy', 'Dani', 'Priya', 'Nneka', 'Claudia',
          'Rosa', 'Jing', 'Amara', 'Tess', 'Bea', 'Leila'],
  men:   ['Andre', 'Minh', 'Marcus', 'Dev', 'Tobias', 'Rafa',
          'Eli', 'Kenji', 'Omar', 'Will', 'Sam', 'Nico'],
};
NAMES.any = [...NAMES.women, ...NAMES.men];

export const rungGoal = (r, s) => typeof r.goal === 'function' ? r.goal(s) : r.goal;

export const RUNGS = [
  /* "Make your first $100" was written when you arrived with $180 and it was
     the whole game. Against the $2,000 you now land with it reads as nonsense
     — the player is holding twenty times the target. What is actually true on
     day one is that none of that money is yours to keep: it is rent you have
     not paid yet. */
  { id: 'arrive',  label: 'Sleeping on the couch',
    goal: 'Do one delivery. Every dollar is rent you have not paid yet.',
    reached: s => s.runs >= 1 },
  { id: 'working', label: 'Delivering',
    goal: 'Get a resume together. Deliveries will not pass a rental screening.',
    reached: s => !!s.resume },
  { id: 'applying', label: 'Looking for real work',
    goal: 'Land a job. A steady wage is the only thing that covers rent.',
    reached: s => !!s.job },
  { id: 'hired',   label: s => `Working at ${s.job ? s.job.where : 'a job'}`,
    /* Being hired told the player nothing about going in. The goal pointed
       straight at housing and skipped the only thing that pays for it, so a
       player could stay on deliveries for a fortnight and never find out
       their job had shifts. */
    goal: 'Go in and work your shifts. That wage is what gets you a room.',
    reached: s => housed(s) },
  /* ---- one rung for having somewhere to live ----
     This used to be three: a room, then a lease, then a car, each gating
     the next. A player who stayed at the Alder never cleared the first of
     them, so the compass read "A lease of your own" for the rest of their
     game — through making friends, through meeting somebody, and still
     behind the end card. And the lease wants 2.5x the rent in verified
     income, which one service wage in this city does not reach; that is the
     entire reason the room exists. Gating the back half of the game behind
     it meant the people the room was added for were the ones who could
     never finish.

     So the lease and the car are what they always really were: things worth
     having, not toll gates. The compass names whichever one is actually in
     front of you, and once you have a month in the city behind you it
     points at what the last act is about instead. */
  { id: 'settled', label: s => s.leased ? 'You have your own lease'
      : 'Renting a room at the Alder',
    goal: s =>
        socialOpen(s) ? 'Go out. Get to know a few people.'
      : canSign(s).ok ? `You could sign the Larkin lease today — ${money(MOVE_IN_COST)}`
      : !s.leased ? `A lease of your own — ${money(MOVE_IN_COST)} and ${INCOME_MULTIPLE}x the rent`
      : !s.car ? `Save ${money(CAR_COST)} for a car — on the board at Hyde St Market`
      : 'A month in this city, and then you can look up from it.',
    reached: s => s.friends >= FRIENDS_FIRST },

  { id: 'friends', label: 'You know people here',
    goal: 'Meet someone. You go out, and a friend brings somebody along.',
    reached: s => !!s.partner },
  { id: 'seeing',  label: s => `Seeing ${s.partner ? s.partner.name : 'someone'}`,
    /* "Find a place together" was shown from the day they met, while the
       action to ask stayed hidden for another six evenings, with nothing
       anywhere on screen to say why. */
    goal: s => !s.partner ? 'Find a place together'
      : s.partner.closeness >= CLOSE_ENOUGH
        ? `Ask ${s.partner.name} to move in, at your place`
        : `Keep seeing ${s.partner.name}. Neither of you has said it yet.`,
    reached: s => s.movedIn },
  { id: 'done',    label: 'You live here now',
    goal: 'You are not new any more.', reached: () => false },
];
export function rung(s) {
  for (const r of RUNGS) if (!r.reached(s)) return r;
  return RUNGS[RUNGS.length - 1];
}
export const rungLabel = (r, s) => typeof r.label === 'function' ? r.label(s) : r.label;

/* ---------- delivery work ----------
   The only income available on day one, and the reason to learn the map. A run
   is a pickup, a dropoff and a clock. Pay scales with distance because that is
   how it works, and the app takes its cut because that is also how it works. */
const FOOD = PLACES.filter(p => p.kind === 'food' || p.kind === 'store');
const DROPS = PLACES.filter(p => p.kind !== 'couch' && p.kind !== 'apartment');

/* The longest quote the app is allowed to put on the board. Food delivery
   lives in the twenties and thirties; past that it stops reading as a meal
   going somewhere and starts reading as a hike. MAX_HOP is derived FROM the
   cap rather than guessed alongside it, so the two cannot drift apart when
   the minutes formula is next retuned. */
const MAX_MINUTES = 35;
const MAX_HOP = (MAX_MINUTES - 8) * 14;        // 378
const gap = (a, b) => Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]);

export function offerRun(s, rng = Math.random) {
  const from = pick(rng, FOOD);
  /* Only places close enough to quote honestly. Nobody carries a bowl of
     phở from the Tenderloin up to Lombard Street. */
  const near = DROPS.filter(p => p.id !== from.id && gap(p, from) <= MAX_HOP);
  const to = near.length
    ? pick(rng, near)
    : DROPS.filter(p => p.id !== from.id)
           .sort((a, b) => gap(a, from) - gap(b, from))[0];
  const d = gap(to, from);
  const mins = Math.round(8 + d / 14);
  /* Paid by the minute, at a rate that IMPROVES with the length of the run.
     Under the old flat-ish formula a long haul paid more in total and less
     per minute — 33 cents a minute on the shortest hop against 20 on the
     longest — so the shortest offer on the board was always correct and the
     choice between three runs was arithmetic with one right answer. Tilting
     the rate upward makes the big one tempting instead of a trap. */
  const base = mins * (0.26 + mins / 400);
  const tip = rng() < 0.62 ? 1 + rng() * 7 : 0;  // most people tip, some do not
  return {
    id: 'r' + Math.floor(rng() * 1e9).toString(36),
    from: from.id, to: to.id,
    pay: Math.round(base * 100) / 100,
    tip: Math.round(tip * 100) / 100,
    /* Generous enough to be reachable on foot, tight enough that a setback
       actually costs you the tip.

       `d` is straight-line, but you walk the streets, which is roughly 1.4x
       further, costing about 0.058 game-minutes per pixel. This lands quotes
       in the twenties and thirties with four or five minutes of slack for a
       Waymo in the crosswalk. Capping everything under twenty was tried and
       rejected: it meant throwing away every cross-town run on the board. */
    minutes: mins,
    picked: false,
  };
}

/* Three DIFFERENT runs. Rolling each independently handed the player the
   same restaurant-to-destination pair twice on the same screen, which reads
   as a broken app rather than a busy one. */
export function refreshOffers(s, rng = Math.random) {
  const out = [], seen = new Set();
  for (let i = 0; i < 40 && out.length < 3; i++) {
    const r = offerRun(s, rng);
    const k = r.from + '>' + r.to;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  s.offers = out;
  return s.offers;
}

/* The clock starts when the food is in your hands, not when you tap accept.
   Starting it at accept meant the walk ACROSS TOWN to the restaurant ate the
   delivery window before you had collected anything, so whether a run was
   winnable depended on how far away you happened to be standing — and it
   made the player's walking speed impossible to tune without breaking every
   deadline in the game. `due` is filled in at the pickup. */
export function acceptRun(s, id) {
  const r = (s.offers || []).find(o => o.id === id);
  if (!r || s.run) return s;
  s.run = { ...r, due: null };
  s.offers = [];
  return s;
}

/* Called when the player reaches a place. Returns a line to show, or null. */
export function atPlace(s, placeId, rng = Math.random) {
  const run = s.run;
  if (run && !run.picked && run.from === placeId) {
    run.picked = true;
    run.due = s.time + run.minutes;          // the window opens here
    return `Picked up. ${placeName(run.to)} by ${clock(run.due)}.`;
  }
  if (run && run.picked && run.to === placeId) {
    const late = run.due != null && s.time > run.due;
    const tip = late ? 0 : run.tip;
    const got = run.pay + tip;
    s.money += got;
    s.earned += got;
    s.runs += 1;
    s.run = null;
    return late ? `Delivered late. ${money(run.pay)}, no tip.`
      : tip ? `Delivered. ${money(run.pay)} plus ${money(tip)} tip.`
      : `Delivered. ${money(run.pay)}. They did not tip.`;
  }
  return null;
}

export const placeName = id => (PLACES.find(p => p.id === id) || {}).name || id;

/* ---------- eating ----------
   Everywhere that will sell you something, cheapest first. Eating used to be
   a top-up you could simply decline, so a careful player never spent a cent
   on food and the day cost nothing to get through. It is the most reliable
   expense there is, and it has to come out of what you earn. */
export const FOOD_PLACES = PLACES
  .filter(p => p.cost != null && p.energy != null)
  .sort((a, b) => a.cost - b.cost);

export const HUNGRY_AT = 35;
export const hungry = s => s.energy <= HUNGRY_AT;

export function eat(s, place) {
  if (s.money < place.cost) return 'Not enough on the card.';
  s.money -= place.cost;
  s.energy = clamp(s.energy + place.energy);
  s.meals = (s.meals || 0) + 1;
  s.fed = s.day;                       // you have eaten today
  return `${place.name}. ${money(place.cost)}.`;
}

/* ---------- the resume ----------
   Either written in the game or pasted in from a real one. Pasted text NEVER
   leaves the browser: it is keyword-matched here and kept in localStorage, and
   nothing in this file sends it anywhere. A real resume has a real name, a real
   phone number and a real address on it, so it stays on the player's machine. */
export const TAGS = ['service', 'retail', 'food', 'warehouse',
                     'driving', 'admin', 'office', 'tech'];

const TAG_WORDS = {
  service:   ['server', 'waiter', 'waitress', 'barista', 'bartender', 'host',
              'customer', 'hospitality', 'front desk', 'concierge'],
  retail:    ['retail', 'cashier', 'sales associate', 'store', 'merchandis',
              'shop assistant', 'stock'],
  food:      ['kitchen', 'cook', 'chef', 'food', 'restaurant', 'cafe', 'café',
              'prep', 'barista'],
  warehouse: ['warehouse', 'forklift', 'picker', 'packer', 'inventory',
              'logistics', 'shipping', 'receiving'],
  driving:   ['driver', 'driving', 'delivery', 'courier', 'cdl', 'license',
              'rideshare', 'dispatch'],
  admin:     ['admin', 'assistant', 'scheduling', 'reception', 'clerical',
              'filing', 'payroll', 'coordinator'],
  office:    ['office', 'excel', 'spreadsheet', 'microsoft', 'google docs',
              'email', 'calendar', 'reporting'],
  tech:      ['software', 'engineer', 'developer', 'python', 'javascript',
              'sql', 'data', 'it support', 'helpdesk', 'technician'],
};

/* Pulls tags out of pasted text. Deliberately dumb and deliberately local. */
export function readResume(text) {
  const t = (text || '').toLowerCase();
  const tags = TAGS.filter(tag => TAG_WORDS[tag].some(w => t.includes(w)));
  return tags.length ? tags : ['service'];   // everyone can do something
}

export function setResume(s, { name, tags, note }) {
  s.resume = {
    name: (name || s.name || 'You').slice(0, 40),
    tags: (tags || []).filter(t => TAGS.includes(t)).slice(0, 6),
    note: (note || '').slice(0, 140),
  };
  if (!s.resume.tags.length) s.resume.tags = ['service'];
  return s.resume;
}

/* ---------- applying ----------
   You can apply anywhere. Matching the posting is what makes them call back. */
/* How you read against a posting. The odds existed but were invisible: you
   walked in, handed over a resume and got a yes or a no with nothing to
   learn from. A card in a window says what the job is and what they want,
   so the player can tell a long shot from a sure thing before walking
   across town for it — which is the entire use of having a resume. */
export function matchAt(s, place) {
  const wants = place.needs || [];
  const have = (s.resume && s.resume.tags) || [];
  const hits = wants.filter(n => have.includes(n)).length;
  return {
    wants, hits,
    verdict: !s.resume ? 'You have no resume to hand them.'
      : hits >= 2 ? 'You are what they are asking for.'
      : hits === 1 ? 'Some of it lines up.'
      : 'Nothing on your resume is what they asked for.',
  };
}

const NOS = [
  'They took your resume. They will call. They will not call.',
  'The manager is not in. Leave it with them, someone says.',
  'There is a stack of resumes by the till. Yours is on top of it now.',
  'They ask if you can start Thursday, then stop asking.',
  'A nod, and the paper goes under the counter.',
  'Somebody will be in touch. Nobody writes anything down.',
  'They already filled it this morning. The card is still in the window.',
];

export function apply(s, place, rng = Math.random) {
  if (s.job) return { ok: false, line: `You already work at ${s.job.where}.` };
  if (!s.resume) return { ok: false, line: 'They ask for a resume. You do not have one yet.' };
  if (s.applied.includes(place.id))
    return { ok: false, line: 'You already dropped a resume here.' };

  s.applied.push(place.id);
  const hits = place.needs.filter(n => s.resume.tags.includes(n)).length;
  /* Walking in with nothing matching is not hopeless, just unlikely. Two hits
     and you are the obvious hire — but nobody hires you the same week you
     arrive. At [.12/.45/.8] the simulated player was employed on day two,
     which skipped the whole stretch the game is actually about. */
  const odds = [0.05, 0.18, 0.38][Math.min(hits, 2)];
  if (rng() < odds) {
    s.job = { where: place.name, role: place.role, pay: place.pay, id: place.id };
    return { ok: true,
      line: `${place.name} hired you. ${place.role}, ${money(place.pay)} an hour. ` +
            `Come in and work a shift.` };
  }
  /* One rejection line read beautifully the first time and like wallpaper by
     the fourth. A strong match still takes two days at the median and twelve
     at the tail, so this is a line the player may read a dozen times. */
  return { ok: false, line: `${place.name}. ${pick(rng, NOS)}` };
}

/* What a shift would cost and pay, before you commit to it. The button said
   only "Work a shift" and then took eight hours off the clock — the single
   biggest commitment in the day, made blind. */
export function shiftPreview(s) {
  if (!s.job) return null;
  const hours = Math.min(8, Math.max(0, (DAY_END - s.time) / 60));
  return { hours: Math.round(hours), net: s.job.pay * hours * 0.78,
           tooLate: hours < 2 };
}

/* A shift at the job you landed: eight hours, gone from the clock. */
export function workShift(s) {
  if (!s.job) return 'No job yet.';
  const hours = Math.min(8, Math.max(0, (DAY_END - s.time) / 60));
  if (hours < 2) return 'Too late in the day to pick up a shift.';
  const gross = s.job.pay * hours;
  const net = gross * 0.78;                 // tax, and the city takes its share
  s.money += net;
  s.earned += net;
  s.time += hours * 60;
  s.energy = clamp(s.energy - hours * 7);
  s.shifts += 1;
  return `${Math.round(hours)}h at ${s.job.where}. ${money(net)} after tax.`;
}

/* ---------- going out ----------
   The same walking game as the rest of it: you go to a place, it costs you an
   evening, and something or nothing happens. The difference is that what you
   are accumulating is no longer money. */
/* Each place says its own evening. The lines used to be one pool shared by
   all of them, so "a slow night, you stayed for one and walked home" played
   in a public park at eleven in the morning, and "you sat in the park until
   it got cold" played at a bar on Polk Street. Written per place, they also
   do the work of telling you what each place is for. */
const LINES = {
  park: {
    quiet: [
      'You sat on a bench and watched a dog lose its mind over a tennis ball.',
      'Somebody was teaching a kid to ride a bike, badly, with great patience.',
      'A quiet hour. You read half of something and walked back.',
    ],
    friend: [
      'You held one end of a tape measure for somebody marking out a court. Numbers swapped.',
      'A dominoes game needed a fourth. You lost twice and came away with a number.',
      'Somebody clocked the delivery bag and asked what the app really pays. You told them.',
    ],
    date: [
      'You sat on the grass until the fog came over the hill and chased you off it.',
      'They brought coffee. Neither of you suggested going anywhere else.',
      'You walked the whole park twice, slowly, talking about nothing much.',
    ],
  },
  bar: {
    quiet: [
      'A slow night. You stayed for one and walked home.',
      'You knew nobody and left early. It happens.',
      'The jukebox was better than the crowd. Still, you were out.',
    ],
    friend: [
      'You got talking to someone about the 19 never coming. Numbers swapped.',
      'You ended up in a four-way argument about the best burrito. You have their number.',
      'Somebody needed a hand carrying an amp out to a van. Now you know the whole band.',
    ],
    date: [
      'You got the corner booth and stayed until they put the lights up.',
      'They taught you the rules of a dice game and then took you apart at it.',
      'You talked over the music until neither of you was listening to it.',
    ],
  },
  theatre: {
    quiet: [
      'Good show. You came out with your ears ringing and nobody to tell.',
      'The support act was better. You said so, to nobody in particular.',
    ],
    friend: [
      'You and the person next to you agreed the sound was terrible. Drinks after.',
      'Somebody put a whole drink down your back and bought you three to make up for it.',
    ],
    date: [
      'They knew every word. You spent most of it watching them instead.',
      'You came out onto Market still shouting at each other over the ringing.',
    ],
  },
};
const linesFor = (place, kind) =>
  (LINES[place.id] || LINES.bar)[kind] || LINES.bar[kind];

/* An evening is a thing you have to spend, and the day only has one in it.
   Going out used to be available from seven in the morning, which is how
   "you have an evening free" ended up on screen at ten past eight and how
   the whole last act came to cost the player nothing they cared about. Now
   it lands squarely against the end of a shift and an evening of deliveries,
   so choosing to go out is choosing not to earn — which is the same trade
   the rest of this game is made of. */
export function canGoOut(s, place) {
  if (!socialOpen(s)) return { ok: false,
    why: 'Not tonight. There is too much to sort out first.' };
  const opens = (place.opens || 7) * 60;
  if (s.time < opens) return { ok: false,
    why: `${place.name} is not worth turning up to before ${clock(opens)}.` };
  if (s.time > DAY_END - 90) return { ok: false, why: 'Too late to start an evening.' };
  if (s.money < (place.cost || 0)) return { ok: false,
    why: `${money(place.cost)} and you have ${money(s.money)}.` };
  /* Going out on an empty tank. You are no good to anybody and you know it. */
  if (s.energy < 20) return { ok: false,
    why: 'You are too tired to be any good to anybody tonight. Eat something.' };
  return { ok: true };
}

export function goOut(s, place, rng = Math.random) {
  const c = canGoOut(s, place);
  if (!c.ok) return c.why;

  s.money -= place.cost || 0;
  s.time += 95 + rng() * 80;
  s.energy = clamp(s.energy - 13);
  s.nights = (s.nights || 0) + 1;

  /* If there is already somebody, the evening is about them — and where you
     take them is how fast it goes. A walk in the park is free and slow; the
     Warfield is thirty-eight dollars and worth three of them. */
  if (s.partner) {
    const lift = (place.lift || 10) * (0.8 + rng() * 0.45);
    const was = s.partner.closeness;
    s.partner.closeness = Math.min(CLOSE_ENOUGH, s.partner.closeness + lift);
    s.dates = (s.dates || 0) + 1;
    const line = pick(rng, linesFor(place, 'date'));
    return s.partner.closeness >= CLOSE_ENOUGH && was < CLOSE_ENOUGH
      ? `${line} One of you is always crossing town. You have talked about that.`
      : line;
  }

  /* You meet somebody through the people you already know, not out of thin
     air — which is both truer and a reason to make friends first. */
  if (s.friends >= FRIENDS_FIRST && s.pref && rng() < (place.meet || 0.3) * 0.72) {
    const name = pick(rng, NAMES[s.pref] || NAMES.any);
    s.partner = { name, closeness: 10 + rng() * 12, met: s.day };
    return `A friend brought ${name} along. You talked until they closed up.`;
  }

  if (rng() < (place.meet || 0.3)) { s.friends += 1; return pick(rng, linesFor(place, 'friend')); }
  return pick(rng, linesFor(place, 'quiet'));
}

export function setPref(s, id) {
  s.pref = PREFS.some(p => p.id === id) ? id : 'any';
  return s.pref;
}

/* A room of your own is enough to ask someone to share it. Requiring a
   lease meant the whole ending was locked behind an income test that a
   player of ordinary effort cannot pass in this city — so the people who
   most need somewhere to end up were the ones who could never get there. */
export function canMoveIn(s) {
  return !!(housed(s) && s.partner && s.partner.closeness >= CLOSE_ENOUGH && !s.movedIn);
}

export function moveIn(s) {
  if (!housed(s)) return 'Not while you are on somebody else\'s couch.';
  if (!s.partner) return 'There is nobody to ask yet.';
  if (s.partner.closeness < CLOSE_ENOUGH) return 'Too soon to ask.';
  s.movedIn = true;
  s.over = 'done';
  return `${s.partner.name} said yes. Two names on one lease.`;
}

/* ---------- milestones you buy ---------- */
/* ---- what it takes to sign ----
   Cash alone used to be the whole test, and with deliveries paying properly
   that put a lease in reach by day eight of thirty — the deadline stopped
   meaning anything and the eviction ending became unreachable. No landlord
   in this city rents on a bank balance either: they want to see that the
   money keeps arriving. Gating on what the landlord can verify fixes the
   pacing and gives the job a reason to exist beyond its hourly rate.

   The requirements themselves live up with the other money constants. The
   deposit is one month — California capped it there in 2024 — which is why
   first-plus-deposit is exactly twice the rent, not some rounder number.

   What the landlord sees: everything you have earned, as a monthly rate.
   Delivery money counts — it lands in the same account the deposits are
   checked against — but it will not get you there on its own. */
export const monthlyIncome = s => s.earned / Math.max(1, s.day) * 30;

export function canSign(s) {
  if (s.leased) return { ok: false, why: 'You already have the keys.' };
  if (!s.job) return { ok: false,
    why: 'The form wants an employer. Deliveries alone will not pass screening.' };
  if (s.shifts < STUBS_NEEDED) return { ok: false,
    why: `They want recent pay stubs — ${s.shifts} of ${STUBS_NEEDED} so far.` };
  const need = RENT * INCOME_MULTIPLE;
  if (monthlyIncome(s) < need) return { ok: false,
    why: `They want ${money(need)} a month coming in, ${INCOME_MULTIPLE}x the rent. ` +
         `Yours reads ${money(monthlyIncome(s))}.` };
  if (s.money < MOVE_IN_COST) return { ok: false,
    why: `${money(STUDIO_COST)} first and deposit, plus ${money(APP_FEE)} to run ` +
         `your credit. You have ${money(s.money)}.` };
  return { ok: true };
}

export function signLease(s) {
  const c = canSign(s);
  if (!c.ok) return c.why;
  s.money -= MOVE_IN_COST;
  s.leased = true;
  const up = s.sro;
  s.sro = false;                           // you give the room back
  s.rentDue = s.day + 30;
  return up ? 'You signed. Your own door, your own bathroom, your own window.'
            : 'You signed. One room, one window, and it is yours.';
}

/* ---- the residential hotel ---- */
export function canTakeRoom(s) {
  if (s.leased) return { ok: false, why: 'You have a lease. You are past this.' };
  if (s.sro) return { ok: false, why: 'You already have the room.' };
  if (s.money < SRO_MOVE_IN) return { ok: false,
    why: `${money(SRO_MOVE_IN)} for the first month and the deposit. ` +
         `You have ${money(s.money)}.` };
  return { ok: true };
}

export function takeRoom(s) {
  const c = canTakeRoom(s);
  if (!c.ok) return c.why;
  s.money -= SRO_MOVE_IN;
  s.sro = true;
  s.rentDue = s.day + 30;
  return 'A key on a loop of string. It is not much, and it is yours.';
}

/* Where you are sleeping tonight, and what it costs you a month. */
export const housed = s => s.leased || s.sro;
export const rentNow = s => s.leased ? RENT : s.sro ? SRO_RENT : 0;
export function buyCar(s) {
  if (s.money < CAR_COST) return `You need ${money(CAR_COST)}. You have ${money(s.money)}.`;
  s.money -= CAR_COST;
  s.car = true;
  return 'It is fifteen years old and it is yours. Parking is now your problem.';
}

/* ---------- setbacks ----------
   City things only. Never a person on the street. Each one costs money, time
   or energy — the three things the player is actually managing. */
const SETBACKS = [
  { id: 'waymo', text: 'A Waymo stops dead in the crosswalk and sits there. Nobody to honk at.',
    fx: s => { s.time += 9; } },
  { id: 'scooter', text: 'Somebody dumped a scooter across the whole sidewalk. You go around.',
    fx: s => { s.time += 5; } },
  { id: 'fog', text: 'The fog comes in so fast the far side of the street goes.',
    fx: s => { s.time += 7; s.energy = clamp(s.energy - 4); } },
  { id: 'muni', text: 'The 19 is twelve minutes away. Then sixteen. Then twelve.',
    fx: s => { s.time += 14; } },
  { id: 'wallet', text: 'You left your wallet on the counter. It is there when you get back. This time.',
    fx: s => { s.time += 18; } },
  { id: 'card', text: 'Card declined at the register. It goes through on the third try.',
    fx: s => { s.time += 4; } },
  { id: 'hill', text: 'You took the hill instead of going around. Your legs know it.',
    fx: s => { s.energy = clamp(s.energy - 11); } },
  { id: 'sweep', text: 'Street sweeping. The whole block is cones and nobody moved their car.',
    fx: s => { s.time += 6; } },
  { id: 'phone', text: 'Phone at four percent, and the route is still open.',
    fx: s => { s.time += 8; } },
  { id: 'rain', text: 'Rain, sideways, for ten minutes. Then sun, like nothing happened.',
    fx: s => { s.time += 10; s.energy = clamp(s.energy - 6); } },
];

export function maybeSetback(s, rng = Math.random) {
  if (rng() > 0.1) return null;
  const e = pick(rng, SETBACKS);
  e.fx(s);
  return e.text;
}

/* ---------- the day ---------- */
export function newGame(name) {
  return {
    name: (name || 'You').slice(0, 24),
    host: null,              // chosen at the door
    day: 1,
    time: DAY_START,
    money: START_CASH,
    earned: 0,
    energy: 82,
    runs: 0, shifts: 0,
    offers: [], run: null,
    resume: null, applied: [], job: null,
    sro: false, leased: false, car: false, rentDue: null,
    pref: null, friends: 0, partner: null, movedIn: false,
    nights: 0, dates: 0,
    log: [],
    over: null,
  };
}

/* What the end card says. Both endings are real endings: one is the city
   winning, one is you settling into it. */
export function ending(s) {
  if (s.over === 'done') {
    /* This used to read "your own lease, a car outside" no matter what you
       had. A player who spent the whole game in a room at the Alder and
       never cleared $4,200 was told, on the last screen, that they had both
       — which takes the one moment the game adds you up and makes it lie. */
    const have = [`${s.runs} deliveries`];
    if (s.job) have.push(`${s.job.role} at ${s.job.where}`);
    have.push(s.leased ? 'your own lease' : 'a room of your own at the Alder');
    if (s.car) have.push('a car outside');
    have.push(`${s.friends} people in this city who know your name`);
    const list = have.length > 1
      ? have.slice(0, -1).join(', ') + ', and ' + have[have.length - 1]
      : have[0];
    return {
      title: 'You are not new any more.',
      body: `${s.partner ? s.partner.name + ' moved in' : 'You moved in'} ` +
            `on day ${s.day}. ${list}.`,
      good: true,
    };
  }
  /* Naming the studio here was aiming at the wrong rung. The thing within
     reach of a month of deliveries was never the lease — it was the room. */
  return {
    title: 'You ran out of couch.',
    body: `Day ${s.day}. ${s.runs} deliveries and ${money(s.earned)} earned, ` +
          `but never the ${money(SRO_MOVE_IN)} for a room on Turk Street. ` +
          `${hostOf(s).name} gave you thirty days. The city gave you nothing.`,
    good: false,
  };
}

export function say(s, text, kind = '') {
  if (!text) return;
  s.log.unshift({ day: s.day, time: clock(s.time), text, kind });
  s.log.length = Math.min(s.log.length, 60);
}

/* Sleep ends the day wherever the player is standing. */
export function sleep(s, rng = Math.random) {
  if (s.run) { say(s, `You dropped the ${placeName(s.run.to)} run.`, 'bad'); s.run = null; }

  s.day += 1;
  s.time = DAY_START;
  /* A bed beats a couch, and your own bathroom beats a shared one. */
  s.energy = clamp(s.energy + (s.leased ? 42 : s.sro ? 37 : 34));
  s.offers = [];
  s.applied = [];                                       // a new day, ask again

  /* What the day took off you regardless. Not meals — those are the choice
     you make at a counter for energy — but the things nobody opts out of:
     the phone bill spread thin, Muni, laundry, a coffee to sit somewhere
     warm. Without this you could stand still in San Francisco for a month
     and lose nothing, which is the one thing this city never lets you do. */
  const living = 14 + Math.floor(rng() * 9);
  s.money -= living;
  say(s, `Phone, Muni, laundry. ${money(living)} gone on nothing you can point at.`, '');

  if (housed(s) && s.rentDue && s.day >= s.rentDue) {
    const due = rentNow(s);
    s.money -= due;
    s.rentDue = s.day + 30;
    say(s, `Rent. ${money(due)}. It comes every month now.`, 'bad');
  }

  if (!housed(s) && s.day > COUCH_DAYS) {
    s.over = 'couch';
    say(s, `${hostOf(s).name} needs the couch back. Thirty days was the deal, ` +
           `and it was a favour.`, 'bad');
  }
  return s;
}

/* Called every tick by the UI. Advances the clock and closes the day out. */
export function tick(s, seconds, rng = Math.random) {
  if (s.over) return s;
  s.time += seconds * MIN_PER_SEC;
  if (s.time >= DAY_END) { say(s, 'That is the day.', ''); sleep(s, rng); }
  return s;
}

export function walked(s, dist, rng = Math.random) {
  s.energy = clamp(s.energy - dist * 0.004);
  if (s.energy <= 0) {
    s.energy = 18;
    s.time += 50;
    say(s, 'You had to sit down for an hour. You are not eating enough.', 'bad');
  }
}

/* The line the player posts. It is the only piece of writing in here that
   has to work outside the game, in a feed, next to somebody's lunch — so it
   reads as a sentence a person would type rather than a row of stats with a
   full stop stranded in the middle of it, which is what joining on " · "
   produced. It also never claimed the room: an Alder player's run came out
   as deliveries and a cash figure and nothing about where they lived. */
export function shareText(s) {
  const bits = [];
  if (s.runs) bits.push(`${s.runs} deliveries`);
  if (s.job) bits.push(`${s.job.role.toLowerCase()} at ${s.job.where}`);
  bits.push(s.leased ? 'my own lease'
    : s.sro ? 'a room at the Alder' : 'still on the couch');
  if (s.car) bits.push('a car outside');
  if (s.partner) bits.push(`and ${s.partner.name}`);
  const last = bits.pop();
  const list = bits.length
    ? `${bits.join(', ')}${last.startsWith('and ') ? ' ' : ' and '}${last}`
    : last;
  return `Day ${s.day} in San Francisco: ${list}.`;
}
