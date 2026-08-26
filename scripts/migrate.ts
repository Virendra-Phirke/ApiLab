import { Resolver } from 'dns/promises';
import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_TOKEN || '';

if (!connectionString) {
  console.error('Error: DATABASE_URL not found in .env');
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to Neon PostgreSQL to push Drizzle schema...');

  // Parse URL
  const url = new URL(connectionString);
  const hostname = url.hostname;
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\//, '');
  const port = parseInt(url.port || '5432', 10);

  // Resolve hostname using public DNS servers (8.8.8.8, 1.1.1.1) to bypass local DNS issues
  let hostIp = hostname;
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    const ips = await resolver.resolve4(hostname);
    if (ips && ips.length > 0) {
      hostIp = ips[0];
      console.log(`Resolved ${hostname} -> ${hostIp}`);
    }
  } catch (dnsErr) {
    console.warn('DNS lookup fallback warning:', dnsErr);
  }

  const sql = postgres({
    host: hostIp,
    port,
    database,
    username,
    password,
    ssl: {
      servername: hostname,
      rejectUnauthorized: true,
    },
    max: 1,
  });

  const migrationPath = path.join(process.cwd(), 'drizzle', '0000_boring_scarecrow.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // Split statements by statement-breakpoint
  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 50);
    console.log(`Executing: ${preview}...`);
    await sql.unsafe(statement);
  }

  console.log('✓ Successfully pushed schema and created all tables in Neon PostgreSQL!');
  await sql.end();
}

runMigration().catch((err) => {
  console.error('Push schema error:', err);
  process.exit(1);
});
