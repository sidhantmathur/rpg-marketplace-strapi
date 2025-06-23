import { NextResponse } from "next/server";
import { createSessionChat } from "@/lib/chat";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionIdNum = parseInt(sessionId);
    console.log("[Book API] Starting booking process for session:", sessionIdNum);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Book API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Book API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Book API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Book API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("[Book API] User authenticated:", user.id);

    // Check if session exists and has capacity
    const session = await prisma.session.findUnique({
      where: { id: sessionIdNum },
      include: {
        bookings: true,
      },
    });

    if (!session) {
      console.error("[Book API] Session not found");
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    console.log("[Book API] Session found:", session.id);

    if (session.bookings.length >= session.maxParticipants) {
      console.error("[Book API] Session is full");
      return NextResponse.json(
        { error: "Session is full" },
        { status: 400 }
      );
    }

    // Check if user is already booked
    const isAlreadyBooked = session.bookings.some(
      (booking) => booking.userId === user.id
    );

    if (isAlreadyBooked) {
      console.error("[Book API] User already booked");
      return NextResponse.json(
        { error: "Already booked for this session" },
        { status: 400 }
      );
    }

    // Create booking
    try {
      await prisma.booking.create({
        data: {
          sessionId: sessionIdNum,
          userId: user.id,
        },
      });
      console.log("[Book API] Booking created successfully");
    } catch (bookingError) {
      console.error("[Book API] Booking error:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 400 }
      );
    }

    // Create session chat if it doesn't exist
    try {
      await createSessionChat(sessionIdNum, user.id);
      console.log("[Book API] Session chat created successfully");
    } catch (chatError) {
      console.error("[Book API] Failed to create session chat:", chatError);
      // Don't fail the booking if chat creation fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Book API] Error creating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 