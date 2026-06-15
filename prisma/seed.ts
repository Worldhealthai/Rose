import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- date helpers (self-contained so this runs standalone via tsx) ---
function utcMidnight(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
function startOfWeekMon(d: Date): Date {
  const wd = (d.getUTCDay() + 6) % 7; // 0 = Mon
  return addDays(utcMidnight(d), -wd);
}
// deterministic pseudo-random in [0,1)
function rnd(seed: number): number {
  const x = Math.sin(seed * 99.13 + 7.7) * 10000;
  return x - Math.floor(x);
}

async function main() {
  const today = utcMidnight();

  // --- Accounts (idempotent via upsert on username) ---
  const adminPass = await bcrypt.hash("admin123", 10);
  const staffPass = await bcrypt.hash("staff1234", 10);

  await prisma.employee.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      email: "admin@rose.local",
      passwordHash: adminPass,
      role: "ADMIN",
      position: "Manager",
      hourlyRate: 0,
    },
  });

  const staffSeed = [
    { name: "Maria Garcia", username: "maria", position: "Chef", rate: 15 },
    { name: "John Smith", username: "john", position: "Waiter", rate: 11.5 },
    { name: "Aisha Khan", username: "aisha", position: "Kitchen Porter", rate: 11 },
    { name: "Leo Rossi", username: "leo", position: "Waiter", rate: 11.5 },
  ];
  const staff = [];
  for (const s of staffSeed) {
    staff.push(
      await prisma.employee.upsert({
        where: { username: s.username },
        update: {},
        create: {
          name: s.name,
          username: s.username,
          email: `${s.username}@rose.local`,
          passwordHash: staffPass,
          role: "STAFF",
          position: s.position,
          hourlyRate: s.rate,
          phone: "07700 900" + Math.floor(100 + rnd(s.rate) * 800),
        },
      }),
    );
  }

  // --- Suppliers + products (only if none exist) ---
  if ((await prisma.supplier.count()) === 0) {
    const suppliers = [
      {
        name: "Fresh Farm Produce",
        category: "Vegetables",
        contactName: "Tom Fields",
        phone: "020 7946 0101",
        email: "orders@freshfarm.co.uk",
        notes: "Order by 6pm for next-day delivery. Account #FF-204.",
        products: [
          { name: "Tomatoes", unit: "kg", needed: true, neededNote: "5 kg" },
          { name: "Onions", unit: "kg" },
          { name: "Lettuce", unit: "box", needed: true, neededNote: "1 box" },
          { name: "Potatoes", unit: "sack" },
          { name: "Mixed peppers", unit: "kg" },
        ],
      },
      {
        name: "Prime Meats Ltd",
        category: "Meat",
        contactName: "Dave Butcher",
        phone: "020 7946 0202",
        email: "sales@primemeats.co.uk",
        notes: "Min order £80. Deliveries Tue/Thu/Sat.",
        products: [
          { name: "Chicken breast", unit: "kg", needed: true, neededNote: "10 kg" },
          { name: "Beef mince", unit: "kg" },
          { name: "Lamb chops", unit: "kg" },
          { name: "Streaky bacon", unit: "pack" },
        ],
      },
      {
        name: "BevCo Drinks",
        category: "Drinks",
        contactName: "Sarah Lyne",
        phone: "020 7946 0303",
        email: "hello@bevco.co.uk",
        notes: "Free delivery over £150.",
        products: [
          { name: "Cola 330ml", unit: "case", needed: true, neededNote: "3 cases" },
          { name: "Sparkling water", unit: "case" },
          { name: "Orange juice", unit: "case" },
          { name: "Still water", unit: "case" },
        ],
      },
      {
        name: "Bakery House",
        category: "Bakery",
        contactName: "Luca Bianchi",
        phone: "020 7946 0404",
        email: "luca@bakeryhouse.co.uk",
        notes: "Daily delivery before 8am.",
        products: [
          { name: "Burger buns", unit: "box", needed: true, neededNote: "2 boxes" },
          { name: "Brioche buns", unit: "box" },
          { name: "Sourdough", unit: "each" },
          { name: "Baguettes", unit: "each" },
        ],
      },
    ];

    for (const s of suppliers) {
      const { products, ...data } = s;
      await prisma.supplier.create({
        data: { ...data, products: { create: products } },
      });
    }
  }

  // --- Daily income for the last 28 days (only if none exist) ---
  if ((await prisma.dailyIncome.count()) === 0) {
    for (let i = 27; i >= 0; i--) {
      const date = addDays(today, -i);
      const wd = (date.getUTCDay() + 6) % 7; // Mon=0
      const busy = wd >= 4; // Fri/Sat/Sun
      const base = busy ? 1050 : 700;
      await prisma.dailyIncome.create({
        data: {
          date,
          zReport: Math.round(base + rnd(i * 3) * 450),
          cash: Math.round(40 + rnd(i * 17) * 120),
          tide: Math.round(120 + rnd(i * 19) * 300),
          justEat: Math.round(90 + rnd(i * 5) * 260),
          uberEats: Math.round(70 + rnd(i * 7) * 230),
          deliveroo: Math.round(50 + rnd(i * 11) * 190),
          covers: Math.round((busy ? 80 : 45) + rnd(i * 13) * 60),
        },
      });
    }
  }

  // --- Shifts for the current week (only if none exist) ---
  if ((await prisma.shift.count()) === 0) {
    const monday = startOfWeekMon(today);
    const [maria, john, aisha, leo] = staff;
    const plan: { emp: (typeof staff)[number]; days: number[]; start: string; end: string; role: string }[] =
      [
        { emp: maria, days: [1, 2, 3, 4, 5], start: "10:00", end: "18:00", role: "Chef" },
        { emp: john, days: [3, 4, 5, 6], start: "17:00", end: "23:00", role: "Waiter" },
        { emp: aisha, days: [4, 5, 6], start: "12:00", end: "20:00", role: "Kitchen Porter" },
        { emp: leo, days: [0, 5, 6], start: "11:00", end: "17:00", role: "Waiter" },
      ];
    for (const p of plan) {
      for (const d of p.days) {
        await prisma.shift.create({
          data: {
            date: addDays(monday, d),
            start: p.start,
            end: p.end,
            role: p.role,
            employeeId: p.emp.id,
          },
        });
      }
    }
  }

  // --- Daily checklist tasks (only if none exist) ---
  if ((await prisma.task.count()) === 0) {
    await prisma.task.createMany({
      data: [
        { title: "Clean beer keg", area: "Bar", sortOrder: 1 },
        { title: "Check fridge temperatures", area: "Kitchen", sortOrder: 2 },
        { title: "Empty bins", area: "Kitchen", sortOrder: 3 },
        { title: "Wipe down tables", area: "Front of house", sortOrder: 4 },
        { title: "Restock napkins & cutlery", area: "Front of house", sortOrder: 5 },
        { title: "Mop kitchen floor", area: "Kitchen", sortOrder: 6 },
      ],
    });
  }

  console.log("✓ Seed complete.");
  console.log("  Admin login:  username 'Admin'  /  admin123");
  console.log("  Staff login:  username 'maria'  /  staff1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
