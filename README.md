# Duolingo Web App Clone

A functional clone of the Duolingo web application built for the SDE Fullstack assignment. It reproduces Duolingo's winding learning path, the five-exercise lesson loop, and the full gamification layer — XP, streaks, hearts, crowns, achievements, legendary unit challenges and a live leaderboard — with every piece of learner progress persisted server-side.

**Live demo:** _<add the Vercel URL>_
**API:** _<add the backend URL>_ — interactive docs at `/docs`
**Repository:** https://github.com/hetmehta10/duolingo-clone

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3.4 with a custom Duolingo token set |
| State | React Context + `fetch` |
| Backend | Python 3.11, FastAPI, Pydantic v2 |
| ORM | SQLAlchemy 2.0 (typed `Mapped[]` declarative style) |
| Database | SQLite |

No component library, no icon library, no state library, no animation library, no migration tool. Every icon and the owl mascot are hand-authored inline SVG. Tables are created with `Base.metadata.create_all()` and filled by an idempotent seed script that runs on boot, which suits a single seeded database better than a migration chain.

---

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed               # creates app.db and populates it
uvicorn main:app --reload --port 8000
```

API at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:3000`.

### Environment variables

| Where | Variable | Default | Purpose |
|---|---|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL. Inlined at build time, so it must be set before `next build` |
| backend | `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| backend | `DATABASE_URL` | `sqlite:///backend/app.db` | Database location |
| backend | `ENABLE_DEV_ENDPOINTS` | `true` | Set to `false` to make `/api/dev/*` return 404 |

### Resetting the database

```bash
cd backend && rm app.db && python -m app.seed
```

---

## Project Structure

```
backend/
  main.py                  FastAPI app, lifespan hook (create tables + seed), CORS, router registration
  Dockerfile               Container image for deployment (non-root user, port 7860)
  app/
    database.py            Engine, SessionLocal, Base, get_db, PRAGMA foreign_keys hook
    models.py              13 SQLAlchemy models
    schemas.py             Pydantic v2 request/response contracts
    seed.py                Idempotent seed script
    routers/               HTTP layer only — no business logic
      users.py  course.py  sessions.py  leaderboard.py  dev.py
    services/              All business rules, independently testable
      hearts.py            Lazy regeneration, decrement, gem refill
      streaks.py           Daily XP upsert, streak roll-over, 7-day calendar
      grading.py           Normalisation and per-type answer checking
      progression.py       Exercise sampling, crown advancement, XP, achievements, legendary
    utils/timeutils.py     IST time base

frontend/
  app/
    page.tsx                         The winding learning path
    lesson/[skillId]/page.tsx        Lesson player
    lesson/legendary/[unitId]/page.tsx  Legendary unit challenge
    profile/  leaderboard/  quests/  shop/  settings/
    layout.tsx  globals.css
  components/
    ui/          DuoButton, ProgressBar, HeartCounter, Avatar, Mascot, Icons, Toast
    layout/      AppShell, Sidebar, TopBar, RightRail
    path/        PathNode, NodePopover, UnitHeader, LegendaryNode
    exercises/   MultipleChoice, WordBank, MatchPairs, FillBlank, TypeAnswer
    modals/      LessonComplete, OutOfHearts, QuitConfirm, PaymentModal
  context/
    UserContext.tsx          Current learner, top-bar state, refreshUser, switchUser
    PreferencesContext.tsx   Theme and sound, persisted to localStorage
  lib/
    api.ts       Typed fetch client, ApiError carrying the backend detail string
    types.ts     Interfaces mirroring every API response
    grade.ts     Client-side grading, a direct port of services/grading.py
    speech.ts    Browser speech-synthesis wrapper
  tailwind.config.ts   Design tokens, dark mode via class strategy
```

---

## Architecture Overview

```
┌────────────────────────────────┐        ┌──────────────────────────────┐
│  Next.js (App Router)          │        │  FastAPI                     │
│                                │        │                              │
│  /              winding path   │        │  routers/   validate + shape │
│  /lesson/[id]   lesson player  │◄──────►│  services/  all business     │
│  /lesson/legendary/[unitId]    │  JSON  │             rules            │
│  /profile /leaderboard         │        │  schemas.py Pydantic v2      │
│  /quests /shop /settings       │        │  models.py  SQLAlchemy 2.0   │
│                                │        └──────────────┬───────────────┘
│  UserContext + PreferencesCtx  │                       │
│  lib/api.ts  lib/grade.ts      │               ┌───────▼────────┐
└────────────────────────────────┘               │ SQLite app.db  │
                                                 └────────────────┘
```

