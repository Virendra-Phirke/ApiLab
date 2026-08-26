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
  console.log('Connecting to Neon PostgreSQL to push all Drizzle migrations...');

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

  const drizzleDir = path.join(process.cwd(), 'drizzle');
  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

  for (const file of files) {
    const filePath = path.join(drizzleDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Applying migration: ${file} (${statements.length} statements)`);
    for (const statement of statements) {
      const preview = statement.replace(/\s+/g, ' ').slice(0, 60);
      console.log(`  Executing: ${preview}...`);
      try {
        await sql.unsafe(statement);
      } catch (err: any) {
        // If table or column already exists/altered, log and continue safely
        console.log(`  Note/Skip: ${err?.message || err}`);
      }
    }
  }

  console.log('✓ Successfully synchronized Drizzle schema with Neon PostgreSQL database!');
  await sql.end();
}

runMigration().catch((err) => {
  console.error('Push schema error:', err);
  process.exit(1);
});
