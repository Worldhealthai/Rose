# 🌹 Rose Restaurant

A simple, mobile-friendly management system for **Rose Restaurant** with an
**admin portal** for management and a minimalist **staff portal** for the team.
Forest dark-green theme throughout.

---

## What it does

### Admin portal (`/admin`)
- **Dashboard** — today / this week / this month takings, 30-day income trend,
  channel mix donut, who's working today, weekly labour cost & labour-vs-revenue
  %, and an "items to order" reminder.
- **Rota** — weekly shift scheduler. Add/assign/edit/delete shifts per day,
  see hours and estimated labour cost. Open (unassigned) shifts supported.
- **Team** — add employees with an **hourly rate**, position and phone; give
  each a login (Staff or Admin). Reset passwords, deactivate or remove people.
- **Income** — enter a day's takings split into **Z report (till)**,
  **Just Eat**, **Uber Eats** and **Deliveroo**. Monthly totals, averages,
  best day, delivery share, per-day breakdown and a daily bar chart.
- **Suppliers** — a contact book. Open any supplier as a **profile** with
  tap-to-call / email links, website, address and notes.
- **Order list** — every product is linked to a supplier. Flag what you **need
  to order** (with a "how much" note), grouped by supplier, with a one-tap link
  to that supplier's contact details and a "mark all ordered" button.
- **Settings** — restaurant name and change-your-password.

### Staff portal (`/staff`)
- **My shifts** — next shift, this week's hours & estimated pay, and all
  upcoming shifts. Bottom-tab navigation, designed to be dead simple on a phone.
- **Availability** — tick the days you can work and set preferred hours / notes.
- **Profile** — see your rate & details, update your phone, change your password.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (custom forest dark-green theme, mobile-first)
- **Prisma** ORM + **SQLite** (zero-config, file-based database)
- Cookie session auth (signed JWT via `jose`, passwords hashed with `bcryptjs`)
- **Username + password** login. Staff can set a profile photo and simply tap
  it on the sign-in screen; managers sign in by username.
- No external services required for local use — runs entirely on your machine.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create the database and load demo data (admin login + sample week)
npm run setup

# 3. Start the app
npm run dev
```

Then open **http://localhost:3000**.

### Demo logins

| Role  | Username | Password    |
| ----- | -------- | ----------- |
| Admin | `Admin`  | `admin123`  |
| Staff | `maria`  | `staff1234` |

Usernames are case-insensitive. Staff can also just tap their photo on the
login screen and enter their password.

> Change these straight away from **Settings** (admin) / **Profile** (staff),
> and delete any demo accounts you don't need from **Team**.

---

## Useful commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the dev server                                  |
| `npm run build`     | Production build                                      |
| `npm run start`     | Run the production build                              |
| `npm run setup`     | Create DB schema + seed demo data                     |
| `npm run seed`      | (Re)load demo data — safe to re-run, won't duplicate  |
| `npm run db:push`   | Sync the Prisma schema to the database                |
| `npm run db:studio` | Open Prisma Studio to browse/edit data                |

---

## Going to production

1. **Change `AUTH_SECRET`** in `.env` (or your host's env vars) to a long random
   value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Where to host

The app needs a database that can be **written to** at runtime.

- **A server / VPS / Railway / Render** (a long-running Node process with a disk):
  SQLite works as-is. Deploy, set `DATABASE_URL` + `AUTH_SECRET`, run
  `npm run setup`, then `npm run start`.
- **Vercel / Netlify / other serverless** (the filesystem is read-only and
  resets on every request): SQLite **won't persist** — you must use a hosted
  database. Create a free **Postgres** (e.g. Neon or Vercel Postgres), then:
  1. In `prisma/schema.prisma` change `provider = "sqlite"` to
     `provider = "postgresql"`.
  2. Set `DATABASE_URL` to the Postgres connection string (in Vercel's
     Environment Variables) and `AUTH_SECRET` too.
  3. Run `npx prisma db push` then `npm run seed` against that database once.

The included `vercel.json` already tells Vercel to build this as a Next.js app.

---

## Project structure

```
app/
  login/            Sign-in page + auth actions
  admin/            Admin portal (dashboard, rota, employees, income,
                    suppliers, orders, settings) — each with its own actions.ts
  staff/            Staff portal (shifts, availability, profile)
components/         Reusable UI: PortalShell, charts, cards, icons…
lib/                prisma, session/auth, money, dates, calc, analytics
prisma/
  schema.prisma     Data model
  seed.ts           Demo data
```

All data mutations use server actions; pages are server-rendered and read
directly from the database, so the app works with JavaScript-light forms.
