import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import prisma from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Profile Avatar API] No authorization header");
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.error("[Profile Avatar API] No token in authorization header");
      return NextResponse.json({ error: "No token in authorization header" }, { status: 401 });
    }

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Profile Avatar API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Profile Avatar API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      console.error("[Profile Avatar API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Verify the user is updating their own profile
    if (user.id !== id) {
      console.error("[Profile Avatar API] User not authorized to update this profile");
      return NextResponse.json({ error: "Not authorized to update this profile" }, { status: 403 });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Profile Avatar API] Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    // Update the profile with the new avatar URL
    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        avatarUrl: publicUrl,
      },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
        avatarUrl: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[Profile Avatar API] Error:", err);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
} 