// src/lib/prisma.ts
import { PrismaClient, Prisma } from "@prisma/client";

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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to execute with retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[DB] ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        const delayMs = RETRY_DELAY * attempt; // Exponential backoff
        console.log(`[DB] Retrying ${operationName} in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }
  
  throw new Error(`[DB] ${operationName} failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: [
      { level: 'warn', emit: 'stdout' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
    ],
  });

  // Log connection attempts with retry
  withRetry(
    () => global.prisma!.$connect(),
    "Database connection"
  ).then(() => {
    console.log("[DB] Successfully connected to database");
  }).catch((err) => {
    console.error("[DB] Failed to connect after retries:", err);
    process.exit(1); // Exit if we can't connect after retries
  });
}

const prisma = global.prisma;

// Function to check active sessions
async function checkActiveSessions() {
  return withRetry(async () => {
    // This is a raw SQL query to check active sessions
    const result = await prisma.$queryRaw`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        backend_start,
        state,
        query
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND state != 'idle'
      ORDER BY backend_start DESC;
    `;
    console.log("[DB] Active sessions:", result);
    return result;
  }, "Check active sessions");
}

// Handle connection errors with retry
withRetry(
  () => prisma.$connect(),
  "Database connection"
).then(() => {
  console.log("[DB] Successfully connected to database");
  // Check active sessions on connection
  checkActiveSessions().catch(console.error);
}).catch((error) => {
  console.error("[DB] Failed to connect to database after retries:", error);
});

// Handle cleanup on process termination
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
  
  process.on("beforeExit", async () => {
    await withRetry(
      () => prisma.$disconnect(),
      "Database disconnection"
    ).catch(console.error);
    console.log("[DB] Disconnected from database");
  });
}

// Export a wrapped version of prisma with retry logic
const prismaWithRetry: PrismaClient = {
  ...prisma,
  $queryRaw: async (...args: Parameters<typeof prisma.$queryRaw>) => 
    withRetry(() => prisma.$queryRaw(...args), "Raw query"),
  $executeRaw: async (...args: Parameters<typeof prisma.$executeRaw>) => 
    withRetry(() => prisma.$executeRaw(...args), "Raw execute"),
  $transaction: async (...args: Parameters<typeof prisma.$transaction>) => 
    withRetry(() => prisma.$transaction(...args), "Transaction"),
} as PrismaClient;

// Add retry logic to all model operations
Object.keys(prisma).forEach((key) => {
  if (typeof prisma[key as keyof typeof prisma] === 'object' && prisma[key as keyof typeof prisma] !== null) {
    const model = prisma[key as keyof typeof prisma] as any;
    if (model && typeof model.findMany === 'function') {
      (prismaWithRetry as any)[key] = {
        ...model,
        findMany: async (...args: any[]) => 
          withRetry(() => model.findMany(...args), `${key}.findMany`),
        findUnique: async (...args: any[]) => 
          withRetry(() => model.findUnique(...args), `${key}.findUnique`),
        create: async (...args: any[]) => 
          withRetry(() => model.create(...args), `${key}.create`),
        update: async (...args: any[]) => 
          withRetry(() => model.update(...args), `${key}.update`),
        delete: async (...args: any[]) => 
          withRetry(() => model.delete(...args), `${key}.delete`),
      };
    }
  }
});

export { checkActiveSessions };
export default prismaWithRetry;
