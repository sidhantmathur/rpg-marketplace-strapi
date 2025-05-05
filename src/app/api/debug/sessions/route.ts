import { NextResponse } from "next/server";
import { checkActiveSessions } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[Debug API] Attempting to check sessions...");
    const sessions = await checkActiveSessions();
    console.log("[Debug API] Successfully retrieved sessions:", sessions);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Debug API] Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: "Failed to check sessions",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
} 