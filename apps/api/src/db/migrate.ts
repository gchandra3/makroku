/**
 * Database migration runner
 */

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from './index';
import { env } from '../config';

async function runMigrations() {
  console.log('Running database migrations...');

  const db = getDb();

  // Create migrations directory if it doesn't exist
  const fs = await import('fs');
  const path = await import('path');
  const migrationsDir = path.join(process.cwd(), 'src/db/migrations');

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  try {
    await migrate(db, { migrationsFolder: migrationsDir });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };