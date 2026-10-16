// End-to-end smoke test against a deployed preview. Stripe must be in TEST mode.
// Creates its own slots at 05:xx so it never touches real availability, and
// deletes them at the end.
//
//   SITE=https://<preview>.vercel.app BYPASS=<vercel bypass token> \
//   ADMIN_TOKEN=<admin token> TEST_EMAIL=<inbox you can check> \
//   node scripts/smoke-test.mjs
import { chromium, request as pwRequest } from "playwright";

const { SITE, BYPASS = "", ADMIN_TOKEN, TEST_EMAIL } = process.env;
if (!SITE || !ADMIN_TOKEN || !TEST_EMAIL) {
  console.error("Set SITE, ADMIN_TOKEN and TEST_EMAIL (and BYPASS if the preview is protected).");
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = await pwRequest.newContext({
  baseURL: SITE,
  extraHTTPHeaders: { "x-vercel-protection-bypass": BYPASS },
});
const admin = { authorization: `Bearer ${ADMIN_TOKEN}` };

const day = (offset) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
};

async function makeSlot(date, start) {
  const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}${start.slice(2)}`;
  const res = await api.post("/api/availability", {
    headers: admin,
    data: { mode: "single", date, start_time: `${start}:00`, end_time: `${end}:00`, duration_minutes: 60, lesson_types: ["standard"] },
  });
  if (res.status() !== 201) throw new Error(`could not create slot ${date} ${start}: ${res.status()} ${await res.text()}`);
  return (await res.json()).id;
}

async function findBooking(email, slotId) {
  const res = await api.get("/api/admin/bookings?page=1&pageSize=200", { headers: admin });
  const body = await res.json();
  return (body.data ?? body).find((b) => b.customer_email === email && b.slot_id === slotId);
}

async function waitForStatus(email, slotId, status, seconds = 60) {
  for (let i = 0; i < seconds / 3; i++) {
    const b = await findBooking(email, slotId);
    if (b?.payment_status === status) return b;
    await sleep(3000);
  }
  return findBooking(email, slotId);
}

const checkoutBody = (slot_id) => ({
  slot_id, service_type: "standard", customer_name: "Smoke Test",
  customer_email: TEST_EMAIL, customer_phone: "+353 86 000 0000", notes: "Automated smoke test, ignore",
});

// Stripe localises Checkout by the browser's IP. From a non-Irish runner it
// defaults to that country (US: ZIP field, USD offered) and ticks "save with
// Link", which then demands a phone number. Pin it to an Irish EUR buyer.
async function payOnStripe(page, cardNumber) {
  const eur = page.getByRole("button", { name: /€/ }).first();
  if (await eur.waitFor({ timeout: 5_000 }).then(() => true, () => false)) await eur.click();
  await page.fill("#cardNumber", cardNumber);
  await page.fill("#cardExpiry", "12 / 34");
  await page.fill("#cardCvc", "123");
  await page.fill("#billingName", "Smoke Test");
  const country = page.locator("#billingCountry");
  if (await country.isVisible().catch(() => false)) await country.selectOption("IE");
  const postal = page.locator("#billingPostalCode");
  if (await postal.isVisible().catch(() => false)) await postal.fill("D02 XY45");
  const link = page.locator("#enableStripePass");
  if (await link.isChecked().catch(() => false)) await link.uncheck({ force: true });
  await page.locator("[data-testid=hosted-payment-submit-button]").click();
}

const slots = [];
let browser, page;

try {
  // ── 0. Admin auth ──────────────────────────────────────────────────────────
  const bad = await api.get("/api/admin/bookings", { headers: { authorization: "Bearer wrong" } });
  check("admin API rejects a wrong token", bad.status() === 401, `got ${bad.status()}`);
  const good = await api.get("/api/admin/bookings", { headers: admin });
  check("admin API accepts the real token", good.ok(), `got ${good.status()}`);
  if (!good.ok()) throw new Error("ADMIN_TOKEN does not match the preview's ADMIN_TOKEN");

  // ── 1. Test slots ──────────────────────────────────────────────────────────
  const dateA = day(3), dateB = day(4), dateC = day(5);
  const slotA = await makeSlot(dateA, "05:07"); slots.push(slotA);
  const slotB = await makeSlot(dateB, "05:07"); slots.push(slotB);
  const slotC = await makeSlot(dateC, "05:07"); slots.push(slotC);
  check("created 3 test slots", true, `${dateA}, ${dateB}, ${dateC} at 05:07`);

  // ── 2. Bad input is rejected ───────────────────────────────────────────────
  const invalid = await api.post("/api/checkout", { data: { ...checkoutBody(slotA), customer_email: "nope" } });
  check("checkout rejects a bad email", invalid.status() === 400, `got ${invalid.status()}`);

  // ── 3. Full booking in a real browser ──────────────────────────────────────
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  if (BYPASS) await page.goto(`${SITE}/?x-vercel-protection-bypass=${BYPASS}&x-vercel-set-bypass-cookie=samesitenone`);
  // On a branch preview, Stripe sends the buyer back to NEXT_PUBLIC_SITE_URL, which can be a
  // different preview. RETURN_SITE gives that origin the bypass cookie too.
  if (BYPASS && process.env.RETURN_SITE) {
    await page.goto(`${process.env.RETURN_SITE}/?x-vercel-protection-bypass=${BYPASS}&x-vercel-set-bypass-cookie=samesitenone`);
  }

  await page.goto(`${SITE}/book?service=standard`);
  const [y, m, d] = dateA.split("-").map(Number);
  const mon = new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  await page.locator(".l-day:not([disabled])", { has: page.locator(".l-day__num", { hasText: new RegExp(`^${d}$`) }) })
    .filter({ has: page.locator(".l-day__mon", { hasText: mon }) }).first().click({ timeout: 20_000 });
  await page.locator(".l-time", { hasText: "05:07" }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.fill("input[type=text]", "Smoke Test");
  await page.fill("input[type=email]", TEST_EMAIL);
  await page.fill("input[type=tel]", "+353 86 000 0000");
  await page.selectOption("#bk-area", { index: 1 });
  await page.fill("#bk-notes", "Automated smoke test, ignore");
  await page.getByRole("button", { name: /pay .* securely/i }).click();

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  check("booking form redirects to Stripe Checkout", true);
  // A cs_test_ session id is only ever issued in test mode. Otherwise wait for
  // Checkout to render its test-mode badge (isVisible() alone doesn't wait).
  const isTestMode = /\/pay\/cs_test_/.test(page.url())
    || await page.getByText(/test mode|sandbox/i).first().waitFor({ timeout: 15_000 }).then(() => true, () => false);
  check("Stripe Checkout is in test mode", isTestMode);
  if (!isTestMode) throw new Error("Stripe is not in test mode, stopping before entering a card");

  await payOnStripe(page, "4242424242424242");

  await page.waitForURL(/\/book\/confirmation/, { timeout: 60_000 });
  check("payment lands on /book/confirmation", true);
  // The page shows "Verifying your booking…" until it has fetched the Stripe session
  await page.getByRole("heading", { name: /payment confirmed/i }).waitFor({ timeout: 20_000 }).catch(() => {});
  const confirmText = await page.locator("body").innerText();
  check("confirmation page names the lesson", /standard/i.test(confirmText));

  // ── 4. Webhook processed ───────────────────────────────────────────────────
  const paid = await waitForStatus(TEST_EMAIL, slotA, "paid");
  check("webhook marked the booking paid", paid?.payment_status === "paid", `status ${paid?.payment_status}`);
  check("payment intent stored on booking", Boolean(paid?.stripe_payment_intent));

  // ── 5. Booked slot can't be booked again ───────────────────────────────────
  const again = await api.post("/api/checkout", { data: checkoutBody(slotA) });
  check("booked slot returns 409", again.status() === 409, `got ${again.status()}`);

  // ── 6. Two people grab the same slot at once ───────────────────────────────
  const race = await Promise.all([1, 2, 3].map(() => api.post("/api/checkout", { data: checkoutBody(slotB) })));
  const codes = race.map((r) => r.status());
  check("only one of 3 simultaneous checkouts wins", codes.filter((c) => c === 200).length === 1, codes.join(","));

  // ── 7. Admin refund ────────────────────────────────────────────────────────
  if (paid) {
    const ref = await api.patch(`/api/admin/bookings/${paid.id}`, { headers: admin, data: { payment_status: "refunded" } });
    const refBody = await ref.json();
    check("admin refund goes through Stripe", ref.ok() && Boolean(refBody.refund_id), JSON.stringify(refBody));
    const ref2 = await api.patch(`/api/admin/bookings/${paid.id}`, { headers: admin, data: { payment_status: "refunded" } });
    check("second refund click is a no-op", (await ref2.json()).idempotent === true);
    const free = await api.get(`/api/availability?start_date=${dateA}&end_date=${dateA}&service_type=standard`);
    check("refunded slot is bookable again", (await free.json()).some((s) => s.id === slotA));
  }

  // ── 8. Declined card ───────────────────────────────────────────────────────
  const dec = await api.post("/api/checkout", { data: checkoutBody(slotC) });
  if (dec.ok()) {
    await page.goto((await dec.json()).url);
    await payOnStripe(page, "4000000000000002");
    const declinedShown = await page.getByText(/declined/i).first().waitFor({ timeout: 30_000 }).then(() => true, () => false);
    check("Stripe shows the decline", declinedShown);
    const failed = await waitForStatus(TEST_EMAIL, slotC, "failed", 45);
    check("webhook marked the booking failed", failed?.payment_status === "failed", `status ${failed?.payment_status}`);
    const held = await api.get(`/api/availability?start_date=${dateC}&end_date=${dateC}&service_type=standard`);
    check("declined slot stays held for a retry", !(await held.json()).some((s) => s.id === slotC));
  } else {
    check("checkout for decline test", false, `got ${dec.status()}`);
  }
} catch (e) {
  check("script finished without crashing", false, e.message.split("\n")[0]);
  if (page) {
    const shot = `${process.env.SMOKE_SHOT_DIR ?? "."}/smoke-failure.png`;
    console.log(`failure url: ${page.url()}`);
    await page.screenshot({ path: shot, fullPage: true }).then(() => console.log(`failure screenshot: ${shot}`), () => {});
  }
} finally {
  await browser?.close();
  for (const id of slots) {
    const r = await api.delete(`/api/availability/${id}`, { headers: admin });
    console.log(`cleanup: delete slot ${id} -> ${r.status()}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
