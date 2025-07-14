import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Function to convert Strapi rich text to HTML
function convertRichTextToHtml(content: any[]): string {
  if (!Array.isArray(content)) {
    return "";
  }
  
  return content.map((block) => {
    if (block.type === "paragraph") {
      const text = block.children?.map((child: any) => child.text || "").join("") || "";
      return `<p>${text}</p>`;
    }
    if (block.type === "heading") {
      const level = block.level || 1;
      const text = block.children?.map((child: any) => child.text || "").join("") || "";
      return `<h${level}>${text}</h${level}>`;
    }
    return "";
  }).join("");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "6";
    const slug = searchParams.get("slug");

    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const apiToken = process.env.STRAPI_API_TOKEN;

    if (!strapiUrl) {
      console.error("[CMS] NEXT_PUBLIC_STRAPI_URL not configured");
      return NextResponse.json(
        { error: "CMS not configured" },
        { status: 500 }
      );
    }

    const baseUrl = strapiUrl.replace(/\/$/, "");
    let url = `${baseUrl}/api/blogs?populate=*&sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${limit}`;
    
    if (slug) {
      url = `${baseUrl}/api/blogs?filters[Slug][$eq]=${slug}&populate=*&markdown`;
    }

    const response = await fetch(url, {
      headers: {
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error("[CMS] Failed to fetch blog data:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch blog data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[CMS Blogs API] Raw Strapi response:", data);
    console.log("[CMS] Successfully fetched blog data");

    // Convert rich text content to HTML for individual blog posts
    if (slug && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((post: any) => ({
        ...post,
        Content: convertRichTextToHtml(post.Content)
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[CMS] Error fetching blog data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 