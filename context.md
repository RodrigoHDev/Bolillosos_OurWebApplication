# Bolillosos — Project Context

A private, two-user web app built as a gift between partners ("Bolillosos"). It has a public landing page, a login, and a 3-step flow for inviting the partner on a date, picking a category and activity, and scheduling a date and time. When a date is saved, both profiles get an email with an `.ics` calendar attachment.

Almost all UI text is in **Spanish (es-MX)**, and the tone is affectionate and playful. Code comments mix English and Spanish.

- **Repo / package name:** `dateme-webpage` (GitHub `RodrigoHDev/DateMe-WebPage`), MIT license (package.json says ISC)
- **Author header convention:** every file starts with a block comment: `Title / Author: R. Hurtado / Date: MM/DD/2026 / Description`
- **Deployed on:** Render (`app.set('trust proxy', 1)`), domain `bolillosos.online`, email sender `contact.bolillosos.online`

---

## Tech stack

| Layer | Tech |
|---|---|
| Runtime | Node 20.x, CommonJS (`require`) |
| Server | Express 5, `express-ejs-layouts`, `express-session` (MemoryStore), `csurf`, `compression`, `body-parser` |
| Views | EJS, one shared layout (`src/views/layout.ejs`) |
| Styling | One hand-written stylesheet `src/public/retro-cute.css` (~2.3k lines, "retro-cute" pastel OS-window theme). Tailwind, DaisyUI and Vite are installed and referenced but **not actually used at runtime** (see Quirks). |
| Client JS | Vanilla JS files in `src/public/js/`, one per page, loaded with `<script src>` |
| DB / Auth | Supabase (`@supabase/supabase-js`), email/password auth plus Postgres tables |
| Email | Resend (`resend`), HTML template plus generated ICS attachment |
| Installed but unused | `multer` (imported in server.js, never used), `bcrypt`, `cloudflared` |

**Env vars** (`.env`, gitignored): `SUPABASE_URL`, `SUPABASE_KEY`, `RESEND_API_KEY`, `SESSION_SECRET`, optional `PORT` (default 3000).

**Scripts:** `npm start` / `npm run dev:server` (`node --watch server.js`). `npm run dev` also starts Vite in parallel, which isn't needed to serve the app.

---

## Directory layout

```
server.js                      App bootstrap, middleware chain, route mounting
vite.config.js                 Tailwind plugin; build outDir '/src/public' (absolute path, see Quirks)
future_implementations.txt     Backlog + DB schema (gitignored via *.txt)
src/
  controllers/
    landing.controller.js      getLandingPage
    auth.controller.js         getLogin, doLogin, getLogout (unused, no route)
    dates.controller.js        getInvitationPage, getCategoryPage, getActivitiesByCategory, getSchedulePage, saveDate
  routes/
    landing.routes.js          GET /
    auth.routes.js             GET|POST /auth/login
    dates.routes.js            /dates/* (all behind isAuth)
  middleware/
    flash.js                   session.success/error → res.locals, then cleared
    isAuth.js                  checks session.isAuth; otherwise redirects to '/'
    renderNotFound.js          404 page
  utils/
    main.js                    empty
    webServices/supabase/supabase.js      Supabase client singleton (ws transport)
    webServices/resend/resend.js          sendAppointmentEmail, sendResetEmail (unused)
    webServices/resend/template.js        appointmentEmail(data) → HTML string
    webServices/resend/icsBuilder.js      buildIcsContent({summary, description, startIso, endIso, isRange})
    webServices/resend/appointmentFormat.js  formatAppointmentDateTime(start, end) → {dateText, timeText, isRange}
  views/
    layout.ejs                 <head>, floating decorations, flash toast + auto-dismiss
    pages/landing.ejs          public landing (nav, hero, novedades, sobre nosotros, secciones, footer)
    pages/login.ejs            login form (email + password, eye toggle)
    pages/invitation.ejs       STEP 1: invitation letter, photo carousel, runaway "No" button
    pages/category.ejs         STEP 2: slot machine + "trampa" category picker + activities modal
    pages/schedule.ejs         STEP 3: calendar/hour picker, submit, confirmation modal
    pages/404.ejs
  public/
    retro-cute.css
    js/invitation.js           step 1 behavior (salutation rotator, No button, modal, carousel)
    js/category.js             step 2 behavior (slot machine, trap, activities modal/AJAX)
    js/schedule.js             step 3 behavior (calendar heatmap, range/hour selection, AJAX submit)
    js/landing.js              DEAD: never included; references #aboutToggle, which doesn't exist
    images/                    categories/*.jpg, gallery/*.jpeg (WhatsApp photos), landing/*, news/*, misc
```

---

## Request pipeline (server.js order)

