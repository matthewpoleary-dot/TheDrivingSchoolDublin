// components/lton/photos.ts — finds photos in /public/photos/ at build time, so a slot fills
// itself as soon as its file is added (no code change needed). Server components only.
import { existsSync } from "node:fs";
import path from "node:path";

/** Public path of /public/photos/<name> if the file exists, otherwise undefined. */
export function photo(name: string): string | undefined {
  return existsSync(path.join(process.cwd(), "public", "photos", name)) ? `/photos/${name}` : undefined;
}
