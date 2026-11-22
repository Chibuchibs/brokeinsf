/* THE CITY — every street the player can walk and every door they can open.
   A compressed San Francisco, not a literal one: Lombard's crooked block really
   sits two miles north of the Tenderloin, and here it is a few minutes' walk.
   The streets that carry the game are the ones a local would name on sight —
   Van Ness, Market, Sixth, Seventh, Lombard — so their SHAPES have to be right
   even where the distances are not. Market cuts the city on a diagonal, Sixth
   and Seventh fall away from it to the southeast, and Lombard kinks through
   eight switchbacks. Get those wrong and the map stops being San Francisco. */

/* World is 1040 x 1340. North is up. */
/* The extra ninety pixels at the bottom are not city — they are the margin
   the map's own key is printed in, the way a paper map carries its legend
   below the frame. Nothing is built down there: no street reaches it and
   the block generator only ever lays buildings against a street. */
export const WORLD = { w: 1040, h: 1435 };

/* A switchback block, drawn the way it looks from above: the road leaves the
   straight line, crosses it, and crosses back, eight times in one block. */
function crooked(x0, x1, y, amp = 34, turns = 8) {
  const pts = [];
  for (let i = 0; i <= turns; i++) {
    const t = i / turns;
    pts.push([x0 + (x1 - x0) * t, y + (i % 2 ? amp : -amp)]);
  }
  return pts;
}

/* kind drives width and colour: 'arterial' is six lanes, 'street' is two,
   'crooked' is the one everybody photographs. */
export const STREETS = [
  { name: 'Lombard St', kind: 'street', pts: [[120, 120], [380, 120]] },
  { name: 'Lombard St', kind: 'crooked', label: false,
    pts: crooked(380, 580, 120) },
  { name: 'Lombard St', kind: 'street', label: false, pts: [[580, 120], [960, 120]] },

  { name: 'Hyde St', kind: 'street', pts: [[560, 120], [560, 640]] },
  { name: 'Polk St', kind: 'street', pts: [[320, 200], [320, 1060]] },

  { name: 'Van Ness Ave', kind: 'arterial', pts: [[200, 80], [200, 1210]] },
  /* One block west, so the edge of the map is a city block and not a margin. */
  { name: 'Franklin St', kind: 'street', pts: [[92, 190], [92, 1160]] },

  /* The Tenderloin proper: a tight grid between Van Ness and Taylor. */
  { name: 'Geary St', kind: 'street', pts: [[200, 640], [900, 640]] },
  { name: "O'Farrell St", kind: 'street', pts: [[200, 720], [900, 720]] },
  { name: 'Ellis St', kind: 'street', pts: [[200, 800], [900, 800]] },
  { name: 'Eddy St', kind: 'street', pts: [[200, 880], [860, 880]] },
  { name: 'Turk St', kind: 'street', pts: [[200, 960], [820, 960]] },
  { name: 'Golden Gate Ave', kind: 'street', pts: [[200, 1040], [760, 1040]] },

  { name: 'Larkin St', kind: 'street', pts: [[440, 600], [440, 1070]] },
  { name: 'Hyde St', kind: 'street', label: false, pts: [[560, 600], [560, 1040]] },
  { name: 'Leavenworth St', kind: 'street', pts: [[680, 600], [680, 1010]] },
  { name: 'Jones St', kind: 'street', pts: [[800, 600], [800, 975]] },
  { name: 'Taylor St', kind: 'street', pts: [[900, 600], [900, 900]] },

  /* ---- between the crooked block and the Tenderloin ----
     Everything above Geary used to be blank paper with a zigzag floating in
     it: three streets in five hundred pixels, nothing to line with buildings,
     and a long walk up to Lombard across nothing at all. These are the ones
     a local names going north — Sutter, Pine, California with the cable car
     on it, Jackson, Broadway — and the north-south streets simply carry on
     the way they do in life instead of stopping at Geary. */
  { name: 'Sutter St', kind: 'street', pts: [[200, 555], [940, 555]] },
  { name: 'Pine St', kind: 'street', pts: [[200, 470], [940, 470]] },
  { name: 'California St', kind: 'street', pts: [[200, 380], [940, 380]] },
  { name: 'Jackson St', kind: 'street', pts: [[200, 300], [900, 300]] },
  { name: 'Broadway', kind: 'street', pts: [[200, 220], [860, 220]] },

  { name: 'Larkin St', kind: 'street', label: false, pts: [[440, 240], [440, 600]] },
  { name: 'Leavenworth St', kind: 'street', label: false, pts: [[680, 240], [680, 600]] },
  { name: 'Jones St', kind: 'street', label: false, pts: [[800, 250], [800, 600]] },
  { name: 'Taylor St', kind: 'street', label: false, pts: [[900, 300], [900, 600]] },
  { name: 'Mason St', kind: 'street', pts: [[985, 330], [985, 905]] },

  /* Market cuts everything on the diagonal. Nothing in the city lines up with
     it, which is exactly why it reads as San Francisco from above. */
  { name: 'Market St', kind: 'arterial', pts: [[150, 1210], [1000, 840]] },

  /* South of Market the numbered streets fall away at their own angle. */
  { name: '7th St', kind: 'street', pts: [[415, 1095], [600, 1330]] },
  { name: '6th St', kind: 'street', pts: [[610, 1010], [790, 1270]] },

  /* South of Market runs in parallel with it, one block down. Without this
     the whole bottom-right corner of the map was empty. */
  { name: 'Mission St', kind: 'street', pts: [[240, 1290], [1010, 955]] },
];

