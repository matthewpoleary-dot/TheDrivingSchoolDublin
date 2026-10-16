---
name: The Driving School Dublin
description: A calm booking site in red, black and white. The credential first, every price up front, one tap to book.
colors:
  red: "#C8102E"
  red-press: "#A50D26"
  red-mist: "#FBEDEF"
  ink: "#0A0A0A"
  ink-2: "#2B2B2B"
  paper: "#FFFFFF"
  mist: "#F5F5F4"
  grey-100: "#EAEAE8"
  grey-200: "#DCDCDA"
  grey-300: "#C4C4C2"
  grey-600: "#5C5C5C"
  grey-on-ink: "#A8A8A8"
  ok: "#3F7A52"
  ok-soft: "#EDF4EF"
  warn-soft: "#F8F4EA"
  warn-deep: "#7A5A12"
  err-soft: "#FBEFF1"
  err-deep: "#7A0A1C"
typography:
  display: "Bricolage Grotesque, 700, width 94, tracking -0.03em"
  text: "Geist, 400 to 600"
rounded:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  pill: "999px"
---

# Design System: The Driving School Dublin

## Overview

**North star: a calm booking site.** The visitor is nervous about a test and comparing
prices. The site lowers the pulse: generous white space, a few clear words per section and
one obvious way to book from anywhere. The content is a driving school's: the ex-tester
credential, prices up front, live availability.

**One rule: hairlines and type separate things; cards are only for things you press.**
Lists (prices, services, reviews, FAQ, contact options, result facts) are ruled rows under
an ink top rule, not stacks of grey cards. Pages are white; there are no dark panels. Ink
is for text, the nav pill, the selected-slot bar and secondary buttons. Signature moments
come from the driving school itself, not decoration: the three test centres set large as
a ledger, the booking steps on a dashed road line, and the L plate that turns N.

## Colours

The palette is fixed: red `#C8102E`, ink `#0A0A0A`, white. Greys are neutrals only.

- **Red** is the action colour: primary buttons, the learner's own selection (calendar day,
  time, active step), stars, eyebrow markers, link underlines, focus rings. **Red press**
  is its hover. **Red mist** is a whisper of it behind step numbers, tags and focus halos.
- **Ink** is text, top rules on lists, secondary buttons, the nav pill and the selected-slot bar.
- **Mist** (`#F5F5F4`) is a hover wash and the occasional quiet surface. Grey 100 to 300 are hairlines and
  borders; grey 600 is secondary text (6.6:1 on white).
- **Status tones** (open green, pending amber, error) are muted and only carry meaning:
  calendar availability, notices, admin payment badges. They never decorate.

The stock Tailwind palette used by `/admin` is remapped at `:root` in `app/lton.css`
(slate and gray to the grey ramp, red to brand red, green, amber and blue to the muted
status tones), so Tailwind-styled screens inherit the brand by name.

## Typography

- **Display: Bricolage Grotesque** (700, width axis 94, tracking -0.03em). A confident
  grotesque that echoes the heavy logo without shouting. Headlines, prices, numbers.
- **Text: Geist** (400 to 600). Body copy, labels, buttons, forms and the admin tool.
- Scale: `.l-h1` clamp 44 to 104px, `.l-h2` clamp 34 to 64px, `.l-h3` clamp 26 to 36px,
  lede 17 to 20px, body 16px, meta 13 to 14px.
- **Eyebrow** (`.l-eyebrow`): 12px uppercase, tracked 0.14em, with a small red square.
  The only uppercase on the site apart from calendar day and month labels.
- Sentence case everywhere else. No em dashes in any copy.

## Layout

Mobile first at 390px, then 768px and 1440px. Content wraps at 1240px; the gutter is
16px on phones, 32px from 768px, 48px from 1200px. Sections are spaced 72px apart on
phones and 120px from 768px, with more air before the credential and the close. Photos carry
a 12px radius; pills are for buttons and tags only.

On phones a floating pill action bar slides up after 300px of scroll: a wide Book now with
small labelled WhatsApp and Contact buttons either side. The body reserves space for it. It
is hidden from 768px.

## Components

- **Nav:** a full-width translucent bar that settles into a floating pill once you scroll.
  Wordmark recreates the logo (red L and N). The Book button is always present.
- **Buttons:** pills. Red primary, ink secondary, white line, ghost on ink. 48px tall
  (56px large); arrows nudge right on hover; buttons compress slightly on press.
- **Price list** (`.l-pricelist`, home) and **rows** (`.l-rows`, /prices): ruled rows,
  right-aligned tabular prices, an underlined "Book" link. EDT is marked by a red price.
- **Service choices** (/book): ruled rows; the whole row is the button, the round arrow
  fills red on hover.
- **FAQ:** a ruled accordion; the plus turns into a cross on an ink disc.
- **Reviews:** a ruled list on /reviews; on the homepage a carousel with swipe and a
  visible Pause button.
- **Contact options:** ruled rows. WhatsApp is the one red button; Call and Email are links.
- **Closing section** (`.l-close`): on white, the L plate turns N as it scrolls in.
- **Booking calendar:** a swipeable strip of days. Open days carry a hairline and a green
  dot; full days are quiet text; the chosen day and time fill red. Arrows appear only for a
  mouse from 640px. The selected slot rides in an ink pill above the thumb.
- **Result screens:** a round status mark, a ruled fact list, next steps on outlined dots.
  The EDT link page shows its counters as one hairline row, the remaining count in red.
- **Admin:** a working tool. Segmented pill tabs, mist info panels, soft cards, toasts. On
  phones the bookings table stacks into one block per booking.

## Photography

No photos of Conor or the car exist yet, and none are faked. `components/lton/PhotoSlot.tsx`
frames each slot and renders a designed brand panel until a photo is supplied (ink slots
show a road and the L plate; mist slots show the real logo and the N plate). Each slot's
`data-wants` attribute names the photo it is waiting for.

On the homepage, photos are picked up automatically: drop the file into `public/photos/` and
rebuild. `components/lton/photos.ts` checks for it at build time, so no code change is needed.
Without a photo the homepage hero is type-led on white (never a dark panel) and the credential
section shows only the ledger of test centres.

| Slot | File | Where |
|---|---|---|
| Hero | `/photos/hero.jpg` (landscape, the car on a Dublin road; shown under the text on phones) | `app/page.tsx`, automatic |
| Hero, desktop | `/photos/hero-portrait.jpg` (optional portrait crop for the tall column from 900px) | `app/page.tsx`, automatic |
| Credential | `/photos/conor.jpg` (portrait beside the car) | `app/page.tsx`, automatic |
| About | `/photos/conor.jpg` (portrait) | `app/about/page.tsx`, pass `src` to the slot |

Shoot on the phone's 1x lens (not ultra-wide), in overcast or morning light, and keep the
number plate unreadable.

## Motion

- Nav morphs from bar to floating pill; mobile action bar slides up.
- Hero word rotates once through three words; the review carousel fades every 5s, can be
  swiped, pauses on hover and focus, and has a visible Pause button (WCAG 2.2.2).
- Cards, steps and reviews rise in as they scroll into view (CSS scroll-driven
  animations; browsers without support simply show them).
- The closing L plate turns into an N with scroll progress.
- On the homepage the three booking steps sit on one dashed road line that draws itself
  as it scrolls into view.
- Everything has a `prefers-reduced-motion` path: no reveals, road line shown fully drawn, no rotating
  word or carousel autoplay, no hover lifts.
