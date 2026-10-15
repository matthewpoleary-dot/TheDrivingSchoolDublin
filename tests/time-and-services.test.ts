import { describe, it, expect } from "vitest";
import { dublinLocalToUtcISO } from "@/lib/time";
import { ALL_SERVICE_SLUGS, SERVICE_LABEL_MAP, getServiceLabel } from "@/lib/services";
import { SERVICES } from "@/lib/pricing";

describe("dublinLocalToUtcISO", () => {
  it("summer (IST, UTC+1)", () => {
    expect(dublinLocalToUtcISO("2026-06-10", "19:00:00")).toBe("2026-06-10T18:00:00.000Z");
  });
  it("winter (GMT, UTC+0)", () => {
    expect(dublinLocalToUtcISO("2026-01-10", "19:00:00")).toBe("2026-01-10T19:00:00.000Z");
  });
  it("day before clocks go back (25 Oct 2026)", () => {
    expect(dublinLocalToUtcISO("2026-10-24", "10:00:00")).toBe("2026-10-24T09:00:00.000Z");
  });
  it("day after clocks go back", () => {
    expect(dublinLocalToUtcISO("2026-10-26", "10:00:00")).toBe("2026-10-26T10:00:00.000Z");
  });
  it("day after clocks go forward (29 Mar 2026)", () => {
    expect(dublinLocalToUtcISO("2026-03-30", "10:00:00")).toBe("2026-03-30T09:00:00.000Z");
  });
});

describe("service labels", () => {
  it("every bookable slug has a real label and a price", () => {
    for (const slug of ALL_SERVICE_SLUGS) {
      expect(SERVICE_LABEL_MAP[slug], slug).toBeTruthy();
      expect(SERVICES[slug as keyof typeof SERVICES], slug).toBeTruthy();
    }
  });
  it("unknown slugs fall back to title case", () => {
    expect(getServiceLabel("some-new-thing")).toBe("Some New Thing");
  });
});