**Separation of concerns.** Routers validate input and shape responses; they hold no business logic. Every rule — heart regeneration, streak roll-over, crown advancement, XP award, achievement unlocking, legendary pass/fail — lives in a service module, so it is testable in isolation and never duplicated across endpoints.

**The lesson request flow.** The client starts a session; the backend samples six exercises from the skill's pool and returns them. The browser grades each answer locally so feedback is instant, mirroring how the real Duolingo client behaves, and then posts the completed session back. The server re-grades every answer against the database and is the sole authority on XP awarded, hearts lost, crown progression, streak continuation and daily-goal contribution. The client renders fast but cannot mint progress.

`frontend/lib/grade.ts` is a deliberate line-by-line port of `backend/app/services/grading.py` — identical accent stripping, punctuation removal, case folding and `accepted`-variant handling — so client and server can never disagree on the same answer.

---

## Database Schema

13 tables. Foreign keys are enforced at the SQLite level through a `PRAGMA foreign_keys=ON` connection hook, every foreign key is indexed, and children that cannot exist without their parent cascade on delete.

```
courses ──< units ──< skills ──< exercises
              │         │
users ──1:1── user_states
  │           │         │
  ├──< user_unit_progress
  ├──< user_skill_progress ──┘
  ├──< lesson_sessions ──< session_answers >── exercises
  ├──< daily_xp
  └──< user_achievements >── achievements
```

| Table | Columns | Role |
|---|---|---|
| `users` | `id`, `username` (unique), `display_name`, `avatar_color`, `is_default_learner`, `created_at` | Identity only |
| `user_states` | `user_id` (unique), `total_xp`, `gems`, `hearts`, `hearts_updated_at`, `current_streak`, `longest_streak`, `last_activity_date`, `daily_goal_xp` | 1:1 with `users`. Volatile gamification state is kept out of the identity table so profile and counters evolve independently |
| `courses` | `from_language`, `to_language`, `title` | One seeded course |
| `units` | `course_id`, `order_index`, `title`, `description`, `theme_color` | Units own the path's colour banding |
| `skills` | `unit_id`, `order_index`, `title`, `icon_name`, `max_crown_level`, `lessons_per_level` | One node on the path |
| `exercises` | `skill_id`, `exercise_type`, `prompt`, `correct_answer` (JSON), `options` (JSON), `hint`, `order_index` | Belongs to a **skill**, not a lesson |
| `user_skill_progress` | `user_id`, `skill_id`, `crown_level`, `lessons_done_in_level`, `is_unlocked`, `completed_at` | Unique per pair. Alone determines whether a node renders locked, available, in-progress or gold |
| `user_unit_progress` | `user_id`, `unit_id`, `is_legendary`, `legendary_completed_at` | Unique per pair. Drives the legendary trophy node |
| `lesson_sessions` | `user_id`, `skill_id` (nullable), `unit_id` (nullable), `crown_level`, `is_practice`, `is_legendary`, `status`, `xp_awarded`, `hearts_lost`, `started_at`, `completed_at` | One attempt. A check constraint enforces that exactly one of `skill_id` and `unit_id` is set |
| `session_answers` | `session_id`, `exercise_id`, `user_answer`, `is_correct`, `answered_at` | What the server re-grades into |
| `daily_xp` | `user_id`, `date`, `xp_earned` — unique per pair | Drives three features at once: the streak, the daily-goal ring, and the leaderboard window |
| `achievements` | `code` (unique), `title`, `description`, `icon_name`, `tier`, `threshold` | Definitions |
| `user_achievements` | `user_id`, `achievement_id`, `progress`, `earned_at` | Per-learner progress, unique per pair |

### Design decisions worth noting