/* ---------- places ----------
   kind: couch | food | store | work | landmark | apartment
   Each sits at a point on the map; the door is the nearest walkable spot, so
   a place is reached by standing on the street outside it, never by entering
   a separate screen. Nothing in this game takes the player off the street. */
export const PLACES = [
  { id: 'couch', icon: '🛋️', kind: 'couch', name: "Dre's apartment",
    at: [705, 845], blurb: "Your friend's couch. Two weeks, he said." },

  { id: 'pho', icon: '🍜', kind: 'food', name: 'Phở Hòa Bình', at: [462, 745],
    cost: 11, energy: 38, blurb: 'Larkin Street. The big bowl is eleven dollars.' },
  { id: 'taqueria', icon: '🌯', kind: 'food', name: 'La Esquina', at: [585, 905],
    cost: 9, energy: 32, blurb: 'Burrito the size of your forearm.' },
  { id: 'cart', icon: '☕', kind: 'food', name: 'Coffee cart', at: [222, 1015],
    cost: 4, energy: 14, blurb: 'Outside City Hall. Cash only, and he knows it.' },

  /* Sells food too, badly and cheaply — the thing you eat when there is no
     time and no money, which is most days. */
  { id: 'corner', icon: '🏪', kind: 'store', name: 'Hyde St Market', at: [582, 862],
    cost: 6, energy: 16,
    blurb: 'Corner store. Everything, marked up. The sandwiches are a gamble.' },
  { id: 'laundry', icon: '👕', kind: 'store', name: 'Wash & Fold', at: [778, 785],
    blurb: 'Jones Street. Four dollars a load.' },

  { id: 'cityhall', icon: '🏛️', kind: 'landmark', name: 'City Hall', at: [160, 1040],
    blurb: 'The dome. You can see it from most of Van Ness.' },
  /* A venue, not a monument. It was typed as a landmark, so the one line
     that told you where to go of an evening — "The Owl, the park, the
     Warfield" — named a building you could not go into. */
  { id: 'theatre', icon: '🎭', kind: 'night', name: 'The Warfield', at: [690, 975],
    cost: 38, opens: 18, meet: 0.78, lift: 38,
    blurb: 'Market Street. Doors at eight, and the floor is always full.' },
  { id: 'crook', icon: '🌀', kind: 'landmark', name: 'The crooked block', at: [480, 155],
    blurb: 'Tourists, eight switchbacks, and a queue of cars all day.' },

  /* The ones you would point at from a hill. Each `at` is the FOOT of the
     thing, not its middle: once they stood up, a pin on the centre sat
     squarely over the tower it was labelling and hid it completely. None of them does anything —
     they are here because a city you are walking across for fifty days
     should have things in it you recognise before you can afford them, and
     because the quarters north and east of the Tenderloin had nothing in
     them at all. Each sits roughly where a local would point: Telegraph
     Hill to the north-east, the Financial District east of it, the Ferry
     Building at the foot of Market, Union Square off Geary. */
  { id: 'coit', icon: '🗼', kind: 'landmark', name: 'Coit Tower', at: [946, 178],
    blurb: 'Telegraph Hill. The queue for the lift goes down the steps.' },
  { id: 'pyramid', icon: '🔺', kind: 'landmark', name: 'Transamerica Pyramid', at: [942, 371],
    blurb: 'You can line yourself up with it from half the city and still get lost.' },
  { id: 'ferry', icon: '⛴️', kind: 'landmark', name: 'Ferry Building', at: [943, 818],
    blurb: 'The foot of Market. The clock is right. The farmers market is not cheap.' },
  { id: 'union', icon: '🛍️', kind: 'landmark', name: 'Union Square', at: [943, 620],
    blurb: 'Shops you cannot afford yet, and somebody playing a bucket drum.' },
  { id: 'lookout', icon: '🌉', kind: 'landmark', name: 'Russian Hill lookout', at: [342, 86],
    blurb: 'On a clear day the bridge is right there. Most days the fog has it.' },
  { id: 'cable', icon: '🚋', kind: 'landmark', name: 'Cable car stop', at: [546, 360],
    blurb: 'Hyde and California, where the two lines cross. It is faster to walk.' },

  /* Places that are hiring. `needs` is matched against the resume. */
  { id: 'cafe', icon: '🥐', kind: 'work', name: 'Blue Window Coffee', at: [338, 690],
    role: 'Barista', pay: 23, needs: ['service', 'food', 'retail'],
    blurb: 'Polk Street. A card in the window: HIRING.' },
  { id: 'grocery', icon: '🛒', kind: 'work', name: 'Van Ness Market', at: [222, 760],
    role: 'Stock clerk', pay: 21, needs: ['retail', 'warehouse'],
    blurb: 'Nights and early mornings.' },
  { id: 'hotel', icon: '🏨', kind: 'work', name: 'Hotel Clarendon', at: [860, 660],
    role: 'Front desk', pay: 26, needs: ['service', 'admin'],
    blurb: 'Geary Street. They want someone who can hold a conversation.' },
  { id: 'office', icon: '🏢', kind: 'work', name: 'Sutter & Chen', at: [905, 880],
    role: 'Office assistant', pay: 31, needs: ['admin', 'office', 'tech'],
    blurb: 'Market Street, fourth floor. A real desk.' },
  { id: 'warehouse', icon: '📦', kind: 'work', name: 'Sixth St Depot', at: [700, 1105],
    role: 'Picker', pay: 24, needs: ['warehouse', 'driving'],
    blurb: 'South of Market. They are always short.' },

  /* Where you go once you have a life to go out into. These only matter in the
     last stretch of the game, but they sit on the map from day one so the
     player walks past them for fifty days first. */
  /* `opens` is the hour it is worth turning up, `meet` the chance the
     evening comes to something, `lift` how far it moves things along once
     there is somebody. The three have to differ or there is no choice in
     any of it: the park was free and worked exactly as well as the bar, so
     paying nineteen dollars was never once the right call. Now the park is
     the daytime, free, slow option you take when you are broke, and the
     Warfield is the big night you save up for. */
  { id: 'bar', icon: '🍸', kind: 'night', name: 'The Owl', at: [338, 905],
    cost: 19, opens: 17, meet: 0.62, lift: 26,
    blurb: 'Polk Street. Dark, loud, and everyone is a regular.' },
  { id: 'park', icon: '🌳', kind: 'night', name: 'Boeddeker Park', at: [795, 862],
    cost: 0, opens: 7, meet: 0.44, lift: 18,
    blurb: 'Eddy and Jones. Somebody is always playing something.' },

  /* A residential hotel — the rung almost everybody in this city actually
     stands on before a lease, and the one the ladder was missing. Cash and
     a handshake, no income check, bathroom down the hall. */
  { id: 'sro', icon: '🛏️', kind: 'room', name: 'Hotel Alder', at: [520, 975],
    blurb: 'A residential hotel on Turk. One room with a lock on the door, a bed, ' +
           'a sink and a window. The bathroom and the kitchen are shared with the floor.' },

  { id: 'studio', icon: '🔑', kind: 'apartment', name: 'Studio on Larkin', at: [418, 850],
    blurb: 'One room with its own bathroom and its own kitchen. A door nobody ' +
           'else has a key to.' },
];
