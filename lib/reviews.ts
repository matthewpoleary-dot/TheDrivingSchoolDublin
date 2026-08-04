/**
 * Reviews.
 *
 * The previous site rendered six hand-written reviews and emitted an
 * `aggregateRating` of 5.0 over 36 ratings in JSON-LD, with the count
 * hardcoded. That is a problem on two fronts: Google's structured data
 * policy prohibits marking up ratings that are not genuinely collected and
 * displayed, and under the EU Omnibus Directive, as implemented in Ireland by
 * S.I. 335/2022, presenting reviews without ensuring they come from real
 * customers is a prohibited commercial practice.
 *
 * So the rule here is structural, not editorial: `aggregateRating` is only
 * ever emitted from rows the instructor has explicitly marked `is_verified`,
 * meaning the review exists at a checkable public source. Unverified rows can
 * still be displayed as testimonials, they just carry no schema. Getting this
 * wrong is not possible by accident any more.
 */

import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { SITE } from "@/lib/config";

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  source: "google" | "direct" | "facebook";
  sourceUrl: string | null;
  reviewedAt: string;
  isVerified: boolean;
};

export type AggregateRating = {
  ratingValue: number;
  reviewCount: number;
};

/** Published reviews, newest first. Returns [] when the database is absent. */
export async function getPublishedReviews(limit = 24): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabaseAdmin()
      .from("reviews")
      .select("id,author_name,rating,body,source,source_url,reviewed_at,is_verified")
      .eq("is_published", true)
      .order("reviewed_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[reviews] load failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      authorName: String(row.author_name),
      rating: Number(row.rating),
      body: String(row.body),
      source: row.source as Review["source"],
      sourceUrl: (row.source_url as string | null) ?? null,
      reviewedAt: String(row.reviewed_at),
      isVerified: Boolean(row.is_verified),
    }));
  } catch (error) {
    console.error("[reviews] load threw:", error);
    return [];
  }
}

/**
 * The aggregate for JSON-LD. Null unless there are verified reviews, which is
 * the only condition under which marking up a rating is legitimate.
 */
export function aggregateFromVerified(reviews: Review[]): AggregateRating | null {
  const verified = reviews.filter((r) => r.isVerified);
  if (verified.length === 0) return null;

  const total = verified.reduce((sum, r) => sum + r.rating, 0);
  return {
    ratingValue: Math.round((total / verified.length) * 10) / 10,
    reviewCount: verified.length,
  };
}

/**
 * Serialise for embedding in a <script type="application/ld+json"> block.
 *
 * JSON.stringify does not escape `<` or `/`, so a review body containing
 * `</script>` would close the tag and inject markup. Not reachable today
 * because reviews are admin-only, but it becomes stored XSS the moment review
 * submission is opened up, so it is escaped at the boundary rather than
 * depending on where the data came from.
 */
export function serialiseJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** LocalBusiness JSON-LD, with the rating attached only when it is earned. */
export function localBusinessJsonLd(options: {
  aggregate?: AggregateRating | null;
  reviews?: Review[];
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    telephone: "+353860235666",
    email: "thedrivingschooldublin@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressRegion: "Leinster",
      addressCountry: "IE",
    },
    areaServed: { "@type": "City", name: "Dublin" },
    priceRange: "EUR 80 to EUR 245",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "16:00",
      },
    ],
  };

  if (options.aggregate) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: options.aggregate.ratingValue,
      reviewCount: options.aggregate.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const verified = (options.reviews ?? []).filter((r) => r.isVerified).slice(0, 5);
  if (verified.length > 0) {
    schema.review = verified.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.reviewedAt,
      reviewBody: r.body,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }));
  }

  return schema;
}
