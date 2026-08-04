-- =============================================================================
-- Reviews carried over from the previous site.
-- =============================================================================
--
-- These are the six reviews that were hardcoded into the old
-- app/reviews/page.tsx. They are seeded here so the page is not empty, and
-- deliberately with is_verified = FALSE.
--
-- What that means in practice:
--   * They DO appear on the site, as testimonials.
--   * They do NOT contribute to aggregateRating, and no rating markup is
--     emitted for them.
--
-- The old site emitted `aggregateRating: { ratingValue: 5.0, reviewCount: 36 }`
-- with a hardcoded count of 36 over these six entries. That breaches Google's
-- structured data policy, and under the EU Omnibus Directive as implemented in
-- Ireland by S.I. 335/2022 it also risks being a prohibited commercial
-- practice. Neither is worth a rich snippet.
--
-- ACTION FOR THE INSTRUCTOR
-- -------------------------
-- For each review below that can be matched to a real, checkable public source
-- (a Google Business Profile review, most likely), set the source URL and flip
-- it to verified:
--
--   update public.reviews
--      set is_verified = true,
--          source_url  = 'https://g.page/r/.../review'
--    where author_name = 'Aisling M.';
--
-- Only then does it count towards the published rating. If a review cannot be
-- traced to a real source, leave it unverified, or delete it.
-- =============================================================================

insert into public.reviews
  (author_name, rating, body, source, reviewed_at, is_published, is_verified)
values
  ('Aisling M.', 5,
   'Conor is brilliant, super calm and gave me clear, actionable feedback every lesson. Passed first time in Tallaght.',
   'direct', '2025-07-18', true, false),

  ('Dylan O.', 5,
   'Best instructor I have had. The pre-test session covered exactly what the examiner looked for on the day.',
   'direct', '2025-06-30', true, false),

  ('Aoife K.', 5,
   'Patient and professional. The EDT plan was structured and I felt my confidence build each week.',
   'direct', '2025-06-02', true, false),

  ('Cian R.', 5,
   'Knows the Churchtown and Dun Laoghaire routes inside out. The tips were spot on. Highly recommend.',
   'direct', '2025-05-20', true, false),

  ('Laura F.', 5,
   'Booked a refresher before my test and it was invaluable. Clear coaching and zero waffle.',
   'direct', '2025-05-01', true, false),

  ('Mark S.', 5,
   'Great communication and flexible scheduling. Lessons were focused and efficient.',
   'direct', '2025-04-15', true, false)
on conflict do nothing;
