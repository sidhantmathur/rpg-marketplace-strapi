import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

function handleError(err: unknown): NextResponse<{ error: string }> {
  console.error("[User Joined Sessions] Error:", err);
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ session: { id: number } }[] | { error: string }>> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[User Joined Sessions] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[User Joined Sessions] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[User Joined Sessions] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[User Joined Sessions] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { id } = await params;
    console.warn("[User Joined Sessions] Fetching sessions for user:", id);

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify that the requesting user is the same as the requested user
    if (user.id !== id) {
      console.error("[User Joined Sessions] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: id,
      },
      select: {
        session: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    return handleError(err);
  }
}