1. `express.json` (with `rawBody` capture), `compression`, static `src/public`
2. EJS and layouts (`layout` = `layout.ejs`)
3. `express.urlencoded` + `bodyParser.urlencoded` (duplicated)
4. `dotenv.config()`. This runs before routes are required, so Supabase and Resend see the env vars.
5. `express-session` (secret from env, default MemoryStore)
6. `flash`, then `csurf({ session: true })` applied **globally**
7. Routes: `/` landing, `/auth` auth, `/dates` dates
8. CSRF error handler (`EBADCSRFTOKEN` → flash "Your form expired", redirect back)
9. `renderNotFound` (404)

Every view receives `title`. Flash messages are set with `request.session.success` / `request.session.error` before a redirect, and the layout toast shows them.

---

## Routes and user flow

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/` | – | `getLandingPage` | Passes a hardcoded `announcements` array |
| GET | `/auth/login` | – | `getLogin` | Passes `csrfToken`, `avatarUrl` |
| POST | `/auth/login` | – | `doLogin` | Supabase `signInWithPassword`, loads `profiles`, sets `session.isAuth` + `session.user`, redirects to `/dates/invitation` |
| GET | `/dates/invitation` | ✔ | `getInvitationPage` | Reads `public/images/gallery` from disk and renders `pages/invitation` (step 1) |
| GET | `/dates/category` | ✔ | `getCategoryPage` | Selects `category(name, image)` and renders `pages/category` (step 2); `window.categories` is injected |
| GET | `/dates/activities?category=<name>` | ✔ | `getActivitiesByCategory` | JSON `{activities:[{name,id}]}`. Looks up the category id **by name**, then `options` by `category_id`. |
| GET | `/dates/schedule?category=<name>&activity=<optionId>` | ✔ | `getSchedulePage` | Selects future `dates` (`end_date >= now`) for the heatmap and checks that the activity exists. Renders `pages/schedule` (step 3) with `existingDates`, `category`, `activityId`; `window.existingDates` is injected. |
| POST | `/dates/schedule` | ✔ | `saveDate` | JSON body `{_csrf, activityId, startDate, endDate}`. Inserts into `dates`, loads all `profiles`, resolves activity/category/creator names, builds the ICS file, and emails every profile (`Promise.allSettled`). Returns `{success:true}`. |

**Flow:** landing → login → step 1 invitation (Sí → modal → `/dates/category`) → step 2 (spin or pick a category → Continuar → activities modal → pick one → `/dates/schedule?...`) → step 3 (pick a day plus an hour, or a range of days → ¡Finalizar! → AJAX POST → confirmation modal → back to `/dates/invitation`).

Steps 1–3 all render the `rc-steps` indicator driven by `currentStep` (1/2/3).

### Page behavior details
- **Step 1 (`invitation.ejs` / `invitation.js`):** The `#salutationText` greeting rotates every 1.8s through `Hermosa, Preciosa, Belleza, Mi Princesa, Mi Reina, Mi Nico`. The letter is hardcoded ("9 meses juntos"). The "Me encantan" badges are static. The carousel shows the gallery in groups of 3 and auto-advances every 4s. The "No" button runs away when the mouse comes within 140px, or on click or touch.
- **Step 2 (`category.ejs` / `category.js`):** A 3-reel slot machine. Each reel is a shuffled category list repeated `REPEATS=8` times and animated with `translateY`. The user advances only when all 3 reels match. A match is forced on a random spin between the 10th and 15th. On mobile, a circular tap button triggers `#slotLever.click()`. **"¡Una trampa para ti!"** is a collapsible panel with a `.trap-option` button for each category that selects it directly. The activities modal (`#activitiesModal`) fetches `/dates/activities` and renders `.activity-option` buttons inside `#activitiesGrid`, each with a cycling icon from `["✦","♡","☆","✧","❀","◆"]`.
- **Step 3 (`schedule.ejs` / `schedule.js`):** A month calendar with a busy heatmap (`busy-1/2/3` = number of existing dates on a day). Past days are disabled. Clicking one day opens the hour modal (6:00 AM to 12:00 AM; "24" means midnight of the next day). Clicking a second day makes a range, with no hour. Clicking outside the calendar with an incomplete selection resets it. Dates are sent as **naive local strings** (`YYYY-MM-DDTHH:00:00`, with no timezone). A single-day date has `start == end`. A range uses `T00:00:00` on both ends.

---

## Database (Supabase / Postgres)

