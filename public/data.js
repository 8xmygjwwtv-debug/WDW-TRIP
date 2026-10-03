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
