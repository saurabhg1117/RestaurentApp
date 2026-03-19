import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  // Prisma 7 requires either an adapter OR accelerateUrl
  ...(url?.startsWith('prisma+postgres://') 
    ? { accelerateUrl: url } 
    : {
        adapter: new PrismaPg(new pg.Pool({ connectionString: url }) as any),
      }),
} as any);

export default prisma;
