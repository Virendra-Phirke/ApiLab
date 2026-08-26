import { Resolver } from 'dns/promises';
import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_TOKEN ||
  '';

let pool: Pool;

if (connectionString) {
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = url.pathname.replace(/^\//, '');
    const port = parseInt(url.port || '5432', 10);

    const poolConfig: PoolConfig = {
      host: hostname,
      port,
      database,
      user: username,
      password,
      ssl: {
        servername: hostname,
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };

    // Pre-resolve hostname via public DNS to guarantee connectivity on Windows/local networks
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    resolver
      .resolve4(hostname)
      .then((ips) => {
        if (ips && ips.length > 0) {
          (poolConfig as any).host = ips[0];
        }
      })
      .catch(() => {
        // use default hostname
      });

    pool = new Pool(poolConfig);
  } catch {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }
} else {
  pool = new Pool();
}

export const db = drizzle(pool, { schema });
export { schema };
