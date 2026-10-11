/* Curated, hand-maintainable trip data. Live data (waits, hours, status) comes from ThemeParks.wiki.
   Edit this file to change the priority list, tips, Disney Springs picks or Skyliner notes. */
window.WDW_DATA = {
  trip: {
    start: '2026-10-29',
    end: '2026-11-05',
    adults: 2,
    hotel: 'Westgate Lakes Resort & Spa (off-site)',
    tz: 'America/New_York',
    notes: [
      'Clocks fall back one hour on Sunday, Nov 1, 2026 (daylight saving ends). Phone clocks update on their own; paper plans and alarms may not.',
      'Mickey\u2019s Not-So-Scary Halloween Party and Christmas party dates vary by year. Any ticketed event on your dates shows up in the park hours cards.'
    ]
  },

  parks: [
    { key: 'mk',    name: 'Magic Kingdom',     short: 'MK',    color: '#2563eb', fallbackId: '75ea578a-adc8-4116-a54d-dccb60765ef9', match: /magic kingdom/i },
    { key: 'epcot', name: 'EPCOT',             short: 'EPCOT', color: '#7c3aed', fallbackId: '47f90d2c-e191-4239-a466-5892ef59a88b', match: /epcot/i },
    { key: 'hs',    name: 'Hollywood Studios', short: 'HS',    color: '#dc2626', fallbackId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8', match: /hollywood studios/i },
    { key: 'ak',    name: 'Animal Kingdom',    short: 'AK',    color: '#15803d', fallbackId: '1c84a229-8862-4648-9c71-378ddd2c7693', match: /animal kingdom/i }
  ],

  /* Always-highlighted list. `re` is matched against ThemeParks.wiki entity names. */
  priority: [
    { id: 'peter-pan',   label: 'Peter Pan\u2019s Flight',                 park: 'mk',    type: 'ATTRACTION', re: /peter pan/i,
      tip: 'Famous for long midday lines. Rope drop, parade time, or the last hour are usually kindest.' },
    { id: 'tron',        label: 'TRON Lightcycle / Run',                  park: 'mk',    type: 'ATTRACTION', re: /tron/i,
      tip: 'One of the park\u2019s highest-demand rides. Early morning or late evening checks pay off.' },
    { id: 'peoplemover', label: 'PeopleMover',                            park: 'mk',    type: 'ATTRACTION', re: /peoplemover|transit authority/i,
      tip: 'Low-effort, air-conditioned tour of Tomorrowland. Great when you need a breather.' },
    { id: 'cosmic',      label: 'Guardians of the Galaxy: Cosmic Rewind', park: 'epcot', type: 'ATTRACTION', re: /cosmic rewind|guardians of the galaxy/i,
      tip: 'EPCOT\u2019s headliner. Aim for rope drop or evening, and set an alert for dips.' },
    { id: 'land',        label: 'Living with the Land',                   park: 'epcot', type: 'ATTRACTION', re: /living with the land/i,
      tip: 'Usually a short wait and a calm boat ride. Good midday reset.' },
    { id: 'moana',       label: 'Moana: Journey of Water',                park: 'epcot', type: 'ATTRACTION', re: /journey of water|moana/i,
      tip: 'Walk-through water trail. Lovely early, and glowing after dark. Expect a splash or two.' },
    { id: 'safari',      label: 'Kilimanjaro Safaris',                    park: 'ak',    type: 'ATTRACTION', re: /kilimanjaro/i,
      tip: 'Animals tend to be most active in the cooler morning hours.' },
    { id: 'fop',         label: 'Avatar Flight of Passage',               park: 'ak',    type: 'ATTRACTION', re: /flight of passage/i,
      tip: 'Typically the longest line in the park. Rope drop or the final hour.' },
    { id: 'everest',     label: 'Expedition Everest',                     park: 'ak',    type: 'ATTRACTION', re: /expedition everest/i,
      tip: 'Check the single-rider line if posted; it can save a lot of time.' },
    { id: 'yak',         label: 'Yak & Yeti Restaurant',                  park: 'ak',    type: 'RESTAURANT', re: /yak\s*(&|and)\s*yeti(?!.*(local|cafe|caf\u00e9))/i,
      tip: 'Table-service pan-Asian dining in Asia. Reservations are best; watch for walk-up openings at off-peak times.' }
  ],

  /* Other major headliners to surface in search and the Favorites tab. */
  headliners: [
    { label: 'Seven Dwarfs Mine Train', park: 'mk',    re: /seven dwarfs/i },
    { label: 'Space Mountain',          park: 'mk',    re: /space mountain/i },
    { label: 'Big Thunder Mountain',    park: 'mk',    re: /big thunder/i },
    { label: 'Tiana\u2019s Bayou Adventure', park: 'mk', re: /tiana/i },
    { label: 'Haunted Mansion',         park: 'mk',    re: /haunted mansion/i },
    { label: 'Test Track',              park: 'epcot', re: /test track/i },
    { label: 'Remy\u2019s Ratatouille Adventure', park: 'epcot', re: /ratatouille/i },
    { label: 'Frozen Ever After',       park: 'epcot', re: /frozen ever after/i },
    { label: 'Soarin\u2019 Around the World', park: 'epcot', re: /soarin/i },
    { label: 'Star Wars: Rise of the Resistance', park: 'hs', re: /rise of the resistance/i },
    { label: 'Slinky Dog Dash',         park: 'hs',    re: /slinky dog/i },
    { label: 'Mickey & Minnie\u2019s Runaway Railway', park: 'hs', re: /runaway railway/i },
    { label: 'Tower of Terror',         park: 'hs',    re: /tower of terror/i },
    { label: 'Rock \u2019n\u2019 Roller Coaster', park: 'hs', re: /rock\s*.?n.?\s*roller/i },
    { label: 'Millennium Falcon: Smugglers Run', park: 'hs', re: /smugglers run/i },
    { label: 'Na\u2019vi River Journey', park: 'ak',    re: /na.?vi river/i },
    { label: 'DINOSAUR',                park: 'ak',    re: /dinosaur/i }
  ],

  /* Merchandise checklist. Locations change, so notes are deliberately general. */
  collectibles: [
    { id: 'baymax',   label: 'Baymax popcorn holder',        note: 'Popcorn-holder availability moves between carts and parks. Ask a Cast Member at popcorn carts, and check Disney Food Blog or WDWNT for current sightings.' },
    { id: 'monsters', label: 'Monsters, Inc. popcorn holder', note: 'Same advice: availability rotates. Early in the day is safer for sought-after holders.' }
  ],

  skyliner: {
    stations: [
      { id: 'hs',    name: 'Hollywood Studios',            kind: 'park',   x: 90,  y: 70,  note: 'Station sits near the Chinese Theatre end of the park entrance.' },
      { id: 'cb',    name: 'Caribbean Beach (hub)',        kind: 'hub',    x: 330, y: 215, note: 'The transfer point. All three lines meet here.' },
      { id: 'pop',   name: 'Pop Century / Art of Animation', kind: 'resort', x: 330, y: 345, note: 'One shared station for both resorts.' },
      { id: 'riv',   name: 'Riviera Resort',               kind: 'resort', x: 520, y: 215, note: 'Between Caribbean Beach and EPCOT.' },
      { id: 'epcot', name: 'EPCOT International Gateway',  kind: 'park',   x: 690, y: 110, note: 'The back entrance, by Boardwalk and Beach Club.' }
    ],
    legs: [
      { from: 'hs',  to: 'cb',    mins: '6\u20138',  line: 'Hollywood Studios line' },
      { from: 'pop', to: 'cb',    mins: '6\u20138',  line: 'Pop Century / Art of Animation line' },
      { from: 'cb',  to: 'riv',   mins: '5\u20137',  line: 'EPCOT line' },
      { from: 'riv', to: 'epcot', mins: '6\u20138',  line: 'EPCOT line' }
    ],
    routes: [
      { name: 'Hollywood Studios \u2194 EPCOT International Gateway', steps: 'Board at Hollywood Studios, ride to Caribbean Beach, step across the platform to the EPCOT line, ride through Riviera to EPCOT.', time: 'about 25\u201335 min with the transfer and a short wait' },
      { name: 'Hollywood Studios \u2194 Caribbean Beach', steps: 'One cabin, no transfer.', time: 'about 6\u20138 min' },
      { name: 'EPCOT \u2194 Caribbean Beach', steps: 'EPCOT Int\u2019l Gateway to Riviera, then on to Caribbean Beach. Same line, no transfer.', time: 'about 12\u201315 min' },
      { name: 'Pop Century / Art of Animation \u2194 any park', steps: 'Ride to Caribbean Beach and transfer to the line you need.', time: 'about 30\u201340 min to either park with the transfer' }
    ],
    tips: [
      'Times are rough estimates. Waits to board vary with crowds, and cabins are shared with other parties in the middle of the day.',
      'You\u2019re staying off-site. Park-ticket holders can generally ride between the park stations (HS \u2194 EPCOT is the useful one), but the resort stations are for resort guests. Confirm current rules on Disney\u2019s Skyliner page or at the station before you plan around it.',
      'The EPCOT International Gateway entrance is a handy back door: walk or boat to the World Showcase side, skipping the main-entrance crowds.',
      'The Skyliner pauses for lightning and strong wind. Keep a bus or rideshare backup plan for park exits in stormy weather.',
      'Operating hours follow the parks, starting a bit before opening and running a bit past closing. Check the My Disney Experience app on the day.',
      'Accessible cabins are available, and strollers and wheelchairs fold or roll on with staff help. Ask a Cast Member at the platform.'
    ],
    links: [
      { label: 'Disney Skyliner overview (official)', url: 'https://disneyworld.disney.go.com/transportation/skyliner/' }
    ]
  },

  festival: {
    heading: 'EPCOT International Food & Wine Festival',
    caution: 'Festival dates and booth menus change every year. Confirm the 2026 run dates and menus on Disney\u2019s site and in the My Disney Experience app before relying on any item below.',
    tips: [
      'Go booth-hopping outside the lunch and dinner rush. Late morning and mid-afternoon lines are usually shorter than 6 to 8 p.m.',
      'Split everything. A few small plates between two adults beats one big plate each, and lets you taste more booths.',
      'Pick two or three \u201cmust try\u201d booths first, then wander. Booths that sell out of a popular item are the biggest letdown late in the day.',
      'Do the World Showcase loop in one direction and eat as you go. Doubling back through crowds is where time disappears.',
      'Weekends and evenings are busiest. If you have a weekday EPCOT day, make that your festival day.',
      'Look at the sealed-lid and cup options for drinks: carrying a few small samples in a bag makes the walk to the next booth easier.',
      'Check the festival\u2019s Disney-posted menus the night before so you can plan, then adjust to real lines.'
    ],
    // Recurring crowd-pleasers in past years. Treat as ideas, not a 2026 menu.
    ideas: [
      'Canada: cheddar cheese soup is a long-running favorite',
      'Brazil: p\u00e3o de queijo cheese bread',
      'Belgium: waffles',
      'Look for each country\u2019s \u201csignature\u201d item first'
    ],
    links: [
      { label: 'Disney Food Blog: festival guides', url: 'https://www.disneyfoodblog.com/?s=food+and+wine+festival' },
      { label: 'DFB Guide on YouTube: EPCOT festival', url: 'https://www.youtube.com/results?search_query=DFB+Guide+EPCOT+Food+and+Wine+Festival' }
    ],
    re: /food\s*(&|and)\s*wine|festival|booth|marketplace/i
  },

  parkTips: {
    mk: ['Tomorrowland is a good late-day stretch: TRON and the PeopleMover are right next to each other.', 'Peter Pan\u2019s Flight is the classic \u201cwaits drop during parades and fireworks\u201d candidate.'],
    epcot: ['Cosmic Rewind and Moana: Journey of Water make a good evening pair; the water trail is prettiest after dark.', 'Living with the Land is a cool, quiet break in the middle of the day.'],
    hs: ['Hollywood Studios lines grow quickly after opening. Hit your must-do ride first.', 'The Skyliner link to EPCOT makes a park-hop easy.'],
    ak: ['Do the animal experiences early, when it is cooler and the animals are active.', 'Pandora and Asia are close together: Flight of Passage, then Everest, then lunch at Yak & Yeti is a natural sequence.']
  },

  springs: {
    blurb: 'Disney Springs is open-air shopping, dining, and entertainment. It isn\u2019t a ticketed park, so live wait data isn\u2019t published. Hours and offerings below are starting points; confirm on the day.',
    facts: [
      'Parking in the Disney Springs garages has historically been free. Confirm for your dates.',
      'It\u2019s a good low-key evening after a long park day, or a rest-day plan.',
      'Table-service dining books up. Use the official dining page to check for openings.'
    ],
    shopping: ['World of Disney', 'LEGO Store', 'Marketplace Co-Op', 'Disney\u2019s Days of Christmas'],
    links: [
      { label: 'Disney Springs official page', url: 'https://disneyworld.disney.go.com/destinations/disney-springs/' },
      { label: 'Disney Springs dining', url: 'https://disneyworld.disney.go.com/dining/disney-springs/' }
    ]
  },

  dealLinks: [
    { label: 'Walt Disney World special offers (official)', url: 'https://disneyworld.disney.go.com/special-offers/' },
    { label: 'MouseSavers: discount roundup', url: 'https://www.mousesavers.com/' },
    { label: 'Undercover Tourist: tickets', url: 'https://www.undercovertourist.com/' },
    { label: 'Get Away Today: tickets', url: 'https://www.getawaytoday.com/' }
  ],

  /* Dropdown choices on the Travel Sync tab. */
  topics: [
    { id: 'general',      label: 'General trip sync' },
    { id: 'hotel',        label: 'Hotel (Westgate Lakes)' },
    { id: 'flights',      label: 'Flights' },
    { id: 'car',          label: 'Car rental' },
    { id: 'shuttle',      label: 'Shuttles / transport to parks' },
    { id: 'reservations', label: 'Dining & park reservations' },
    { id: 'tickets',      label: 'Tickets & deals' }
  ],
  quickAsks: [
    'Confirm my Westgate Lakes check-in and check-out details.',
    'What\u2019s the best way to get from Westgate Lakes to each park?',
    'Is anything missing from my flight and rental car plans?',
    'Which dining reservations should I book first?',
    'Any ticket discounts available for my dates?'
  ]
};

/* Map areas (centres + search radius in metres) and place categories for the park map. */
window.WDW_DATA.areas = [
  { key: 'mk',     name: 'Magic Kingdom',     lat: 28.4177, lon: -81.5812, r: 1500, color: '#2563eb' },
  { key: 'epcot',  name: 'EPCOT',             lat: 28.3747, lon: -81.5494, r: 1600, color: '#7c3aed' },
  { key: 'hs',     name: 'Hollywood Studios', lat: 28.3575, lon: -81.5583, r: 1100, color: '#dc2626' },
  { key: 'ak',     name: 'Animal Kingdom',    lat: 28.3553, lon: -81.5901, r: 1700, color: '#15803d' },
  { key: 'springs', name: 'Disney Springs',   lat: 28.3705, lon: -81.5206, r: 1300, color: '#d97706' }
];
window.WDW_DATA.poiCats = [
  { k: 'must',     label: 'Must-dos',          icon: '\u2B50' },
  { k: 'ride',     label: 'Rides & attractions',           icon: '\uD83C\uDFA2' },
  { k: 'show',     label: 'Shows',             icon: '\uD83C\uDFAD' },
  { k: 'dining',   label: 'Dining & snacks', icon: '\uD83C\uDF74' },
  { k: 'restroom', label: 'Restrooms',         icon: '\uD83D\uDEBB' },
  { k: 'firstaid', label: 'First aid',         icon: '\u26D1\uFE0F' },
  { k: 'guest',    label: 'Guest services',    icon: '\u2139\uFE0F' },
  { k: 'baby',     label: 'Baby care',         icon: '\uD83C\uDF7C' },
  { k: 'shop',     label: 'Shops & kiosks', icon: '\uD83D\uDECD\uFE0F' },
  { k: 'entrance', label: 'Entrances / exits', icon: '\uD83D\uDEAA' },
  { k: 'skyliner', label: 'Skyliner',          icon: '\uD83D\uDEA1' },
  { k: 'monorail', label: 'Monorail',          icon: '\uD83D\uDE9D' },
  { k: 'bus',      label: 'Bus stops',         icon: '\uD83D\uDE8C' },
  { k: 'parking',  label: 'Parking',           icon: '\uD83C\uDD7F\uFE0F' }
];

/* Search box around the whole Walt Disney World property (south, west, north, east) for shops, kiosks, dining, rides and resorts. */
window.WDW_DATA.bbox = [28.33, -81.63, 28.44, -81.49];

/* Monorail guide. Times are rough estimates; confirm hours and boarding rules on the day. */
window.WDW_DATA.monorail = {
  lines: [
    { name: 'Magic Kingdom Express', color: '#2563eb', stops: 'Transportation and Ticket Center (TTC) \u2194 Magic Kingdom', mins: 'about 5\u201310 min', note: 'Non-stop. The main way between the TTC parking lot and the park.' },
    { name: 'Resort monorail', color: '#d97706', stops: 'Magic Kingdom, Contemporary, Polynesian, Grand Floridian, and the TTC', mins: 'slower, with several stops', note: 'Loops through the three monorail resorts. Direction of travel is posted at each station.' },
    { name: 'EPCOT monorail', color: '#7c3aed', stops: 'TTC \u2194 EPCOT (main entrance)', mins: 'about 8\u201310 min', note: 'The only monorail link between EPCOT and the TTC.' }
  ],
  stations: [
    { name: 'Transportation and Ticket Center (TTC)', note: 'Hub for all three lines and the Magic Kingdom parking lot. Ferries to Magic Kingdom also leave from here.', q: 'Transportation and Ticket Center Walt Disney World' },
    { name: 'Magic Kingdom', note: 'Station is at the park entrance, beside the ferry dock.', q: 'Magic Kingdom monorail station' },
    { name: 'EPCOT', note: 'Station is at the main entrance.', q: 'EPCOT monorail station' },
    { name: 'Contemporary Resort', note: 'Resort loop. Walkway to Magic Kingdom.', q: 'Contemporary Resort monorail station' },
    { name: 'Polynesian Village Resort', note: 'Resort loop.', q: 'Polynesian Village Resort monorail station' },
    { name: 'Grand Floridian Resort & Spa', note: 'Resort loop.', q: 'Grand Floridian monorail station' }
  ],
  routes: [
    { name: 'Driving to Magic Kingdom', steps: 'Park at the TTC, then take the Express monorail or a ferry across the lagoon to the park.', time: 'allow extra time at opening and closing' },
    { name: 'EPCOT \u2194 Magic Kingdom', steps: 'Ride the EPCOT monorail to the TTC, then switch to the Express monorail (or a ferry) to Magic Kingdom.', time: 'roughly 30\u201345 min with the transfer and waits' },
    { name: 'Magic Kingdom \u2192 Contemporary', steps: 'Take the resort monorail, or walk the path from the park.', time: 'a short ride or walk' }
  ],
  tips: [
    'You\u2019re staying off-site, so the TTC is the stop that matters most: it\u2019s where you park for Magic Kingdom and where you switch to or from the EPCOT line.',
    'The ferries from the TTC are a good backup when a monorail line is crowded or paused. They\u2019re slower but roomy.',
    'The Contemporary, Polynesian and Grand Floridian stops are mainly for resort guests and diners. A park ticket generally covers the TTC, Magic Kingdom and EPCOT stations, but confirm current rules at the station.',
    'Monorails can pause for severe weather. Keep a plan B, like the ferry or a rideshare.',
    'At closing time, everyone heads for the Express monorail at once. Waiting 20 to 30 minutes after fireworks, or taking the ferry, can be calmer.',
    'Rideshare and taxi pickup spots differ by park and can change. Follow the pin in your rideshare app and look for signs, or ask a Cast Member. Use the map buttons above to see parking and entrances.',
    'Times in this section are rough estimates. Boarding waits vary.'
  ],
  links: [
    { label: 'Walt Disney World transportation (official)', url: 'https://disneyworld.disney.go.com/transportation/' }
  ]
};

/* Restaurants that ThemeParks.wiki may not list as "live". The app shows these only when they are
   NOT already in the live feed or the map directory, so duplicates never appear.
   Add or remove names freely: { name, type, note }. Always confirm hours and availability. */
window.WDW_DATA.extraDining = {
  springs: [
    { name: 'Raglan Road Irish Pub and Restaurant', type: 'Table service', note: 'Irish pub fare with live music' },
    { name: 'Amorette\u2019s Patisserie', type: 'Dessert', note: 'Pastries and sweets' },
    { name: 'T-REX Cafe', type: 'Table service', note: 'Dinosaur-themed, great for photos' },
    { name: 'Morimoto Asia', type: 'Table service', note: 'Pan-Asian, good for a special night' },
    { name: 'Wine Bar George', type: 'Table service', note: 'Casual, wine-focused' },
    { name: 'Chef Art Smith\u2019s Homecomin\u2019', type: 'Table service', note: 'Southern comfort food' },
    { name: 'Jaleo by Jos\u00e9 Andr\u00e9s', type: 'Table service', note: 'Spanish tapas' },
    { name: 'The Boathouse', type: 'Table service', note: 'Waterfront seafood and steaks' },
    { name: 'Wolfgang Puck Bar & Grill', type: 'Table service', note: 'American' },
    { name: 'Frontera Cocina', type: 'Table service', note: 'Mexican' },
    { name: 'The Edison', type: 'Table service', note: 'Cocktails and live entertainment' },
    { name: 'Paddlefish', type: 'Table service', note: 'Seafood on a riverboat' },
    { name: 'Planet Hollywood Observatory', type: 'Table service', note: 'American' },
    { name: 'Terralina Crafted Italian', type: 'Table service', note: 'Italian' },
    { name: 'Maria & Enzo\u2019s Ristorante', type: 'Table service', note: 'Italian' },
    { name: 'STK Orlando', type: 'Table service', note: 'Steakhouse' },
    { name: 'Din Tai Fung', type: 'Table service', note: 'Dumplings' },
    { name: 'Gideon\u2019s Bakehouse', type: 'Dessert', note: 'Oversized cookies and long lines. Go early.' },
    { name: 'Blaze Pizza', type: 'Quick service', note: 'Build-your-own pizza' },
    { name: 'Earl of Sandwich', type: 'Quick service', note: 'Sandwiches' }
  ],
  epcot: [
    { name: 'Space 220 Restaurant', type: 'Table service', note: 'Space-station dining experience. Reservations recommended.' },
    { name: 'Le Cellier Steakhouse', type: 'Table service', note: 'Canada Pavilion' },
    { name: 'Via Napoli Ristorante e Pizzeria', type: 'Table service', note: 'Italy Pavilion' },
    { name: 'Biergarten Restaurant', type: 'Table service', note: 'Germany Pavilion, buffet' },
    { name: 'Akershus Royal Banquet Hall', type: 'Table service', note: 'Norway Pavilion' },
    { name: 'San Angel Inn Restaurante', type: 'Table service', note: 'Mexico Pavilion' },
    { name: 'Teppan Edo', type: 'Table service', note: 'Japan Pavilion' },
    { name: 'Spice Road Table', type: 'Table service', note: 'Morocco Pavilion' },
    { name: 'Rose & Crown Dining Room', type: 'Table service', note: 'United Kingdom Pavilion' },
    { name: 'Garden Grill Restaurant', type: 'Table service', note: 'The Land pavilion, character dining' },
    { name: 'Coral Reef Restaurant', type: 'Table service', note: 'The Seas pavilion, dine by the aquarium' },
    { name: 'Sunshine Seasons', type: 'Quick service', note: 'The Land pavilion' },
    { name: 'Connections Eatery', type: 'Quick service', note: 'Near the Land and Seas' },
    { name: 'Regal Eagle Smokehouse', type: 'Quick service', note: 'American Adventure' }
  ],
  mk: [
    { name: 'Be Our Guest Restaurant', type: 'Table service', note: 'Fantasyland' },
    { name: 'Cinderella\u2019s Royal Table', type: 'Table service', note: 'Inside Cinderella Castle, character dining' },
    { name: 'Skipper Canteen', type: 'Table service', note: 'Adventureland' },
    { name: 'Tony\u2019s Town Square Restaurant', type: 'Table service', note: 'Main Street, U.S.A.' },
    { name: 'Liberty Tree Tavern', type: 'Table service', note: 'Liberty Square' },
    { name: 'The Crystal Palace', type: 'Table service', note: 'Main Street, character dining' },
    { name: 'The Plaza Restaurant', type: 'Table service', note: 'Main Street, U.S.A.' },
    { name: 'Columbia Harbour House', type: 'Quick service', note: 'Liberty Square' },
    { name: 'Pecos Bill Tall Tale Inn and Cafe', type: 'Quick service', note: 'Frontierland' },
    { name: 'Casey\u2019s Corner', type: 'Quick service', note: 'Main Street, hot dogs' },
    { name: 'Cosmic Ray\u2019s Starlight Cafe', type: 'Quick service', note: 'Tomorrowland' },
    { name: 'Pinocchio Village Haus', type: 'Quick service', note: 'Fantasyland' }
  ],
  hs: [
    { name: 'Sci-Fi Dine-In Theater Restaurant', type: 'Table service', note: 'Dine in a car at a drive-in movie' },
    { name: '50\u2019s Prime Time Caf\u00e9', type: 'Table service', note: 'Echo Lake' },
    { name: 'The Hollywood Brown Derby', type: 'Table service', note: 'Hollywood Boulevard' },
    { name: 'Mama Melrose\u2019s Ristorante Italiano', type: 'Table service', note: 'Grand Avenue' },
    { name: 'Oga\u2019s Cantina', type: 'Lounge', note: 'Star Wars: Galaxy\u2019s Edge. Reservations recommended.' },
    { name: 'Docking Bay 7 Food and Cargo', type: 'Quick service', note: 'Star Wars: Galaxy\u2019s Edge' },
    { name: 'Woody\u2019s Lunch Box', type: 'Quick service', note: 'Toy Story Land' },
    { name: 'Backlot Express', type: 'Quick service', note: 'Echo Lake' },
    { name: 'Roundup Rodeo BBQ', type: 'Table service', note: 'Toy Story Land' },
    { name: 'Ronto Roasters', type: 'Quick service', note: 'Star Wars: Galaxy\u2019s Edge' },
    { name: 'Baseline Tap House', type: 'Quick service', note: 'Grand Avenue, beer and snacks' }
  ],
  ak: [
    { name: 'Yak & Yeti Restaurant', type: 'Table service', note: 'Asia' },
    { name: 'Tiffins Restaurant', type: 'Table service', note: 'Discovery Island' },
    { name: 'Tusker House Restaurant', type: 'Table service', note: 'Africa, character dining' },
    { name: 'Rainforest Cafe', type: 'Table service', note: 'Park entrance' },
    { name: 'Nomad Lounge', type: 'Lounge', note: 'Discovery Island' },
    { name: 'Satu\u2019li Canteen', type: 'Quick service', note: 'Pandora' },
    { name: 'Flame Tree Barbecue', type: 'Quick service', note: 'Discovery Island' },
    { name: 'Pizzafari', type: 'Quick service', note: 'Discovery Island' },
    { name: 'Harambe Market', type: 'Quick service', note: 'Africa' }
  ]
};

/* ---------- Food not to miss (curated from Disney Food Blog written guides; paraphrased) ---------- */
window.WDW_DATA.food = {
  updated: '2026-10-10',
  festival: { start: '2026-08-27', end: '2026-11-21', wedgeEnd: '2026-11-08' },
  sources: {
    dfb: { label: 'Disney Food Blog', url: 'https://www.disneyfoodblog.com/' },
    fw: { label: 'DFB: Food & Wine Festival', url: 'https://www.google.com/search?q=disneyfoodblog+epcot+food+and+wine+festival+2026+best+booths' },
    yt: { label: 'DFB Guide on YouTube', url: 'https://www.youtube.com/results?search_query=dfb+guide+epcot+food+and+wine+festival+2026+best' },
    snacks: { label: 'DFB: best snacks', url: 'https://www.google.com/search?q=disneyfoodblog+best+snacks+disney+world+2026' },
    edison: { label: 'DFB: The Edison', url: 'https://www.google.com/search?q=disneyfoodblog+the+edison+disney+springs' },
    springs: { label: 'DFB: Disney Springs', url: 'https://www.google.com/search?q=disneyfoodblog+best+food+disney+springs' }
  },
  videos: [
    { t: 'DFB Guide: EPCOT Food & Wine Festival (search)', u: 'https://www.youtube.com/results?search_query=dfb+guide+epcot+food+and+wine+festival+2026' },
    { t: 'DFB Guide: best snacks at each park (search)', u: 'https://www.youtube.com/results?search_query=dfb+guide+best+snacks+disney+world' }
  ],
  festivalTips: [
    'Go on a weekday morning or right after rope drop; booth lines are shortest before noon.',
    'Share everything. Two adults can taste 6 to 8 booths by splitting each plate.',
    'Use the Festival Passport or Disney app to see booth menus before you queue.',
    'Walk World Showcase counter-clockwise from the Mexico side if you want to start with the shortest lines, or start at the back (Canada) and work toward the front.',
    'Check the fixed-price booth list first. Prices and menus change during the run, so confirm on the day.'
  ],
  items: [
    { id: 'f-croq', name: 'Croquetas de Jamón', where: 'Spain booth', area: 'fest', cat: 'savory', tier: 'best', price: '$6.99', why: 'Crisp ham croquettes that DFB keeps ranking near the top of the festival.', src: ['fw', 'yt'], tags: ['festival'] },
    { id: 'f-schnitz', name: 'Wiener Schnitzel', where: 'Germany booth', area: 'fest', cat: 'savory', tier: 'best', price: '$7.29', why: 'Crispy cutlet, hearty and easy to share.', src: ['fw'], tags: ['festival'] },
    { id: 'f-baum', name: 'Caramel-Apple Cheesecake Baumkuchen', where: 'Connections Eatery', area: 'fest', cat: 'sweet', tier: 'best', price: '$6.49', why: 'Layered German-style cake with a fall apple-caramel twist.', src: ['fw'], tags: ['festival', 'dessert'] },
    { id: 'f-brioche', name: 'Brioche with Three-Cheese Mornay', where: 'France booth', area: 'fest', cat: 'savory', tier: 'best', price: '$8.95', why: 'DFB named France the best booth for 2026; this cheesy brioche is the star.', src: ['fw', 'yt'], tags: ['festival', 'cheese'] },
    { id: 'f-ravioli', name: 'Pumpkin-Mascarpone Ravioli', where: 'Forest & Field', area: 'fest', cat: 'savory', tier: 'best', price: '$5.49', why: 'Seasonal and cozy, a good fall pick.', src: ['fw'], tags: ['festival', 'fall'] },
    { id: 'f-pao', name: 'Pão de Queijo', where: 'Brazil booth', area: 'fest', cat: 'snack', tier: 'best', price: '$5.19', why: 'Warm, chewy cheese bread. Cheap and satisfying.', src: ['fw'], tags: ['festival', 'cheese'] },
    { id: 'f-lamb', name: 'Roasted Lamb Chop', where: 'Australia booth', area: 'fest', cat: 'savory', tier: 'best', price: '$8.79', why: 'One of the more filling, protein-forward booth plates.', src: ['fw'], tags: ['festival'] },
    { id: 'f-corned', name: 'Smoked Corned Beef', where: 'Flavors from Fire', area: 'fest', cat: 'savory', tier: 'best', price: '$6.49', why: 'Smoky and tender; reliably a crowd favorite.', src: ['fw'], tags: ['festival'] },
    { id: 'f-cheddar', name: 'Cheddar & Bacon Soup', where: 'Canada booth', area: 'fest', cat: 'savory', tier: 'best', price: '$6.29', why: 'A classic festival comfort dish, served in a bread bowl style.', src: ['fw'], tags: ['festival', 'cheese'] },
    { id: 'f-filet', name: 'Filet Mignon', where: 'Canada booth', area: 'fest', cat: 'savory', tier: 'great', price: '$10.49', why: 'Splurge item if you want a real steak bite.', src: ['fw'], tags: ['festival'] },
    { id: 'f-carrot', name: 'Carrot Cake', where: 'Milled & Mulled', area: 'fest', cat: 'sweet', tier: 'best', price: '$4.99', why: 'Inexpensive dessert that gets repeat praise.', src: ['fw'], tags: ['festival', 'dessert'] },
    { id: 'f-kirsch', name: 'Kirschwasser Torte', where: 'The Alps (opened Oct 2)', area: 'fest', cat: 'sweet', tier: 'best', price: '', why: 'Newer booth that opened early October; cherry-forward torte.', src: ['fw'], tags: ['festival', 'dessert'] },
    { id: 'f-emile', name: 'Emile\'s Fromage Montage crawl', where: 'Around World Showcase', area: 'fest', cat: 'activity', tier: 'best', price: '', why: 'Try 5 of 14 cheese bites for a prize: Key Lime DOLE Whip with cheesecake soft serve at Shimmering Sips.', src: ['fw', 'yt'], tags: ['festival', 'cheese', 'activity'] },
    { id: 'f-dumpl', name: 'Basil Pesto Chicken Dumplings', where: 'Festival booth', area: 'fest', cat: 'savory', tier: 'great', price: '$5.99', why: 'Handy snack-size plate.', src: ['fw'], tags: ['festival'] },
    { id: 'f-poutine', name: 'Bo Ssam Pork Poutine', where: 'Festival booth', area: 'fest', cat: 'savory', tier: 'great', price: '$11.99', why: 'Big, shareable and rich.', src: ['fw'], tags: ['festival'] },
    { id: 'f-basque', name: 'Basque Cheesecake', where: 'Spain booth', area: 'fest', cat: 'sweet', tier: 'great', price: '$5.29', why: 'Burnt-top cheesecake, creamy inside.', src: ['fw'], tags: ['festival', 'dessert'] },
    { id: 'f-schink', name: 'Schinkennudeln', where: 'Germany booth', area: 'fest', cat: 'savory', tier: 'great', price: '$5.29', why: 'Baked ham-and-noodle comfort dish.', src: ['fw'], tags: ['festival'] },
    { id: 'f-bun', name: 'Teriyaki Chicken Bun', where: 'Japan booth', area: 'fest', cat: 'savory', tier: 'great', price: '$8.00', why: 'Soft bun, sweet-savory filling.', src: ['fw'], tags: ['festival'] },
    { id: 'f-slider', name: 'Slow-roasted Pork Slider', where: 'Festival booth', area: 'fest', cat: 'savory', tier: 'great', price: '$5.99', why: 'Small and cheap; easy add-on.', src: ['fw'], tags: ['festival'] },
    { id: 'f-mousse', name: 'South African Cream Liqueur Chocolate Mousse', where: 'Festival booth', area: 'fest', cat: 'sweet', tier: 'great', price: '$6.29', why: 'Rich chocolate dessert with a boozy note.', src: ['fw'], tags: ['festival', 'dessert'] },
    { id: 'f-funnel', name: 'Pumpkin Pie Funnel Cake', where: 'Festival booth', area: 'fest', cat: 'sweet', tier: 'great', price: '$12.50', why: 'Seasonal and shareable, though pricey.', src: ['fw'], tags: ['festival', 'fall', 'dessert'] },
    { id: 'f-remy', name: 'Remy Milk Shake', where: 'Festival booth', area: 'fest', cat: 'drink', tier: 'great', price: '$11.49', why: 'Themed shake; fun photo.', src: ['fw'], tags: ['festival'] },
    { id: 'f-italy', name: 'Italy booth', where: 'Italy', area: 'fest', cat: 'savory', tier: 'great', price: '', why: 'Reliable pasta-style plates and a good spot to rest.', src: ['fw'], tags: ['festival'] },
    { id: 'f-wedge', name: 'The Wedge cannoli shake', where: 'The Wedge (through Nov 8)', area: 'fest', cat: 'sweet', tier: 'great', price: '', why: 'Limited run: ends Nov 8, so catch it on Nov 4.', src: ['fw'], tags: ['festival', 'dessert'] },

    { id: 'e-karamell', name: 'Cookie sandwiches', where: 'Karamell-Küche, Germany', area: 'epcot', cat: 'sweet', tier: 'best', price: '', why: 'Caramel-focused sweets shop with a long fan following.', src: ['snacks'], tags: ['dessert'] },
    { id: 'e-pretzel', name: 'Pretzel nuggets', where: 'Block & Hans, Germany', area: 'epcot', cat: 'snack', tier: 'great', price: '', why: 'Warm, salty and good with a beer.', src: ['snacks'], tags: [] },
    { id: 'e-kringla', name: 'Orange cream cheese cinnamon roll', where: 'Kringla Bakeri, Norway', area: 'epcot', cat: 'sweet', tier: 'great', price: '', why: 'Big pastry that is easy to split.', src: ['snacks'], tags: ['dessert'] },
    { id: 'e-halles', name: 'Pastries and sandwiches', where: 'Les Halles, France', area: 'epcot', cat: 'sweet', tier: 'great', price: '', why: 'Good quick stop for French baked goods.', src: ['snacks'], tags: [] },
    { id: 'e-croque', name: 'Croque Glacé', where: 'France', area: 'epcot', cat: 'sweet', tier: 'great', price: '', why: 'Ice-cream sandwich on brioche.', src: ['snacks'], tags: ['dessert'] },

    { id: 'm-gaston', name: 'Gaston\'s cinnamon roll', where: 'Gaston\'s Tavern, Fantasyland', area: 'mk', cat: 'sweet', tier: 'best', price: '', why: 'Oversized roll that is a Magic Kingdom classic.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-tropical', name: 'Tropical Serenade', where: 'Magic Kingdom', area: 'mk', cat: 'sweet', tier: 'best', price: '', why: 'DFB staple for a themed treat near the Tiki Room.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-springroll', name: 'Cheeseburger Spring Rolls', where: 'Magic Kingdom', area: 'mk', cat: 'savory', tier: 'best', price: '', why: 'Fun fried snack that gets frequent mention.', src: ['snacks'], tags: [] },
    { id: 'm-waffle', name: 'Sleepy Hollow waffle', where: 'Sleepy Hollow, Liberty Square', area: 'mk', cat: 'sweet', tier: 'best', price: '', why: 'Fresh waffle with toppings; a good breakfast or treat.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-grey', name: 'Grey Stuff cupcake', where: 'Be Our Guest area', area: 'mk', cat: 'sweet', tier: 'great', price: '', why: 'Beauty and the Beast classic.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-hush', name: 'Hushpuppies', where: 'Magic Kingdom', area: 'mk', cat: 'savory', tier: 'great', price: '', why: 'Fried and filling.', src: ['snacks'], tags: [] },
    { id: 'm-tot', name: 'BBQ pork tot bowl', where: 'Magic Kingdom', area: 'mk', cat: 'savory', tier: 'great', price: '', why: 'Meal-sized snack.', src: ['snacks'], tags: [] },
    { id: 'm-pbj', name: 'PB&J cookie pie', where: 'Magic Kingdom', area: 'mk', cat: 'sweet', tier: 'great', price: '', why: 'Big cookie dessert.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-sundae', name: 'Sundae', where: 'Plaza Ice Cream Parlor', area: 'mk', cat: 'sweet', tier: 'great', price: '', why: 'Old-fashioned Main Street treat.', src: ['snacks'], tags: ['dessert'] },
    { id: 'm-float', name: 'Cold brew float', where: 'Magic Kingdom', area: 'mk', cat: 'drink', tier: 'great', price: '', why: 'Caffeine plus ice cream.', src: ['snacks'], tags: [] },
    { id: 'm-bacon', name: 'Candied bacon', where: 'Westward Ho', area: 'mk', cat: 'snack', tier: 'great', price: '', why: 'Sweet-salty bacon on a stick.', src: ['snacks'], tags: [] },
    { id: 'm-cosmic', name: 'Buffalo chicken strips', where: 'Cosmic Ray\'s, Tomorrowland', area: 'mk', cat: 'savory', tier: 'great', price: '', why: 'Good lunch near the PeopleMover and TRON.', src: ['snacks'], tags: [] },

    { id: 'a-fries', name: 'Pulled-pork fries', where: 'Flame Tree Barbecue', area: 'ak', cat: 'savory', tier: 'best', price: '', why: 'DFB regular; scenic waterside seating.', src: ['snacks'], tags: [] },
    { id: 'a-wonton', name: 'Fried wontons', where: 'Yak & Yeti Restaurant', area: 'ak', cat: 'savory', tier: 'best', price: '', why: 'A favorite starter at your Oct 30 and Nov 3 lunches.', src: ['snacks'], tags: ['reservation'] },
    { id: 'a-yyburger', name: 'Burger', where: 'Yak & Yeti Restaurant', area: 'ak', cat: 'savory', tier: 'great', price: '', why: 'Safe pick if you want something simple.', src: ['snacks'], tags: ['reservation'] },
    { id: 'a-lumpia', name: 'Pongu Lumpia', where: 'Pongu Pongu, Pandora', area: 'ak', cat: 'savory', tier: 'great', price: '', why: 'Crispy rolls near Flight of Passage.', src: ['snacks'], tags: [] },
    { id: 'a-cheesecake', name: 'Seasonal cheesecake pop', where: 'Animal Kingdom', area: 'ak', cat: 'sweet', tier: 'great', price: '', why: 'Portable dessert.', src: ['snacks'], tags: ['dessert'] },
    { id: 'a-blaze', name: 'Nightwraith Blaze', where: 'Animal Kingdom', area: 'ak', cat: 'sweet', tier: 'great', price: '', why: 'Pandora-themed treat.', src: ['snacks'], tags: [] },

    { id: 'h-ronto', name: 'Ronto Wrap', where: 'Ronto Roasters, Galaxy\'s Edge', area: 'hs', cat: 'savory', tier: 'best', price: '', why: 'The Hollywood Studios food most guides name first.', src: ['snacks'], tags: [] },
    { id: 'h-cookie', name: 'Carrot cake cookie', where: 'Hollywood Studios', area: 'hs', cat: 'sweet', tier: 'great', price: '', why: 'Cheap, easy treat.', src: ['snacks'], tags: ['dessert'] },
    { id: 'h-buffalo', name: 'Buffalo bowl', where: 'Fairfax Fare', area: 'hs', cat: 'savory', tier: 'great', price: '', why: 'Filling quick-service option.', src: ['snacks'], tags: [] },

    { id: 's-gideon', name: 'Gideon\'s cookie', where: 'Gideon\'s Bakehouse, Disney Springs', area: 'springs', cat: 'sweet', tier: 'best', price: '', why: 'Huge cookies; expect a line.', src: ['springs'], tags: ['dessert'] },
    { id: 's-grilled', name: 'Grilled cheese & tomato soup', where: 'The Edison', area: 'springs', cat: 'savory', tier: 'best', price: '', why: 'Pairs with your Oct 29 dinner.', src: ['edison'], tags: ['reservation', 'cheese'] },
    { id: 's-edbacon', name: 'Candied bacon', where: 'The Edison', area: 'springs', cat: 'snack', tier: 'great', price: '', why: 'A popular starter.', src: ['edison'], tags: ['reservation'] },
    { id: 's-glaze', name: 'Donuts', where: 'Everglazed', area: 'springs', cat: 'sweet', tier: 'great', price: '', why: 'Fresh donuts with fun flavors.', src: ['springs'], tags: ['dessert'] },
    { id: 's-swirls', name: 'DOLE Whip flight', where: 'Swirls on the Lake', area: 'springs', cat: 'sweet', tier: 'great', price: '', why: 'Lets you sample flavors.', src: ['springs'], tags: ['dessert'] },
    { id: 's-amorette', name: 'Macarons / crème brûlée', where: 'Amorette\'s Patisserie', area: 'springs', cat: 'sweet', tier: 'great', price: '', why: 'Pretty desserts; good for a walk-around treat.', src: ['springs'], tags: ['dessert'] },
    { id: 's-raglan', name: 'Bread pudding', where: 'Raglan Road', area: 'springs', cat: 'sweet', tier: 'great', price: '', why: 'Irish pub dessert.', src: ['springs'], tags: ['dessert'] },
    { id: 's-truffle', name: 'Bottomless truffle fries', where: 'Summer House on the Lake', area: 'springs', cat: 'savory', tier: 'great', price: '', why: 'Unlimited fries if you want to linger.', src: ['springs'], tags: [] },
    { id: 's-mac', name: 'Mac bites', where: 'Wine Bar George', area: 'springs', cat: 'snack', tier: 'great', price: '', why: 'Small bar snack.', src: ['springs'], tags: [] }
  ]
};

/* ---------- EPCOT Food & Wine booth guide (names, items, prices; source: DFB booth page, checked 2026-10-10) ---------- */
window.WDW_DATA.booths = {
  updated: '2026-10-10',
  src: 'https://www.disneyfoodblog.com/epcot-food-and-wine-festival-booths-menus-and-food-photos/',
  map: 'https://lp.disneyfoodblog.com/foodwinemap',
  list: [
    { n: 'The Alps', f: '🏔️', items: [['Raclette on baguette', 6.79], ['Tartiflette', 5.49], ['Kirschwasser torte', 5.49]], drinks: 'Austrian wines and sparkling, $6.50–$8.50' },
    { n: 'Australia', f: '🦘', items: [['Shrimp skewer', 6.99, 'seafood'], ['Lamb chop', 8.79], ['Pavlova', 4.79]], drinks: 'Wines, $6.50–$7.50' },
    { n: 'Belgium', f: '🇧🇪', items: [['Belgian waffle', 5.49], ['Beer-braised beef', 6.79]], drinks: 'Belgian beers $6.00–$9.75, flight $12.75, chilled coffee $5.29–$12.50' },
    { n: 'Bramblewood Bites', f: '🌲', items: [['Pork tenderloin', 7.19], ['River trout', 7.29, 'seafood'], ['Sweet potatoes', 4.99]], drinks: 'Beer $6.00–$9.75, rum old fashioned $12.50' },
    { n: 'Brazil', f: '🇧🇷', items: [['Pão de queijo', 5.19], ['Moqueca', 6.99, 'seafood']], drinks: 'Beer $6.00–$9.75, caipirinha $12.50' },
    { n: 'Brew-Wing Lab', f: '🍗', items: [['Jumbo wings (4 flavors) or plant-based strips', 7.79], ['Fried pickle spears', 5.79]], drinks: 'Tea $5.19, pickle milk shake $6.49, ciders and beers $6.00–$9.75, flights $12.75' },
    { n: 'Canada', f: '🇨🇦', items: [['Cheddar and bacon soup', 6.29], ['Filet mignon', 10.49]], drinks: 'Beer $6.00–$9.75, wine $9.50' },
    { n: 'China', f: '🇨🇳', items: [['Dumpling trio', 7.35], ['Smoked duck bao', 8.25], ['Zhajiang noodles', 8.50]], drinks: 'Bubble tea $7.95, rice lager $6.00–$10.75, cocktails $14.00–$14.25' },
    { n: 'Coastal Eats', f: '🦀', tags: 'seafood', items: [['Crab cake', 7.49], ['Seafood pot pie', 7.49]], drinks: 'Wine $6.50, cocktail $12.50' },
    { n: 'Earth Eats', f: '🌱', items: [['Short rib', 8.49], ['Lemon-almond cake', 4.49]], drinks: 'Aguas frescas $4.79, chardonnay $6.50' },
    { n: 'Festival Favorites', f: '⭐', items: [['Pierogi', 5.99], ['Bo ssam lettuce wraps', 6.19], ['Pumpkin trifle', 5.29]], drinks: "Frozen s'mores $5.29, beer $6.00–$9.75, frozen apple blossom $16.50" },
    { n: 'Flavors from Fire', f: '🔥', items: [['Rodizio beef skewer', 6.99], ['Smoked corned beef', 6.49], ['Chocolate bread pudding', 4.49]], drinks: 'Beer $6.00–$9.75, zinfandel $6.50, spiked drink $13.00' },
    { n: 'Forest and Field', f: '🍂', items: [['Black bean chili', 5.99], ['Pumpkin ravioli', 5.49], ['Schiacciata sandwich', 6.29]], drinks: 'Stout $6.00–$9.75, chardonnay $6.50, pinot noir $7.00' },
    { n: 'France', f: '🇫🇷', items: [['Short ribs', 9.50], ['Brioche with mornay', 8.95], ['Escargot', 9.25], ['Pistachio crème brûlée', 7.95]], drinks: 'French cosmo $15.50, wines $6.95–$7.95' },
    { n: 'The Fry Basket', f: '🍟', items: [['Yuca fries', 5.79], ['Fry flight', 7.99]], drinks: 'Sour ale $6.00–$9.75, grapefruit mule $12.50' },
    { n: 'Germany', f: '🇩🇪', items: [['Wiener schnitzel', 7.29], ['Schinkennudeln', 5.29], ['Apple strudel', 4.99]], drinks: 'Beer $6.00–$9.75, flight $12.75, riesling $9.00' },
    { n: 'Greece', f: '🇬🇷', items: [['Spanakopita', 5.19], ['Griddled cheese', 5.49], ['Chicken gyro', 6.99]], drinks: 'Melon limeade $12.00, wines $6.50–$7.50' },
    { n: 'Gyozas of the Galaxy', f: '🥟', items: [['Dumplings (three kinds)', 5.29]], drinks: 'Pinot gris $7.50' },
    { n: "Hawai'i", f: '🌺', items: [['Pork slider', 5.99], ['Rice bowl', 6.29], ['Pineapple cheesecake', 5.49]], drinks: "Sparkling pineapple wine $10.00, beer $6.00–$9.75, O'ahu Sunrise $14.50" },
    { n: 'Hops & Barley', f: '🍺', items: [['Seafood roll', 8.99, 'seafood'], ['Brisket melt', 6.49], ['Chocolate pudding cake', 4.99]], drinks: 'Beer $6.00–$9.75, flight $12.75' },
    { n: 'India', f: '🇮🇳', tags: 'indian', items: [['Samosas', 5.49], ['Chicken tikka masala', 6.49]], drinks: 'Mango lassi $5.29 (rum $12.50), sparkling wine $7.50' },
    { n: 'Italy', f: '🇮🇹', items: [['Stromboli', 8.00], ['Pollo al marsala', 9.00], ['Almond panna cotta', 6.00]], drinks: 'Bellini $16.00, wines $12–$13, sangria $14.00, beer and prosecco $6.00–$12.00' },
    { n: 'Japan', f: '🇯🇵', items: [['Spicy tuna temaki', 9.00, 'seafood'], ['Wagyu temaki', 10.25], ['Teriyaki chicken bun', 8.00]], drinks: 'Fruit pearl drinks $6.50–$10.00, Sapporo $5.00–$13.00, sake $13.50' },
    { n: 'La Poutinerie', f: '🍁', items: [['Bo ssam pork poutine', 11.99]], drinks: 'Slushy $6.29, mule $14.50, beer $10.75–$14.00, wine $7.50–$12.00' },
    { n: 'Mexico', f: '🇲🇽', tags: 'mexican', items: [['Osso buco tostada', 8.25], ['Taco de camarón', 8.50], ['Berry paleta', 7.00]], drinks: 'Cocktails $13.50–$13.75, craft beer $8.50–$11.00' },
    { n: 'Milled and Mulled', f: '🍁', items: [['Squash bisque', 5.49], ['Carrot cake', 4.99], ['Churros sundae', 5.29]], drinks: 'Amber ale $8.50–$9.75, cider $5.75–$11.00' },
    { n: 'Refreshment Outpost', f: '🌍', items: [['Beef stew', 6.79], ['Mealie pap', 5.79], ['Chocolate mousse', 6.29]], drinks: 'Beer and cider $12.50, cocktail $17.50' },
    { n: 'Shimmering Sips', f: '🥂', items: [['Strawberry trifle', 5.79]], drinks: 'Mimosas $7.75, mimosa flight $15.00. Fromage Montage prize is served here.' },
    { n: 'Spain', f: '🇪🇸', items: [['Croquetas', 6.99], ['Paella', 7.99], ['Basque cheesecake', 5.29]], drinks: 'Garnacha $7.50, frozen lemonade cocktail $13.00' },
    { n: 'Swirled Showcase', f: '🍦', items: [['Almond truffle mousse', 5.49], ['Soft-serve cone', 6.29]], drinks: 'Frozen szarlotka $6.79, floats $6.79–$13.25, Irish milk shake $13.00' },
    { n: 'Tangierine Cafe', f: '🥙', tags: 'moroccan', items: [['Chermoula chicken bowl', 6.79], ['Flank steak bowl', 7.29], ['Cauliflower bowl', 6.49], ['Wrap', 6.29], ['Cookie', 4.29]], drinks: 'Fig cocktail $12.00, cider $6.00–$9.75' },
    { n: 'The Wedge (through Nov 8)', f: '🧀', items: [['Cheese selection', 7.29], ['Crab-corn mac', 7.19, 'seafood'], ['Cheesesteak mac', 6.49], ['Three-cheese mac', 5.49], ['Wine and cheese pairing', 17.50], ['Cannoli shake', 5.49]], drinks: 'Wines $8.50–$13.00, flight $12.50' },
    { n: 'Funnel Cake Stand (American Adventure)', f: '🎃', items: [['Pumpkin pie funnel cake', 12.50]], drinks: '' },
    { n: 'Connections Eatery', f: '🥨', items: [['BBQ chicken pizza', 12.29], ['Caramel-apple cheesecake baumkuchen', 6.49]], drinks: 'Frozen waffle old fashioned $17.50' },
    { n: 'Connections Café', f: '🍩', items: [['Pistachio-chocolate mochi doughnut', 5.29]], drinks: '' },
    { n: 'Regal Eagle Smokehouse', f: '🦅', items: [['Blackberry buckle', 4.79], ['Pumpkin pie milk shake', 6.79]], drinks: '' },
    { n: 'Sommerfest', f: '🥨', items: [['Zwiebelkuchen', 9.79]], drinks: 'Cinnamon pretzel cold brew $6.49' },
    { n: 'Sunshine Seasons', f: '🐭', items: [['Mickey macaron', 6.29], ['Remy milk shake', 11.49]], drinks: '' },
    { n: 'Norway cart', f: '🇳🇴', items: [['Caramel cream bolle', 5.49]], drinks: '' },
    { n: 'Block & Hans', f: '🥨', items: [], drinks: 'Strawberry-mango smoothie $6.29 (spirited $16.50)' },
    { n: 'Joffrey\'s coffee carts', f: '☕', items: [['Affogato cold brew', 7.49]], drinks: 'Spirited version $15.99' },
    { n: 'Canada popcorn cart / UK beer cart', f: '🍿', items: [], drinks: 'Northern Ruby cocktail and sparkling cucumber-gin cocktail, $17.50 each' }
  ]
};

/* ---------- Festival extras, activities and reading list (links verified on DFB's 2026 festival page, 2026-10-10) ---------- */
(function () {
  const dfb = 'https://www.disneyfoodblog.com/';
  const W = window.WDW_DATA;
  W.food.items.push(
    { id: 'x-cheese', name: 'Cheers to Cheese exhibit', where: 'World Showcase festival area', area: 'fest', cat: 'activity', tier: 'great', price: '', why: 'New cheese-themed experience for the 2026 festival.', src: ['fw'], tags: ['festival', 'cheese', 'activity'] },
    { id: 'x-remy', name: "Remy's Hide 'n' Squeak scavenger hunt", where: 'Around World Showcase', area: 'fest', cat: 'activity', tier: 'great', price: '', why: 'A hunt that earns a festival souvenir. Fun with two adults too.', src: ['fw'], tags: ['festival', 'activity'] },
    { id: 'x-pluto', name: "Pluto's Pumpkin Pursuit", where: 'Around World Showcase', area: 'fest', cat: 'activity', tier: 'great', price: '', why: 'Halloween-season scavenger hunt, back this year. Fits your Nov 4 visit.', src: ['fw'], tags: ['festival', 'fall', 'activity'] }
  );
  W.festivalPlus = {
    extras: [
      { icon: '🌍', t: 'Spaceship Earth festival lighting', d: 'The big sphere gets a limited-time festival look after dark.', u: dfb + '2025/08/30/check-out-spaceship-earths-limited-time-look-for-the-2025-epcot-food-and-wine-festival/' },
      { icon: '🌱', t: 'Living with the Land festival overlay', d: 'One of your must-dos. The ride picks up festival touches during the run.', u: dfb + '2024/09/01/surprise-see-how-a-popular-ride-has-changed-for-the-epcot-food-wine-festival/' },
      { icon: '🚂', t: 'Tiny Train Town', d: 'The miniature train display gets a festival makeover.', u: dfb + '2026/08/27/youre-going-to-lose-your-mind-when-you-see-what-disney-did-to-tiny-train-town-for-the-epcot-food-wine-festival/' },
      { icon: '📸', t: 'PhotoPass Magic Shots', d: 'Festival photo spots with photographers on site.', u: dfb + 'disney-photopass-service-in-walt-disney-world-resort/' },
      { icon: '🎸', t: 'Eat to the Beat concerts', d: 'Nightly concerts at the America Gardens Theatre. Check the schedule for Nov 4.', u: dfb + 'eat-to-the-beat-concerts/' },
      { icon: '🧀', t: "Emile's Fromage Montage crawl", d: 'Try cheese bites at five booths for the Key Lime DOLE Whip prize.', u: dfb + '2026/08/27/i-was-forced-to-eat-a-bunch-of-cheese-to-get-the-best-dole-whip-of-my-life-at-epcot/' }
    ],
    reading: [
      { g: 'Plan your festival day', l: [
        ['Festival 101', dfb + 'epcot-food-and-wine-festival-101/'],
        ['Everything to eat and drink (2026)', dfb + '2026/08/27/everything-you-need-to-eat-and-drink-at-the-2026-epcot-food-and-wine-festival/'],
        ['2026 Passport first look', dfb + '2026/08/27/first-look-at-the-2026-epcot-food-and-wine-festival-passport/'],
        ['Free map and checklist', 'https://lp.disneyfoodblog.com/foodwinemap'],
        ['CommuniCore Hall and Plaza', dfb + 'epcot-international-festival-area-featuring-communicore-hall-and-communicore-plaza-in-disney-world/']] },
      { g: 'Dietary notes', l: [
        ['Gluten-free festival items', dfb + 'epcot-food-and-wine-festival-gluten-free-items/'],
        ['Eating with allergies at Disney World', dfb + 'eating-with-allergies-and-intolerances-in-disney-world/']] },
      { g: '2026 reviews and news', l: [
        ['All 30 reimagined items reviewed', dfb + '2026/09/07/hit-or-miss-we-tried-all-30-reimagined-menu-items-at-the-epcot-food-and-wine-festival/'],
        ['17 years of festival changes', dfb + '2026/09/09/weve-been-to-the-epcot-food-wine-festival-17-years-in-a-row-there-have-been-some-big-changes/'],
        ['New cheese booth review', dfb + '2026/09/18/review-cheese-lovers-rejoice-this-new-epcot-festival-booth-is-everything-youve-ever-wanted/'],
        ['Two booths that opened this fall', dfb + '2026/09/05/2-epcot-food-wine-festival-booths-open-this-month/'],
        ['Breakfast review', dfb + '2026/09/03/review-this-epcot-food-wine-festival-breakfast-got-more-expensive-and-less-boozy/'],
        ['A festival problem to know about (Oct 5)', dfb + '2026/10/05/we-have-to-warn-you-about-this-epcot-food-wine-festival-problem/']] },
      { g: 'Events and souvenirs', l: [
        ['Special events (paid)', dfb + 'epcot-food-and-wine-festival-special-events/'],
        ['Souvenirs and gift cards', dfb + '2026/08/27/full-list-all-the-new-souvenirs-at-the-2026-epcot-food-wine-gift-cards/'],
        ['Annual Passholder perk', dfb + '2026/08/26/disney-confirms-new-annual-passholder-perk-for-epcot/']] }
    ]
  };
})();