Source: `future_implementations.txt` (the file notes the schema is for context only and isn't runnable as-is).

```
auth.users (Supabase-managed)
   │ 1:1
public.profiles
   id uuid PK (default auth.uid(), FK → auth.users.id)
   username text NOT NULL UNIQUE default ''
   display_name text default ''
   email text
   │ 1:N (created_by)
public.dates
   id uuid PK default gen_random_uuid()
   created_at timestamptz NOT NULL default now()
   start_date timestamptz
   end_date timestamptz
   option_id uuid  FK → options.id      (default gen_random_uuid() — odd default)
   created_by uuid FK → profiles.id     (default gen_random_uuid() — odd default)
   │ N:1
public.options          ("activities" in code and UI)
   id uuid PK
   name text NOT NULL
   category_id uuid FK → category.id    (default gen_random_uuid() — odd default)
   │ N:1
public.category
   id uuid PK
   name varchar NOT NULL                (no UNIQUE constraint; code looks it up by name with .single())
   image text                           (public URL path, e.g. /images/categories/art.jpg)
```

**Naming map between code, UI and DB:** category = `category`. Activity / option = `options`. Date / appointment / cita = `dates`. Profile / user = `profiles`.

Only two profiles exist, one per partner. `saveDate` emails **every** row in `profiles`.

Queries use the anon/service key from env through a single shared client. After login, the server doesn't pass a per-user Supabase session. Auth state lives in the Express session only.

---

## Styling system (`retro-cute.css`)

Design tokens live in `:root`: pink, blue, yellow and green families (`--rc-pink`, `--rc-pink-border`, `--rc-pink-deep`, `--rc-pink-text`, …), `--rc-cream`, `--rc-muted`, radii (`--rc-radius-sm/win/pill`), offset "retro" shadows, and fonts `Space Grotesk` (body) and `VT323` (retro).

Reusable components (prefix `rc-`):
- `rc-window` + `rc-window-bar` (three `rc-dot--red/yellow/green` dots and an `rc-window-title`) + `rc-window-body`. This is the macOS-like window card used on every page. The backlog calls these "the ribbon with three circles".
- `rc-window--narrow` (420px max, forms such as login)
- `rc-btn` (`--pink`, `--blue`, `--yellow`, `--ghost`, `--full`, `--wide` = 220px, `--sm`), plus `rainbow` (animated glow). `rc-back-btn` is a fixed top-left back link.
- `rc-card` (`--pink/--yellow/--green/--blue`), `rc-badge` (colors), `rc-badge-row` (wrapping row of badges), `rc-title` (+ `rc-title--sm`), `rc-subtitle`
- `rc-field`, `rc-label`, `rc-input-wrap`, `rc-input`, `rc-eye-btn`
- `rc-modal` (+ `.active` to show) wrapping `modal-window` > `rc-window-bar` + `modal-body`, with `modal-close-x` for the × button
- `rc-toast` (`--success/--error/--hide`), `rc-steps`/`rc-step`/`rc-step--active`, `rc-deco` floating symbols, `rc-center`
- **Dates flow:** `rc-window flow-window` + `flow-body` is the shared window for all 3 steps. `hero-title`/`hero-greeting` (+ `hero-greeting--sm`). `invitation-buttons` holds Sí/No.
- Page-specific sections: invitation (`animated-salutation`, carousel), slot machine, trap dropdown, activities modal, calendar (`rc-calendar`, `calendar-day`, `busy-*`, `is-start/is-end/in-range`), hour modal, landing (`land-*`, `hero-*`, `announcement-*`, `section-card*`)

Only `404.ejs` still has an inline `<style>` block (page-only `error-*` classes). The category mobile overrides live in the "CATEGORY PAGE — mobile" CSS section and are scoped with `.category-window`. They must stay after the slot machine, trap and activities sections. Use a double-class selector when a modifier has to beat an existing rule (e.g. `.hero-greeting.hero-greeting--sm` beats `.hero-title h1`). The mobile breakpoint convention is `max-width: 600px`.

---

## Known quirks, bugs and tech debt (observed, not yet fixed)

- **`doLogin`:** The profile query doesn't use `.single()`, so `profile` is an array. `profile.username` / `display_name` are always `undefined`, and `session.user.username` / `displayName` end up empty.
- **`isAuth`** redirects unauthenticated users to `/` (landing), not `/auth/login`.
- **No logout route:** `getLogout` exists but isn't wired to a route.
- **Unreachable code** in `dates.controller.js`: `session.error` / `redirect` lines come after `return response.status(...)`.
- `getCategoryPage` selects only `name, image` (no `id`), and the client identifies categories by **name**.
- **Timezones:** The client sends naive local datetimes, and the server on Render (UTC) stores them as `timestamptz`. The result is that Mexico City times end up stored as UTC. `formatAppointmentDateTime` and the ICS builder then format in server time and UTC.
- **`resend.js`** calls `resend.domains.create(...)` at module load, on every server start.
- **XSS surface:** Category and activity names go into `innerHTML` (`category.js`), and names go into the email HTML without escaping.
- **Vite/Tailwind:** `retro-cute.css` contains `@import "tailwindcss"; @plugin "daisyui"; @source ...`, but the file is served raw, so these directives do nothing in the browser. `vite.config.js` `outDir: '/src/public'` is an **absolute** filesystem path with `emptyOutDir: true`, so don't run `npm run build` without fixing it.
- **Dead or unused code:** `public/js/landing.js`, `utils/main.js`, `sendResetEmail`, `multer` / `https` / `fs` imports in server.js, and `isAuth` imports in the auth and landing routes.
- `layout.ejs` supports `hideDecos`, but `landing.controller` doesn't pass it.
- The landing announcement date reads `'8 Jul 2025'`, which is probably meant to be 2026. The step-1 letter hardcodes "9 meses juntos".
- A Windows artifact `.env.env:Zone.Identifier` is tracked in git. `.gitignore` now also ignores `*.txt` (uncommitted change), which keeps `future_implementations.txt` out of git.
- Session store is MemoryStore, so sessions are lost on restart and it isn't meant for production.
- Render's filesystem is **ephemeral**. Any feature that writes uploaded files to `src/public/images` (planned photo and category-image uploads) will lose them on redeploy unless they are stored in Supabase Storage or similar.

---

## Planned work (from `future_implementations.txt`)

### 1. Naming refactor (DONE)
The pages `dates` → `invitation` and `date` → `schedule`, with their JS files. Controller functions were renamed. Routes moved from `/date/*` to `/dates/*`. The `date-window`/`date-body`/`date-buttons` classes became `flow-window`/`flow-body`/`invitation-buttons`, and reusable inline styles moved to the CSS file. `future_implementations.txt` still uses the old names, so read `dates.controller.js` there as unchanged (the controller file kept its name).

### 2. Category page additions (`category.ejs` + `category.js` + `dates.controller.js`)
- **New category card** inside the "¡Una trampa para ti!" panel. It opens a modal styled with the existing `rc-modal` / `rc-window` components: close button, title "Nueva categoria", text input "Nombre", file upload "Imagen", and a "Crear" button.
  - Backend `crearCategoria(nombre, imagePath)` checks that no category has the same name. If none exists, it inserts into `public.category`, closes the modal, and shows the toast "Nueva Categoria:{nombre} creada!". If the name already exists, it shows "Esta categoria ya existe." inside the modal under the title.
- **"Añadir nueva actividad" button** inside the activities modal, styled like an activity option but in a different color. It closes the activities modal and opens a new modal: close button, title "Nueva Actividad", a disabled input with the category name, text input "Actividad", and a "Crear" button.
  - Backend `crearActividad(texto, categoryUUID)` checks that no activity has the same name in that category. If none exists, it inserts into `public.options`, closes this modal, and reopens the activities modal with the new activity visible. If it already exists, it shows "Esta actividad ya existe." under the title.
  - This needs the category **UUID** on the client. Today only name and image are sent.

### 3. New Home page (post-login main page; all JS in its own `home` file or functions)
- The window bar (the "ribbon" with the 3 dots) gets nav buttons: **Home** (this page), **Cita** (the current date flow), and **Gallery** (not built yet; 404 until it exists).
- Keeps the animated "Hola <rotating salutation>" greeting.
- Text: "Esta es la actualización de nuestro aniversario!"
- 3 flower emojis in a fan above a live **counter** (years, months, days, hours, minutes, seconds) counting from **2025-09-30 12:00 PM, America/Mexico_City**.
- **Letter** area: white background, special text in red, signature at bottom right, rounded corners.
- **Large photo slot:** an empty placeholder at first. Clicking it uploads a photo to the server. Once a photo is set, a small semi-transparent "repeat/change" icon button appears in the bottom-right corner of the image. This needs `multer` plus persistent storage.
- Photo-style caption: "Nuestro Primer Aniversario ❤️"
- Section **"Futuras citas":** a calendar. Hovering a day that has a date enlarges it and shows category, activity and hour, and hides again when the pointer leaves the enlarged day. This needs a query joining `dates → options → category`.
- Responsive, with everything centered on mobile.
- Also: change the step-1 (`invitation.ejs`) animated title to the static "**Nuestras Citas**".

### Open questions to settle before implementing
- Does Home replace `/dates/invitation` as the post-login redirect and live under its own route (e.g. `/home`)? The public landing at `/` stays as is.
- Where do uploaded images live: local disk (ephemeral on Render) or Supabase Storage?
- Does the "Esta categoria ya existe" check run case-insensitively?
- Should the counter and Futuras-citas calendar use Mexico City time explicitly? This interacts with the timezone quirk above.
