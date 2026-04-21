import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

type D1 = import('@cloudflare/workers-types').D1Database;

export function getDb(d1: D1) {
	return drizzle(d1 as unknown as Parameters<typeof drizzle>[0], { schema });
}

export type Db = ReturnType<typeof getDb>;
