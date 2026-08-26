import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

const cleanConnectionString = connectionString
  .replace('&channel_binding=require', '')
  .replace('?channel_binding=require', '');

const client = postgres(cleanConnectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema };
