// lib/services.ts — single source of truth for service slugs and labels.
// Import from here rather than hardcoding slugs/labels in individual pages.
import { SERVICES, type ServiceSlug } from "./pricing";

// All bookable slugs (excludes legacy "car-hire" which is kept in pricing for old data only)
export const ALL_SERVICE_SLUGS: ServiceSlug[] = [
  "standard",
  "pre-test",
  "refresher",
  "edt-6",
  "edt-bundle",
  "edt-split",
  "car-hire-centre",
  "car-hire-local",
  "car-hire-lesson",
];

// Human-readable labels for every slug, sourced from pricing.ts
export const SERVICE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICES).map(([slug, cfg]) => [slug, cfg.label])
);

// Graceful fallback: title-case the slug if it isn't in the map
export function getServiceLabel(slug: string): string {
  return (
    SERVICE_LABEL_MAP[slug] ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Service type used for EDT slot filtering.
// EDT package holders book from standard slots — change this constant if a
// dedicated EDT slot type is introduced.
export const EDT_SLOT_SERVICE_TYPE = "standard" as const;

export type { ServiceSlug };
