/**
 * Database seed script — fetches World Bank data and populates SQLite.
 *
 * Usage: npx tsx src/db/seed.ts [country]
 *   npx tsx src/db/seed.ts             → seeds all countries
 *   npx tsx src/db/seed.ts Indonesia   → seeds Indonesia only
 */

import { indicatorService } from "../services/indicator.service";

async function main() {
  const country = process.argv[2];
  console.log(country ? `Seeding ${country}...` : "Seeding all countries...");

  const result = await indicatorService.seedDatabase(country);
  console.log(`Done — ${result.seeded} indicators seeded.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});