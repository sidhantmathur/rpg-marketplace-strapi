import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const apiToken = process.env.STRAPI_API_TOKEN;

    if (!strapiUrl) {
      console.error("[CMS] NEXT_PUBLIC_STRAPI_URL not configured");
      return NextResponse.json(
        { error: "CMS not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${strapiUrl}/api/event-banner?populate=*`, {
      headers: {
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("[CMS] Failed to fetch event banner data:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch event banner data", status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[CMS Event Banner API] Raw Strapi response:", data);
    // For single type, data.data is an object
    return NextResponse.json(data);
  } catch (error) {
    console.error("[CMS] Error fetching event banner data:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 