**Exercises belong to a skill, not a lesson.** A lesson does not own a fixed list of rows; it samples six from its skill's pool of ten at session start. This mirrors Duolingo's spaced-repetition approach, keeps repeated crown levels from being identical, and avoids duplicating exercise rows for every lesson of every crown level. Sampling guarantees one of each of the five types plus one extra, never two `match_pairs`, and never opens a lesson on `match_pairs`.

**Gamification state is split from identity.** `users` changes almost never; `user_states` changes on every answer. Separating them keeps the write-hot row small and makes the profile query cheap.

**`daily_xp` is the single source of truth for time-based features.** The streak is derived from consecutive dated rows rather than trusting a standalone counter, so it cannot drift.

**Failed sessions are retained.** They are not deleted, so history stays auditable and accuracy-based achievements such as `sharpshooter` have real data to read.

**Sessions target either a skill or a unit.** A normal lesson sets `skill_id`; a legendary challenge sets `unit_id`. The `ck_session_target` check constraint makes the invariant explicit at the database level rather than relying on application code.

### Exercise JSON shapes

| Type | `options` | `correct_answer` |
|---|---|---|
| `multiple_choice` | `{"choices": [...]}` | `{"value": "la manzana"}` |
| `translate_word_bank` | `{"bank": [...]}` | `{"value": "El niño bebe leche"}` |
| `match_pairs` | `{"pairs": [["el agua","the water"], ...]}` | `{"value": "all_matched"}` |
| `fill_blank` | `{"choices": [...]}` | `{"value": "soy"}` |
| `type_answer` | `null` | `{"value": "Buenos días", "accepted": ["Buenos dias"]}` |

`fill_blank` prompts mark the gap with `___`. `type_answer` uses `accepted` for unaccented and near-miss variants, on top of the normalisation both sides apply.

---

## Seeded Data

| Table | Rows |
|---|---|
| `users` / `user_states` | 6 / 6 |
| `courses` | 1 — Spanish from English |
| `units` | 3 — Basics, Phrases, Travel |
| `skills` | 9 — 3 per unit |
| `exercises` | 90 — exactly 10 per skill, 2 of each of the 5 types |
| `user_skill_progress` | 54 |
| `user_unit_progress` | 18 |
| `daily_xp` | 29 — 7 consecutive days for the default learner |
| `achievements` / `user_achievements` | 8 / 14 |

The default learner starts mid-course so every path state is visible on first load: Greetings at crown 5 and gold, Basics 1 mid-crown with a partial ring, Basics 2 just started, Common Phrases unlocked and current with a bouncing START label, and the remaining five locked.

---

## API Overview

All routes sit under `/api`. Full interactive documentation at `/docs`.

### Users

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/users` | All learners — powers the dev profile switcher |
| `GET` | `/api/users/{id}` | Top-bar payload: XP, gems, hearts, `seconds_until_next_heart`, streak, daily goal |
| `GET` | `/api/users/{id}/profile` | The above plus `joined_at`, `total_crowns`, `total_lessons_completed`, all achievements and a 7-day streak calendar |
| `POST` | `/api/users/{id}/refill-hearts` | Spend 350 gems to refill; 400 if already full or short on gems |

### Course

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/course?user_id=` | The whole path: units, skills, crown levels, a derived `state` of `locked` / `available` / `in_progress` / `completed`, plus `is_legendary` and `legendary_unlocked` per unit |

### Sessions

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/sessions` | Start a lesson with `skill_id`, or a legendary challenge with `unit_id`. Returns 403 `skill_locked`, `out_of_hearts` or `legendary_locked` |
| `POST` | `/api/sessions/{id}/complete` | Submit all answers. The server re-grades, awards XP, deducts hearts, advances crowns, updates the streak and unlocks achievements. This single response drives the entire completion modal |
| `POST` | `/api/sessions/{id}/abandon` | Quit mid-lesson with no penalty |

### Leaderboard

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/leaderboard?user_id=&limit=` | Live ranking computed from `total_xp` with a single `ORDER BY`, the current user flagged and their rank returned |

### Dev (test hooks)

