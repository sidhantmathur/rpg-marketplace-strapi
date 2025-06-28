// src/lib/prisma.ts
import { PrismaClient } from "../generated/prisma";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure we have required environment variables
const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

if (!directUrl) {
  console.warn("[DB] DIRECT_URL environment variable is not set. This may cause issues in production.");
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
    datasources: {
      db: {
        url: dbUrl,
      },
    },
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

// Function to check active sessions
export async function checkActiveSessions() {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      include: {
        bookings: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
    
    return sessions;
  } catch (error) {
    console.error("[Prisma] Error checking active sessions:", error);
    throw error;
  }
}
