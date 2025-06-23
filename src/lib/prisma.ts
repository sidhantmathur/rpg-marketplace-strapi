// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure we have a database URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Log the connection attempt (with masked credentials)
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`[DB] Attempting to connect to database: ${maskedUrl}`);

if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: [
      { level: 'warn', emit: 'stdout' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
    ],
  });
}

const prisma = global.prisma;

// Handle cleanup on process termination
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
  
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
    console.log("[DB] Disconnected from database");
  });
}

export default prisma;
