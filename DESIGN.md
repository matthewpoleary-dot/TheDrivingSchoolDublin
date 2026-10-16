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
prices. The site lowers the pulse: generous white space, large soft media panels, a few
clear words per section and one obvious way to book from anywhere. The reference for the
feel was a modern experience-booking site (big image-led hero, simple bookable cards, pill
buttons, quiet type); the content stays a driving school's: the ex-tester credential,
prices up front, live availability.

Every screen uses the same few materials: white paper, a neutral mist surface for cards
and bands, ink for text and for the one dark panel per page, and brand red for action.

## Colours

The palette is fixed: red `#C8102E`, ink `#0A0A0A`, white. Greys are neutrals only.

- **Red** is the action colour: primary buttons, the learner's own selection (calendar day,
  time, active step), stars, eyebrow markers, link underlines, focus rings. **Red press**
  is its hover. **Red mist** is a whisper of it behind step numbers, tags and focus halos.
- **Ink** is text, the hero and closing panels, secondary buttons and the selected-slot bar.
- **Mist** (`#F5F5F4`) is the card and band surface. Grey 100 to 300 are hairlines and
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
phones and 120px from 768px. Media panels (hero, ink band, close) run a little wider than
the text column and carry a 28px radius.

On phones a floating pill action bar (WhatsApp, Book now, Contact) slides up after 300px
of scroll; the body reserves space for it. It is hidden from 768px.

## Components

- **Nav:** a full-width translucent bar that settles into a floating pill once you scroll.
  Wordmark recreates the logo (red L and N). The Book button is always present.
- **Buttons:** pills. Red primary, ink secondary, white line, ghost on ink. 48px tall
  (56px large); arrows nudge right on hover; buttons compress slightly on press.
- **Lesson cards** (`.l-offer`): mist cards with meta, name, short description, price and
  one booking button. The EDT bundle is the ink card with the red button.
- **Rows** (prices), **service choices** (booking), **FAQ** items and **contact options**
  are mist cards that lift to white with a soft shadow on hover.
- **Booking calendar:** white day cards with a green open dot; full days fade into mist;
  the chosen day and time fill red. The selected slot rides in an ink pill above the thumb.
- **Result screens:** a round status mark, a mist fact table, numbered next steps.
- **Admin:** a working tool. Segmented pill tabs, mist info panels, soft cards, toasts.

## Photography

No photos of Conor or the car exist yet, and none are faked. `components/lton/PhotoSlot.tsx`
frames each slot and renders a designed brand panel until a photo is supplied (ink slots
show a road and the L plate; mist slots show the real logo and the N plate). Each slot's
`data-wants` attribute names the photo it is waiting for.

To add photos, put them in `public/photos/` and pass `src` to the slot:

| Slot | File | Where |
|---|---|---|
| Hero | `/photos/hero.jpg` (wide, the car on a Dublin road) | `app/page.tsx` |
| Credential | `/photos/conor.jpg` (portrait beside the car) | `app/page.tsx` |
| About | `/photos/conor.jpg` (portrait) | `app/about/page.tsx` |

The hero already has a dark gradient scrim so white text stays legible over any photo.

## Motion

- Nav morphs from bar to floating pill; mobile action bar slides up.
- Hero word rotates once through three words; the review carousel fades every 5s and
  pauses on hover and focus.
- Cards, steps and reviews rise in as they scroll into view (CSS scroll-driven
  animations; browsers without support simply show them).
- The closing L plate turns into an N with scroll progress.
- The hero's road line runs slowly.
- Everything has a `prefers-reduced-motion` path: no reveals, no looping road, no rotating
  word or carousel autoplay, no hover lifts.
