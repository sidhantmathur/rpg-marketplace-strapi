import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const authHeader = request.headers.get("Authorization");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 },
      );
    }

    // Create an authenticated Supabase client
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `sessions/${fileName}`;

    // Upload to Supabase Storage using authenticated client
    const { error } = await supabaseAuth.storage
      .from("sessions")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      if (error.message.includes("bucket")) {
        return NextResponse.json(
          {
            error:
              "Storage bucket not found. Please check your Supabase configuration.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabaseAuth.storage.from("sessions").getPublicUrl(filePath);

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
