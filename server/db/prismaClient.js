// Centralized Shared Prisma Client Singleton Instance
import { PrismaClient } from '@prisma/client';

let globalPrisma = globalThis.prisma || null;

if (!globalPrisma) {
  try {
    globalPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prisma = globalPrisma;
    }
  } catch (err) {
    console.warn('PrismaClient singleton initialization warning:', err.message);
  }
}

export default globalPrisma;
