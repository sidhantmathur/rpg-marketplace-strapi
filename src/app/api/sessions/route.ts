import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dmId = searchParams.get("dmId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!dmId) {
      return NextResponse.json({ error: "DM ID is required" }, { status: 400 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        dmId: parseInt(dmId),
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        id: true,
        date: true,
        duration: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
