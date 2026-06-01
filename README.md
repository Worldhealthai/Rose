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
- No external services required — runs entirely on your machine.

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

| Role  | Email              | Password    |
| ----- | ------------------ | ----------- |
| Admin | `admin@rose.local` | `rose1234`  |
| Staff | `maria@rose.local` | `staff1234` |

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

1. **Change `AUTH_SECRET`** in `.env` to a long random value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. The SQLite file (`prisma/dev.db`) lives next to the app. Back it up regularly.
3. To move to a hosted database later, switch the Prisma `datasource` provider
   to `postgresql` in `prisma/schema.prisma`, update `DATABASE_URL`, and run
   `npm run db:push`.

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
