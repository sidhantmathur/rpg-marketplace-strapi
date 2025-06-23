import { NextRequest, NextResponse } from "next/server";
import { supabase as baseSupabase } from "@/lib/supabaseClient";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    console.log("[Profile Avatar API] Starting avatar upload request");
    
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

    // Use the base client for auth
    const { data: { user }, error: authError } = await baseSupabase.auth.getUser(token);
    
    if (authError) {
      console.error("[Profile Avatar API] Auth error:", authError);
      return NextResponse.json({ error: "Authentication error", details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.error("[Profile Avatar API] No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("[Profile Avatar API] User authenticated:", user.id);

    const { id } = await params;
    if (!id) {
      console.error("[Profile Avatar API] No ID provided");
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    console.log("[Profile Avatar API] Profile ID:", id);

    // Verify the user is updating their own profile
    if (user.id !== id) {
      console.error("[Profile Avatar API] User not authorized to update this profile");
      return NextResponse.json({ error: "Not authorized to update this profile" }, { status: 403 });
    }

    console.log("[Profile Avatar API] User authorized, processing file upload");

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("[Profile Avatar API] No file provided in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("[Profile Avatar API] File received:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("[Profile Avatar API] Invalid file type:", file.type);
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error("[Profile Avatar API] File too large:", file.size);
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    console.log("[Profile Avatar API] File validation passed, converting to buffer");

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    console.log("[Profile Avatar API] File converted to buffer, size:", fileBuffer.length);

    // Create a new Supabase client for storage with the user's JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const storageSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${id}/${fileName}`;

    console.log("[Profile Avatar API] Uploading to Supabase storage:", {
      bucket: "profiles",
      path: filePath,
      contentType: file.type
    });

    const { data: uploadData, error: uploadError } = await storageSupabase.storage
      .from("profiles")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Profile Avatar API] Upload error:", uploadError);
      return NextResponse.json({ 
        error: "Failed to upload file", 
        details: uploadError.message
      }, { status: 500 });
    }

    console.log("[Profile Avatar API] File uploaded successfully:", uploadData);

    // Get the public URL using the same storageSupabase client
    const { data: { publicUrl } } = storageSupabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    console.log("[Profile Avatar API] Public URL generated:", publicUrl);

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

    console.log("[Profile Avatar API] Profile updated successfully:", updatedProfile.id);

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[Profile Avatar API] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to update avatar", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
} 