import { NextResponse } from "next/server";

export const revalidate = 3600; // refresh every hour

export interface GoogleReview {
  authorName: string;
  rating: number;
  text: string;
  time: string; // ISO
  profilePhotoUrl?: string;
}

export interface GoogleReviewsData {
  rating: number;
  totalRatings: number;
  reviews: GoogleReview[];
}

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json({ error: "Google Places not configured" }, { status: 503 });
  }

  try {
    // Google Places API (new) — place details
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount,reviews&languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Google Places API error:", err);
      return NextResponse.json({ error: "Google Places API error" }, { status: 502 });
    }

    const data = await res.json();

    const result: GoogleReviewsData = {
      rating: data.rating ?? 5,
      totalRatings: data.userRatingCount ?? 0,
      reviews: (data.reviews ?? []).map((r: Record<string, unknown>) => ({
        authorName: (r.authorAttribution as Record<string, string>)?.displayName ?? "Google Reviewer",
        rating: (r.rating as number) ?? 5,
        text: ((r.text as Record<string, string>)?.text ?? (r.originalText as Record<string, string>)?.text ?? ""),
        time: (r.publishTime as string) ?? new Date().toISOString(),
        profilePhotoUrl: (r.authorAttribution as Record<string, string>)?.photoUri,
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to fetch Google reviews:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
