/**
 * Drizzle ORM database setup
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '../config';
import * as schema from '../schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const sqlite = new Database(env.DATABASE_URL.replace('file:', ''));

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');
  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

export const db = getDb();

export function closeDb() {
  if (dbInstance) {
    // better-sqlite3 doesn't have a close method on the drizzle instance
    // We need to access the underlying connection
    // For now, we'll just null the instance
    dbInstance = null;
  }
}