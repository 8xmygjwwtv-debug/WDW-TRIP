[README.md](https://github.com/user-attachments/files/33005990/README.md)
# WDW Trip Dashboard · Oct 29 – Nov 5, 2026

Live Walt Disney World dashboard for 2 adults staying at Westgate Lakes Resort & Spa (off-site).
Static PWA + Netlify Functions. Vanilla JS, Tailwind via CDN.

**Powered by [ThemeParks.wiki](https://themeparks.wiki)** (live waits, status, schedules, showtimes).

## Files

```
public/                  static site (published)
  index.html             shell, theme tokens, nav
  app.js                 all views, alert engine, Grok-bot drafts
  data.js                curated content: priority list, Skyliner, tips, Springs  <- edit me
  sw.js                  service worker (offline last-known data; never caches map tiles or APIs)
  manifest.webmanifest, icons/
netlify/functions/
  tp.mjs                 caching proxy for ThemeParks.wiki      /api/tp
  send-email.mjs         email to the Grok bots                 /api/send-email
  send-sms.mjs           SMS via Twilio                         /api/send-sms
  prefs.mjs              saves alert settings for cloud alerts  /api/prefs
  deals.mjs              deal headlines from public blog feeds  /api/deals
  scheduled-alerts.mjs   runs every 5 min, works with app closed
netlify/lib/             shared code (email, SMS, formatting, ThemeParks)
netlify.toml  package.json  .env.example
```

## Data strategy

| Need | Source |
|---|---|
| Waits, status, showtimes, restaurants, schedule | ThemeParks.wiki, through `/api/tp` (shared 30–60 s edge cache). If the function is unreachable the browser calls the API directly. |
| Park IDs | Discovered from `/destinations` by name, cached 7 days, with hard-coded fallbacks. |
| Refresh | Every 3 min while a park is open (or within 1 h of open/close), every 15 min otherwise. Also on focus and reconnect. |
| Offline | Last data is saved in localStorage and the service worker; the header shows "Saved data from …". |
| Weather & alerts | Open-Meteo, fallback api.weather.gov (NWS), alerts from NWS. |
| Ride/restaurant map positions | ThemeParks.wiki `/entity/{park}/children` (via `/api/tp`). |
| Other map places, routes, tiles | OpenStreetMap: Overpass, routing.openstreetmap.de, tile.openstreetmap.org. |
| Deals | Headlines + links from Disney Tourist Blog, Disney Food Blog, WDWNT RSS feeds, plus official offer links. |
| Menus, festival booths, Disney Springs, Skyliner | Curated in `public/data.js` (no free live API exists). Menu links open a web search. |

Honest limits: ThemeParks.wiki only publishes restaurant walk-up data when Disney exposes it, and Disney Springs has no wait data.
Festival dates/menus change yearly, so the app shows general tips and links rather than a fixed 2026 booth list.

## Deploy to Netlify

1. Put this folder in a Git repo (GitHub/GitLab) and push.
2. Netlify → **Add new site → Import an existing project**, pick the repo. Settings are read from `netlify.toml` (publish `public`, functions `netlify/functions`). Click **Deploy**.
   (Or: `npm i -g netlify-cli && netlify deploy --prod`.)
3. Add environment variables below (Site configuration → Environment variables), then **redeploy**.
4. Open the site on your phone and **Add to Home Screen**.

Scheduled functions only run on the published (production) deploy.

## Set up email to `grokbotaccess@gmail.com`

### Option A: Gmail SMTP (default)
1. In the Gmail account that will send (can be `grokbotaccess@gmail.com` itself), turn on **2-Step Verification**.
2. Go to <https://myaccount.google.com/apppasswords>, create an app password named "WDW Dashboard", copy the 16 characters.
3. In Netlify set:
   - `GMAIL_USER` = the Gmail address
   - `GMAIL_APP_PASSWORD` = the 16-character password (spaces OK)
4. Redeploy → in the app: **Deals & Alerts → Send test email**.

If you send from your own Gmail, the bots still see it in `grokbotaccess@gmail.com`. If you send from the bots' own account to itself, Gmail delivers it to its inbox as normal.

### Option B: Resend
Set `RESEND_API_KEY` and `EMAIL_FROM` (a sender on a domain you verified in Resend). `EMAIL_PROVIDER=auto` prefers Resend when its key exists; force with `EMAIL_PROVIDER=gmail|resend`.
Note: the `onboarding@resend.dev` test sender can only deliver to your own Resend account email.

Other variables: `EMAIL_TO` (default recipient), `EMAIL_ALLOWED_RECIPIENTS` (comma list; the function refuses any other address, so the endpoint can't be used as an open mail relay).

**From address:** Gmail/Resend send from the authenticated account. The "From / reply-to" field in the app sets **Reply-To**, so bot replies go where you want.

If credentials are missing, the app does not fail: it shows the draft with **Copy**, **Open in Gmail**, and **Default mail app**.

## Set up SMS (Twilio)
1. Create a Twilio account, get a number (trial accounts can only text verified numbers).
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (or `TWILIO_MESSAGING_SERVICE_SID`).
3. Set `ALLOWED_SMS_NUMBERS` to your number in E.164, e.g. `+14075550123` (comma-separate multiple). Required unless `ALLOW_ANY_SMS_NUMBER=true`.
4. Redeploy → **Send test SMS**. US carriers may require A2P 10DLC registration for sustained traffic on a purchased number.

## Optional passcode
You chose an open site. Because the site can send email/SMS from your accounts, the functions have built-in guards: recipients are allow-listed, SMS goes only to allow-listed numbers, and each endpoint is rate limited. If you want more, set `APP_PASSCODE` in Netlify and type the same value into **Deals & Alerts → App passcode**. Functions then require header `x-app-key`.

## How the Grok-bot communication works

**Automatic** (Deals & Alerts → *Auto-email important events*): when a rule fires, one email is sent with subject `[WDW Dashboard] Travel Update – <event>`. Body = plain-text summary + a `--- JSON ---` block:

```
WDW DASHBOARD -> GROK TRAVEL MANAGER
Trip: 2026-10-29 to 2026-11-05 | 2 adults | Hotel: Westgate Lakes Resort & Spa (off-site)
EVENTS
1. [waitDrop] TRON Lightcycle / Run is down to 25 min - Magic Kingdom; your limit is 30 min
--- JSON ---
{ "source": "wdw-dashboard", "type": "alert", "events": [ { "kind": "waitDrop", ... } ] }
```

**Manual** (Travel Sync tab): fill in your logistics (hotel confirmation, flights, car, shuttles, reservations), pick a topic and bot name, then **Sync with Travel Manager** (structured update) or **Ask Grok Bots** (your question + the same data). Edit the draft, then **Send now**, **Copy**, **Open in Gmail**, or **Default mail app**. Drafts include the day plan, park hours, live must-do waits, logistics on file, and recent alerts; JSON `type` is `sync`, `question`, or `alert`.

The app sends mail but cannot read the bots' replies (no inbox access); replies land in whatever address you set in "From / reply-to".

## Alerts: in-app and cloud

- **In-app / browser:** always on while the app is open (toggle in settings). Click **Allow browser notifications** for system banners.
- **Cloud alerts (app closed):** turn on *Cloud alerts*, then **Save to cloud now**. Settings are stored in Netlify Blobs and `scheduled-alerts` runs every 5 minutes (quiet 1–6 a.m. Eastern). When cloud alerts are on, SMS/email come only from the cloud job so you never get duplicates.
- **Rules:** wait ≤ limit (fires when it *crosses* the limit, 30-min cooldown per ride), ride reopens after Down, walk-up table appears (when published), park hours change on trip dates, new deal headline.
- First run only records a baseline, so you won't be spammed on day one.

### Customize
- Default wait limit, per-ride limits, rule toggles, email throttle (minutes between auto-emails): **Deals & Alerts** and **Favorites / Must-Rides**.
- Priority list, tips, Skyliner notes, Disney Springs picks, topics and quick questions: edit `public/data.js`.
- Cloud cadence: change `schedule` at the bottom of `netlify/functions/scheduled-alerts.mjs` (cron). Cooldown: `COOLDOWN_MS` there and in `app.js`.
- Auto-send rules for email: the same toggles control both app and cloud behavior.

## Live ticker, weather, map and camera (v2)

### Bottom ticker (always on)
A scrolling "LIVE" banner shows: current temperature and **heat index** for your location, any National Weather Service alerts for your point (heat advisory, thunderstorm warnings), ride-down and reopened news for **every** attraction, your own alerts, park-hours changes, the shortest must-ride wait, and new deal headlines. Items age out after 3 hours. Tap ⏸ to pause (it also pauses on hover). With "reduce motion" enabled it stops scrolling and becomes swipeable.

- **Weather sources (automatic fallback):** Open-Meteo first, then api.weather.gov (NWS). Heat index is computed with the NWS formula from temperature + humidity (NWS station values are used when they report one). No API keys.
- **Location:** if you've already allowed location, weather uses it; otherwise tap 📍 in the banner. Until then it shows "Orlando area". Coordinates are rounded to ~100 m before being sent to the weather services.
- **News detection** runs in the app on each refresh (every 3 min while parks are open), so it reports changes it sees while the app is open or recently opened. The scheduled cloud function is what covers a closed app, and it only handles the alerts you configured.

### Park map and "Here I am" (📍 button, or 🧭 on any ride/restaurant)
Full-screen overlay with an OpenStreetMap map (Leaflet), your live GPS dot, and walking routes.
- **Here I am** centers on you, tells you which park you're in, and lists the nearest must-dos. **Pin my spot** lets you tap the map if GPS is blocked or you're indoors.
- Destinations: must-dos, rides, shows, dining (positions from ThemeParks.wiki), plus restrooms, first aid, Guest Services, baby care, shops, entrances/exits, Skyliner stations, bus stops and parking from OpenStreetMap via the Overpass API. First open downloads and caches this data (7 days for rides, 14 days for OSM places).
- Routing: the free walking-route server at routing.openstreetmap.de (reroutes when you move ~50 m). If it's down you get a straight-line estimate plus **Google Maps / Apple Maps** buttons.
- Honest limits: OSM coverage of Disney back-of-house and some guest services varies. Baby care, Guest Relations and entrances may be missing or oddly named. The public routing and tile servers are for light personal use. For heavier use swap the tile URL in `ensureMap()` for a keyed provider (Stadia, MapTiler, Thunderforest).
- Park centers/radii and categories live in `public/data.js` (`areas`, `poiCats`).

### Camera and trip gallery (📷 button, Photos tab)
- **Open camera** uses the phone's native camera (file input with `capture`). **Live camera** uses an in-app viewfinder. **Choose from library** imports existing shots (keeps their original time).
- Each photo gets a caption, park tag, "near" place (nearest ride/restaurant within ~90 m of your location), time (Orlando time) and optional location.
- The gallery is stored in your browser's IndexedDB on that device only (full image at ~2000 px plus a thumbnail). Nothing is uploaded. Clearing site data deletes it, so use **Save to phone** for keepers.
- **Save to phone:** a web app can't write straight to the camera roll. On iPhone/Android it opens the share sheet (choose Save Image); otherwise it downloads the JPEG.

## Local development
```
npm i -g netlify-cli
npm install
netlify dev        # serves public/ + functions + env from a local .env (copy .env.example)
```

## Privacy
Favorites, phone, logistics, settings, last known location and photos live on your device (localStorage / IndexedDB). Rounded coordinates are sent to Open-Meteo / api.weather.gov (weather) and exact start/end points to routing.openstreetmap.de only when you ask for directions. Only if you enable cloud alerts are phone/thresholds stored in your own Netlify Blobs store.
Unofficial fan-made planner; not affiliated with The Walt Disney Company.
