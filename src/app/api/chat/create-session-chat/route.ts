import { NextResponse } from "next/server";
import { createSessionChat } from "@/lib/chat";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("[Create Session Chat API] Starting request");
    
    const { sessionId } = await req.json();
    console.log("[Create Session Chat API] Session ID:", sessionId);
    
    if (!sessionId) {
      console.error("[Create Session Chat API] No session ID provided");
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Create Session Chat API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Create Session Chat API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    console.log("[Create Session Chat API] Verifying token...");
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Create Session Chat API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Create Session Chat API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("[Create Session Chat API] User authenticated:", user.id);

    // Check if user is a member of this session (either as DM or participant)
    console.log("[Create Session Chat API] Fetching session details...");
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        dm: true,
        bookings: true,
      },
    });

    if (!session) {
      console.error("[Create Session Chat API] Session not found:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("[Create Session Chat API] Session found:", {
      id: session.id,
      title: session.title,
      dmUserId: session.dm.userId,
      bookingCount: session.bookings.length
    });

    // Check if user is the DM or a participant
    const isDM = session.dm.userId === user.id;
    const isParticipant = session.bookings.some(booking => booking.userId === user.id);
    
    console.log("[Create Session Chat API] User permissions:", {
      userId: user.id,
      isDM,
      isParticipant,
      dmUserId: session.dm.userId,
      bookingUserIds: session.bookings.map(b => b.userId)
    });
    
    if (!isDM && !isParticipant) {
      console.error("[Create Session Chat API] User not authorized for session");
      return NextResponse.json({ error: "You must be a member of this session to access the chat" }, { status: 403 });
    }

    // Create or get the session chat, passing the current user ID
    console.log("[Create Session Chat API] Creating/getting session chat...");
    const chat = await createSessionChat(parseInt(sessionId), user.id);
    
    console.log("[Create Session Chat API] Chat created/found:", chat);
    return NextResponse.json({ chat });
  } catch (error) {
    console.error("[Create Session Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 