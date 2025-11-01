import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { articleBySlugQuery } from "@/lib/sanity.queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await client.fetch(articleBySlugQuery, { slug });
    
    if (!data) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

