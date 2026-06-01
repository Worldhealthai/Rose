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
- **Team** — add employees with an **hourly rate**, position, photo and login
  (Staff or Admin). Reset passwords, deactivate or remove people.
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
- **Profile** — set your photo, update your phone, change your password.

### Login
- **Username + password.** Admin signs in with username `Admin`.
- **Staff tap their photo** on the sign-in screen, then type their password.
  They set their own photo from **Profile**.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (custom forest dark-green theme, mobile-first)
- **Prisma** ORM + **PostgreSQL**
- Cookie session auth (signed JWT via `jose`, passwords hashed with `bcryptjs`)

---

## Deploy to Vercel (recommended)

You'll need a free **Supabase** database (sign in with GitHub) and your
**Vercel** project.

1. **Create a free database.** At [supabase.com](https://supabase.com), sign in
   with GitHub and create a project. Set a **database password** and keep it
   handy. Then go to *Project Settings → Database → Connection string* and pick
   **Session pooler**. Copy that string and replace `[YOUR-PASSWORD]` with the
   password you set. It looks like:
   ```
   postgresql://postgres.abcd1234:YOURPASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
   ```
   > ⚠️ Use the **Session pooler** string — *not* the "Direct connection".
   > Vercel can't reach Supabase's direct connection (it's IPv6-only), which
   > causes "Can't reach database server" errors.

2. **Import the repo into Vercel.** At [vercel.com](https://vercel.com) → *Add
   New → Project* → import this repository. It's detected as Next.js
   automatically (via the included `vercel.json`).

3. **Add Environment Variables** (on the import screen, or *Project → Settings →
   Environment Variables*):
   | Name            | Value                                                        |
   | --------------- | ------------------------------------------------------------ |
   | `DATABASE_URL`  | your Supabase **Session pooler** string (with the password)  |
   | `AUTH_SECRET`   | a long random string (see command below)                     |
   | `ADMIN_PASSWORD`| *(optional)* a strong admin password — otherwise `admin123`  |

   Generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   > When adding each variable, tick **all** environments (Production, Preview
   > and Development). A deploy from a non-production branch runs as a *Preview*,
   > so a Production-only variable won't be visible and the build will fail with
   > `Can't reach database server at HOST:5432`.

4. **Deploy.** The build automatically creates the database tables.

5. **Open your site and sign in** as username **`Admin`** / password
   **`admin123`** (or your `ADMIN_PASSWORD`). Go to **Settings**, change the
   password, then add your team under **Team**. Share the Vercel link with your
   staff — they tap their photo to log in.

> Pushing to the connected branch makes Vercel redeploy automatically.

---

## Run locally (optional)

Needs a PostgreSQL database — you can reuse the same Supabase one.

```bash
npm install
# put your DATABASE_URL and AUTH_SECRET in .env (copy from .env.example)
npm run setup   # create tables + load demo data
npm run dev     # http://localhost:3000
```

Demo logins after `npm run setup`:

| Role  | Username | Password    |
| ----- | -------- | ----------- |
| Admin | `Admin`  | `admin123`  |
| Staff | `maria`  | `staff1234` |

---

## Commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the dev server                                  |
| `npm run build`     | Production build                                      |
| `npm run setup`     | Create DB tables + seed demo data                     |
| `npm run seed`      | (Re)load demo data — safe to re-run                   |
| `npm run db:push`   | Sync the Prisma schema to the database                |
| `npm run db:studio` | Browse/edit data in Prisma Studio                     |

---

## Project structure

```
app/
  login/            Sign-in (photo tiles + username) + auth actions
  admin/            Admin portal (dashboard, rota, employees, income,
                    suppliers, orders, settings) — each with its own actions.ts
  staff/            Staff portal (shifts, availability, profile)
components/         Reusable UI: PortalShell, charts, Avatar, icons…
lib/                prisma, session/auth, money, dates, calc, analytics
prisma/
  schema.prisma     Data model (PostgreSQL)
  seed.ts           Demo data
```

A default admin is created automatically the first time the app runs against an
empty database, so a fresh deploy is ready to sign in to immediately.
