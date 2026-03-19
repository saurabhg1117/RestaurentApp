import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Prisma 7 support for both accelerate and normal postgres
  ...(process.env.DATABASE_URL?.startsWith('prisma+postgres://') 
    ? { accelerateUrl: process.env.DATABASE_URL } 
    : {
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      } as any),
});

export default prisma;