The assignment permits day logic to be simulated and testable. These exist so streak and heart behaviour can be demonstrated without waiting hours or days. They are reachable from the dev panel in the right rail and can be disabled entirely with `ENABLE_DEV_ENDPOINTS=false`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/dev/advance-day?user_id=&days=` | Shift a learner's activity dates back so "tomorrow" arrives immediately |
| `POST` | `/api/dev/set-hearts?user_id=&hearts=` | Force a heart count to demonstrate the out-of-hearts flow |
| `POST` | `/api/dev/reset-user?user_id=` | Wipe a learner's progress back to seed defaults |

---

## Gamification Rules

| Rule | Value | Notes |
|---|---|---|
| Hearts | max 5 | One lost per wrong answer; the lesson fails at 0 with no XP and no progression |
| Heart regeneration | 1 per 4 hours | Timestamp-based and recomputed lazily on read from `hearts_updated_at`, so the value is always correct without a background scheduler |
| Heart refill | 350 gems | Available from the out-of-hearts modal and from the shop |
| XP per lesson | 10 | Plus a 5 XP bonus for a lesson with no mistakes |
| XP for practice | 5 | Review of an already-completed skill pays less, and does not advance the crown |
| XP for legendary | 40 | Awarded only on a pass |
| Crowns | 2 lessons per level, 5 levels | Reaching crown 5 completes the skill and unlocks the next in course order |
| Legendary challenge | 10 questions, 3 mistakes allowed | Unlocks when every skill in a unit reaches crown 5. **Does not consume hearts** — it runs on its own mistake budget, as in real Duolingo |
| Streak | consecutive days with XP | Derived from `daily_xp`, not a standalone counter |
| Leaderboard | live | Computed from real XP totals, so completing lessons visibly moves the learner's rank |
| Gems | mocked | Displayed and spent on refills, never earned |

---

## Time Handling

All datetimes are stored as naive **IST (UTC+05:30)** through `app/utils/timeutils.py`. There is deliberately no UTC conversion layer: the app serves a single region, and the streak must roll over at the learner's local midnight. Hosting containers run in UTC, so without this a lesson completed after 05:30 IST would land on the wrong `daily_xp` date and silently break the streak.

---

## Implemented Beyond the Core Requirements

| Feature | Notes |
|---|---|
| Achievements / badges | 8 badges; six recompute from real activity, shown with progress bars on the profile |
| Live leaderboard across seeded users | Real ranking, not a static list |
| Legendary challenge mode | Gold trophy node per unit, 10 questions, 3-mistake budget, no hearts consumed |
| Audio | Browser speech synthesis reads the Spanish aloud; speaker button per exercise, auto-play on mount, mutable from Settings and the top bar |
| Dark mode | Class-strategy Tailwind with CSS-variable semantic tokens, persisted to `localStorage`, applied before paint so there is no flash |
| Responsive design | Bottom tab bar under 768px, collapsed icon sidebar 768–1199px, full three-column layout at 1200px and above |

---

## Placeholder Sections

Present and discoverable, marked "Coming Soon" as the assignment permits:

- **Speech recognition** — a disabled microphone button beside each speaker button
- **In-app purchases / Super** — a full shop page with a Super banner, power-ups and gem bundles; the gem bundles and Super open a mocked checkout modal that is clearly labelled as a demo and changes no state. The heart refill in that page is real
- **Friends / social** — a FRIENDS tab on the leaderboard with an empty state
- **Multiple languages** — the top-bar course picker lists French, German, Japanese and Italian as "Soon"
- **Quests** — the daily quest is live and reads real XP; Friends Quests and Monthly Challenge are placeholders
- **Settings** — Dark Mode and Sound Effects are functional; six further rows are "Coming Soon"

---

## Assumptions

- Authentication is out of scope per the assignment. A default learner (`het`) is assumed logged in, and a dev-only profile switcher in the right rail makes per-user persistence demonstrable.
- One language course is seeded, as permitted.
- Duolingo's Feather Bold and DIN Round typefaces are proprietary, so Nunito is used as the closest free rounded match. The owl mascot is original artwork authored as inline SVG, not Duolingo's Duo.
- The `scholar` and `photogenic` achievements carry seeded progress values; the other six recompute from real activity.
- On a free hosting tier the SQLite file is recreated when the container restarts. The seed is idempotent and runs on boot, so the app is always usable, but progress accumulated during a session does not survive a cold rebuild.

---

## Not Implemented

Timed practice, and responsive breakpoints below 375px.
