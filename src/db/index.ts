import net from 'net';
import { Resolver } from 'dns/promises';
import pg, { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Patch pg.Client.prototype.connect to ensure public DNS resolution for Neon database endpoints
const originalConnect = pg.Client.prototype.connect;
(pg.Client.prototype as any).connect = function (callback?: any): any {
  const self = this as any;
  const originalHost = self.host;

  if (originalHost && typeof originalHost === 'string' && !net.isIP(originalHost) && originalHost.includes('.neon.tech')) {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    return resolver
      .resolve4(originalHost)
      .then((ips) => {
        if (ips && ips.length > 0) {
          self.host = ips[0];
          self.ssl = {
            ...(typeof self.ssl === 'object' ? self.ssl : {}),
            servername: originalHost,
            rejectUnauthorized: false,
          };
        }
        return originalConnect.call(self, callback);
      })
      .catch(() => originalConnect.call(self, callback));
  }

  return originalConnect.call(self, callback);
};

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

    pool = new Pool({
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
    });
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
