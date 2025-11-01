import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { articlesQuery, documentationQuery } from "@/lib/sanity.queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    let query;
    if (category === "documentation") {
      query = documentationQuery;
    } else {
      query = articlesQuery;
    }

    const data = await client.fetch(query);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

