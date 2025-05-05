import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/utils/sendEmail";
import { supabase } from "@/lib/supabaseClient";

interface WaitlistRequest {
  sessionId: string | number;
  userId: string;
}

interface SessionWithBookingsAndWaitlist {
  id: number;
  title: string;
  date: Date;
  dmId: number;
  bookings: Array<{ userId: string }>;
  waitlist: Array<{ userId: string }>;
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Waitlist] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Waitlist] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Waitlist] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Waitlist] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { sessionId, userId } = (await req.json()) as WaitlistRequest;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify that the requesting user is the same as the user being added to waitlist
    if (user.id !== userId) {
      console.error("[Waitlist] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const session = (await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { bookings: true, waitlist: true },
    })) as SessionWithBookingsAndWaitlist | null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if already on waitlist
    const alreadyOnWaitlist = session.waitlist.some((w) => w.userId === userId);
    if (alreadyOnWaitlist) {
      return NextResponse.json({ error: "You are already on the waitlist" }, { status: 400 });
    }

    // Check if already booked
    const alreadyBooked = session.bookings.some((b) => b.userId === userId);
    if (alreadyBooked) {
      return NextResponse.json(
        { error: "You are already booked for this session" },
        { status: 400 }
      );
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: { sessionId: Number(sessionId), userId },
    });

    // Get user and DM info for notification
    const dm = await prisma.dungeonMaster.findUnique({
      where: { id: session.dmId },
    });

    if (!dm) {
      return NextResponse.json({ error: "Dungeon Master not found" }, { status: 404 });
    }

    const [userProfile, dmProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { id: dm.userId } }),
    ]);

    if (userProfile && dmProfile) {
      await sendEmail({
        to: userProfile.email,
        subject: `Waitlist Confirmed: ${session.title}`,
        html: `<p>You have been added to the waitlist for <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });

      await sendEmail({
        to: dmProfile.email,
        subject: `New Waitlist Entry: ${session.title}`,
        html: `<p>${userProfile.email} has joined the waitlist for your session <strong>${session.title}</strong> scheduled on ${new Date(
          session.date
        ).toLocaleString()}.</p>`,
      });
    } else {
      console.error("Missing user or DM Profile:", { userProfile, dmProfile });
    }

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Waitlist] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Waitlist] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Waitlist] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Waitlist] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { sessionId, userId } = (await req.json()) as WaitlistRequest;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify that the requesting user is the same as the user being removed from waitlist
    if (user.id !== userId) {
      console.error("[Waitlist] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const waitlistEntry = await prisma.waitlist.delete({
      where: {
        sessionId_userId: {
          sessionId: Number(sessionId),
          userId,
        },
      },
    });

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error removing from waitlist:", error);
    return NextResponse.json({ error: "Failed to remove from waitlist" }, { status: 500 });
  }
}
