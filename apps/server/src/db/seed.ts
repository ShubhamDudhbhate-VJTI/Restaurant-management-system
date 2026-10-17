import { db } from './client';
import { users, tables, categories, menuItems } from './schema';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { Role } from '@/contracts';

async function seed() {
  console.log("Seeding started...");

  // Create staff users
  const staff = [
    { name: 'Admin User', email: 'admin@rms.local', role: Role.ADMIN },
    { name: 'Kitchen User', email: 'kitchen@rms.local', role: Role.KITCHEN },
    { name: 'Cashier User', email: 'cashier@rms.local', role: Role.CASHIER },
    { name: 'Waiter User', email: 'waiter@rms.local', role: Role.WAITER },
    { name: 'Demo Customer', email: 'customer@rms.local', role: Role.CUSTOMER },
  ];

  for (const user of staff) {
    const passwordHash = await argon2.hash('password123');
    await db.insert(users).values({
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role
    }).onConflictDoNothing({ target: users.email }); // Specify target for PG
  }

  // Create tables
  const sampleTables = [
    { name: 'Table 1', seats: 2 },
    { name: 'Table 2', seats: 4 },
    { name: 'Table 3', seats: 4 },
    { name: 'Table 4', seats: 6 },
    { name: 'Table 5', seats: 4 },
    { name: 'Table 6', seats: 2 },
    { name: 'Table 7', seats: 6 },
    { name: 'Table 8', seats: 4 },
    { name: 'Patio 1', seats: 2 },
    { name: 'Patio 2', seats: 4 },
  ];

  for (const t of sampleTables) {
    const existing = await db.select({ id: tables.id }).from(tables).where(eq(tables.name, t.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(tables).values({ name: t.name, seats: t.seats });
    }
  }

  const sampleMenu = [
    {
      name: 'Small Plates',
      items: [
        ['Burrata & Tomatoes', 'Creamy burrata, heirloom tomatoes, basil oil.', 42500],
        ['Crispy Polenta', 'Golden polenta, parmesan, roasted garlic aioli.', 29500],
        ['Charred Corn Ribs', 'Lime, smoked paprika, coriander, sea salt.', 27500],
      ],
    },
    {
      name: 'Mains',
      items: [
        ['Margherita Pizza', 'San Marzano tomato, mozzarella, basil.', 36500],
        ['Wild Mushroom Pasta', 'Tagliatelle, roasted mushrooms, thyme cream.', 44500],
        ['Grilled Paneer Bowl', 'Charred paneer, grains, greens, mint chutney.', 39500],
        ['Lemon Herb Chicken', 'Roasted chicken, greens, jus, crispy potatoes.', 52500],
      ],
    },
    {
      name: 'Drinks',
      items: [
        ['House Lemonade', 'Fresh lemon, mint, sparkling water.', 16000],
        ['Cold Brew', 'Slow-steeped coffee served over ice.', 22000],
      ],
    },
    {
      name: 'Desserts',
      items: [
        ['Basque Cheesecake', 'Burnt-top cheesecake with berry compote.', 32500],
        ['Chocolate Pot de Crème', 'Dark chocolate custard, sea salt, cacao nibs.', 29500],
      ],
    },
  ] as const;

  for (const [categoryIndex, category] of sampleMenu.entries()) {
    let categoryRow = (await db.select().from(categories).where(eq(categories.name, category.name)).limit(1))[0];
    if (!categoryRow) {
      categoryRow = (await db.insert(categories).values({ name: category.name, sortOrder: categoryIndex }).returning())[0];
    }

    for (const [itemIndex, [name, description, priceCents]] of category.items.entries()) {
      const existing = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.name, name)).limit(1);
      if (existing.length === 0 && categoryRow) {
        await db.insert(menuItems).values({
          categoryId: categoryRow.id,
          name,
          description,
          priceCents,
          sortOrder: itemIndex,
          isAvailable: true,
        });
      }
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
