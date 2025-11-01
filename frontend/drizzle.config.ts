import type { Config } from 'drizzle-kit';

// Next.js automatically loads .env.local, no need for dotenv
export default {
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
