// redesign/states.mjs — every route and UI state the sweep captures.
// Walked from the app/ router tree, not the nav. Each state is:
//   id       file name for the screenshot
//   path     URL to load
//   act      optional (page, h) => Promise, drives the page into the state
//   api      optional fixture overrides, see fixtures.respond()
//   viewport true → capture the viewport only (scroll-dependent states)
// `h` carries helpers: h.tick(ms) advances the frozen clock, h.settle() waits for
// network + fonts.

const fill = async (page, selector, value) => {
  await page.locator(selector).fill(value);
};

const toDetails = async (page, h) => {
  await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click();
  await page.getByRole("button", { name: "11:30" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await h.settle();
};

const adminLogin = async (page, h) => {
  // Dummy value: the login screen only stores the string; every admin API is mocked.
  await page.getByPlaceholder("Admin password").fill("sweep");
  await page.getByRole("button", { name: "Sign in" }).click();
  await h.settle();
};
const adminTab = (label) => async (page, h) => {
  await adminLogin(page, h);
  await page.getByRole("tab", { name: label }).click();
  await h.settle();
};

export const STATES = [
  // ── Marketing pages ─────────────────────────────────────────────────────────
  { id: "home", path: "/" },
  {
    id: "home--scrolled", path: "/", viewport: true,
    act: async (page, h) => {
      // html has scroll-behavior: smooth, so wheel scrolling lands at a random offset.
      await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
      await h.tick(100);
    },
  },
  {
    id: "home--review-2", path: "/",
    act: async (page, h) => { await page.getByRole("button", { name: "Review 2" }).click(); await h.tick(400); },
  },
  { id: "about", path: "/about" },
  { id: "prices", path: "/prices" },
  {
    id: "prices--faq-open", path: "/prices",
    act: async (page) => { await page.getByText("What is EDT?").click(); },
  },
  { id: "reviews", path: "/reviews" },
  { id: "not-found", path: "/this-route-does-not-exist" },

  // ── Contact ─────────────────────────────────────────────────────────────────
  { id: "contact", path: "/contact" },
  {
    id: "contact--validation", path: "/contact",
    act: async (page) => {
      await fill(page, "#email", "not-an-email");
      await fill(page, "#message", "short");
      await page.getByRole("button", { name: "Send message" }).click();
    },
  },
  {
    id: "contact--success", path: "/contact",
    act: async (page, h) => {
      await fill(page, "#name", "Aoife Byrne");
      await fill(page, "#email", "aoife@example.com");
      await fill(page, "#message", "Hi, I'd like to book EDT lessons please.");
      await page.getByRole("button", { name: "Send message" }).click();
      await h.settle();
    },
  },
  {
    id: "contact--error", path: "/contact",
    api: { "POST /api/contact": () => [500, { error: "Email service unavailable" }] },
    act: async (page, h) => {
      await fill(page, "#name", "Aoife Byrne");
      await fill(page, "#email", "aoife@example.com");
      await fill(page, "#message", "Hi, I'd like to book EDT lessons please.");
      await page.getByRole("button", { name: "Send message" }).click();
      await h.settle();
    },
  },

  // ── Booking flow ────────────────────────────────────────────────────────────
  { id: "book--service", path: "/book" },
  { id: "book--cancelled", path: "/book?cancelled=1" },
  {
    id: "book--car-hire-option", path: "/book",
    act: async (page) => { await page.getByLabel("Pick a car-hire option").selectOption("car-hire-local"); },
  },
  { id: "book--slot", path: "/book?service=standard" },
  {
    id: "book--slot-empty", path: "/book?service=standard",
    api: { "GET /api/availability": () => [200, []] },
  },
  {
    id: "book--slot-more-dates", path: "/book?service=standard",
    act: async (page, h) => { await page.getByRole("button", { name: /Show more dates/ }).click(); await h.settle(); },
  },
  {
    id: "book--slot-date", path: "/book?service=standard",
    act: async (page) => { await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click(); },
  },
  {
    id: "book--slot-selected", path: "/book?service=standard",
    act: async (page) => {
      await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click();
      await page.getByRole("button", { name: "11:30" }).click();
    },
  },
  { id: "book--details", path: "/book?service=standard", act: toDetails },
  {
    id: "book--details-other-area", path: "/book?service=standard",
    act: async (page, h) => { await toDetails(page, h); await page.locator("select").selectOption("other"); },
  },
  {
    id: "book--details-error", path: "/book?service=standard",
    act: async (page, h) => {
      await toDetails(page, h);
      await page.getByPlaceholder("Your full name").fill("Aoife Byrne");
      await page.getByPlaceholder("you@example.com").fill("aoife@example.com");
      await page.getByPlaceholder("+353 86 123 4567").fill("+353 86 000 0001");
      await page.locator("select").selectOption("D6");
      await page.getByRole("button", { name: /Pay .* securely/ }).click();
      await h.settle();
      await page.locator(":focus").evaluate((el) => el.blur()).catch(() => {});
    },
  },
  { id: "book--details-bundle", path: "/book?service=edt-bundle" },

  // ── Post-payment confirmation ───────────────────────────────────────────────
  { id: "confirmation--no-session", path: "/book/confirmation" },
  { id: "confirmation--lesson", path: "/book/confirmation?session_id=lesson" },
  { id: "confirmation--edt", path: "/book/confirmation?session_id=edt" },

  // ── EDT package holder booking (/book/[token]) ──────────────────────────────
  { id: "edt-token", path: "/book/demo" },
  {
    id: "edt-token--selected", path: "/book/demo",
    act: async (page) => {
      await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click();
      await page.getByRole("button", { name: "14:00" }).click();
    },
  },
  {
    id: "edt-token--booked", path: "/book/demo",
    act: async (page, h) => {
      await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click();
      await page.getByRole("button", { name: "14:00" }).click();
      await page.getByRole("button", { name: "Confirm session" }).click();
      await h.settle();
    },
  },
  {
    id: "edt-token--book-error", path: "/book/demo-fail",
    act: async (page, h) => {
      await page.getByRole("button", { name: /^Tue\s*22\s*Sep$/i }).click();
      await page.getByRole("button", { name: "14:00" }).click();
      await page.getByRole("button", { name: "Confirm session" }).click();
      await h.settle();
    },
  },
  { id: "edt-token--expired", path: "/book/expired" },
  { id: "edt-token--complete", path: "/book/complete" },
  { id: "edt-token--max-sessions", path: "/book/busy" },
  { id: "edt-token--invalid", path: "/book/not-a-real-token" },

  // ── Admin (/admin) — all admin APIs are mocked ──────────────────────────────
  { id: "admin--login", path: "/admin" },
  { id: "admin--calendar", path: "/admin", act: adminLogin },
  {
    id: "admin--calendar-error", path: "/admin",
    api: { "GET /api/admin/slots": () => [500, { error: "boom" }] },
    act: adminLogin,
  },
  {
    id: "admin--calendar-next-week", path: "/admin",
    act: async (page, h) => { await adminLogin(page, h); await page.getByTitle("Next week").click(); await h.settle(); },
  },
  {
    id: "admin--modal-booked", path: "/admin", viewport: true,
    act: async (page, h) => { await adminLogin(page, h); await page.getByText("Aoife", { exact: true }).click(); },
  },
  {
    id: "admin--modal-edt", path: "/admin", viewport: true,
    act: async (page, h) => { await adminLogin(page, h); await page.getByText("Ciarán", { exact: true }).click(); },
  },
  {
    id: "admin--modal-orphan", path: "/admin", viewport: true,
    act: async (page, h) => {
      await adminLogin(page, h);
      await page.locator("div.cursor-pointer", { hasText: "11:00" }).first().click();
    },
  },
  {
    id: "admin--slot-removed-toast", path: "/admin",
    act: async (page, h) => {
      await adminLogin(page, h);
      await page.getByText("Aoife", { exact: true }).click();
      await page.getByRole("button", { name: "Cancel booking" }).click();
      await h.settle();
    },
  },
  { id: "admin--add-availability", path: "/admin", act: adminTab("Add availability") },
  {
    id: "admin--add-availability-manual", path: "/admin",
    act: async (page, h) => {
      await adminTab("Add availability")(page, h);
      await page.locator("summary", { hasText: "Add one slot manually" }).click();
    },
  },
  {
    id: "admin--add-availability-toast", path: "/admin",
    act: async (page, h) => {
      await adminTab("Add availability")(page, h);
      await page.getByRole("button", { name: /Generate slots/ }).click();
      await h.settle();
    },
  },
  { id: "admin--bookings", path: "/admin", act: adminTab("Bookings list") },
  {
    id: "admin--bookings-filtered", path: "/admin",
    act: async (page, h) => {
      await adminTab("Bookings list")(page, h);
      await page.locator('input[type="date"]').fill("2026-09-21");
    },
  },
  {
    id: "admin--bookings-empty", path: "/admin",
    api: { "GET /api/admin/bookings": () => [200, []] },
    act: adminTab("Bookings list"),
  },
  { id: "admin--edt", path: "/admin", act: adminTab("EDT packages") },
  {
    id: "admin--edt-expanded", path: "/admin",
    act: async (page, h) => {
      await adminTab("EDT packages")(page, h);
      await page.getByRole("button", { name: /Ciarán Walsh/ }).click();
      await h.settle();
    },
  },
  {
    id: "admin--edt-expanded-empty", path: "/admin",
    act: async (page, h) => {
      await adminTab("EDT packages")(page, h);
      await page.getByRole("button", { name: /Niamh Ryan/ }).click();
      await h.settle();
    },
  },
  {
    id: "admin--edt-empty", path: "/admin",
    api: { "GET /api/admin/edt-packages": () => [200, []] },
    act: adminTab("EDT packages"),
  },
];
