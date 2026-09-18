---
name: The Driving School Dublin
description: L to N. The logo's heavy grotesque and the red learner plate, carried across a booking site.
colors:
  plate-red: "#C8102E"
  plate-red-press: "#A50D26"
  plate-red-mist: "#FFE3E7"
  ink: "#0A0A0A"
  paper: "#FFFFFF"
  grey-50: "#F4F4F4"
  grey-100: "#E9E9E9"
  grey-300: "#BDBDBD"
  grey-placeholder: "#8A8A8A"
  grey-600: "#5C5C5C"
  grey-on-ink: "#A3A3A3"
  open-green: "#3F7A52"
  open-green-soft: "#EDF4EF"
  ok-deep: "#1F4A2F"
  error-soft: "#FBEFF1"
  error-deep: "#7A0A1C"
  pending-soft: "#F8F4EA"
  pending-deep: "#7A5A12"
  refunded-soft: "#EEF2F7"
  refunded-deep: "#3A5378"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(52px, 14.4vw, 96px)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 88"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(40px, 10.4vw, 72px)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 88"
  title:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 7.6vw, 48px)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 90"
  numeral:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(44px, 12.4vw, 64px)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.04em"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 90"
  quote:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(26px, 6.6vw, 44px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.018em"
    fontVariation: "'wdth' 94"
  item:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.3
  meta:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  tag: "4px"
  counter: "6px"
  control: "8px"
  plate: "10px"
  float: "12px"
  disc: "50%"
spacing:
  gutter-phone: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  section-phone: "56px"
  section-tablet: "88px"
  row: "22px"
  stack: "18px"
components:
  button-primary:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.plate-red-press}"
    textColor: "{colors.paper}"
  button-primary-large:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "56px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-ink-hover:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
  button-line:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
    height: "50px"
  tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.plate-red}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  tag-solid:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  plate:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.plate-red}"
    rounded: "{rounded.plate}"
    size: "84px"
  price-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "14px"
  price-tile-red:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
    padding: "14px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "20px"
  credential-band:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "64px 20px"
  day-open:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "92px"
  day-full:
    backgroundColor: "{colors.grey-50}"
    textColor: "{colors.grey-600}"
    rounded: "{rounded.control}"
  day-selected:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
  time-slot:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "56px"
  time-slot-selected:
    backgroundColor: "{colors.plate-red}"
    textColor: "{colors.paper}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.plate}"
    padding: "12px 18px"
---

# Design System: The Driving School Dublin

## Overview

**Creative North Star: "L to N"**

The site speaks the logo's language: a heavy, slightly condensed black grotesque on white, and the red learner plate. The plate is the recurring object. It sits tilted beside the hero headline as an L, and at the close of the homepage it turns into an N as the page scrolls toward booking. Every screen, from the marketing pages to the booking flow, the EDT package link and the admin dashboard, is built from the same few materials: white paper, 2px ink rules, square plate tiles, and a single red that is spent sparingly.

Density is plain and confident. Structure comes from horizontal 2px black rules rather than cards: price rows, steps, FAQ, reviews, contact options and booking services are all ruled lists. Numbers are the interface; prices, ratings, counters and dates are set huge, heavy and tabular. One full-black band per page carries the credential, and nothing else is allowed that weight.

Motion is physical and short: things land, flip and slide as if they were plates being handled. Every animation has a `prefers-reduced-motion` path that either removes it or ends it in its final state.

**Key Characteristics:**
- Red, black, white and neutral greys only; muted functional status tones are the single exception.
- Archivo variable, 800 to 900 and condensed on the width axis for display; 400 to 600 for text.
- 2px ink rules as the structural line; ruled lists over boxed cards.
- The learner plate (white square, 2px ink border, red letter, soft drop shadow) as the signature object.
- One red fill per view; one black field per page.
- Tabular, heavy numerals for every price, rating and count.

## Colors

A fixed three-colour brand (plate red, ink, paper) over a neutral grey ramp, with muted status tones that carry meaning without competing.

### Primary
- **Plate Red** (#C8102E): the brand red from the logo. The one filled primary action per view, the one red price tile, the learner's own calendar selection, the plate letters, drawn rating stars, link underlines, active tab underline, focus outline and text selection.
- **Plate Red Press** (#A50D26): hover and pressed state of red fills only.
- **Plate Red Mist** (#FFE3E7): secondary text sitting on a red fill (tile meta, selected day labels).

### Neutral
- **Ink** (#0A0A0A): all primary text, every 2px rule and border, the credential band, the nav's persistent Book button, toasts, numbered step markers, and hover fills on outlined controls.
- **Paper** (#FFFFFF): the page ground and every tile, panel and control surface.
- **Grey 50** (#F4F4F4): footer ground, row hover, neutral notice ground, full (unavailable) calendar days.
- **Grey 100** (#E9E9E9): the nav's hairline bottom border when flat, full-day borders.
- **Grey 300** (#BDBDBD): resting input and time-slot borders, thin 1px sub-rules inside lists and fact tables, stepper connectors.
- **Grey Placeholder** (#8A8A8A): input placeholder text only.
- **Grey 600** (#5C5C5C): secondary text on white (6.6:1): descriptions, meta, captions, inactive tabs.
- **Grey on Ink** (#A3A3A3): secondary text inside the black band (7.9:1).

### Tertiary (functional status only)
- **Open Green** (#3F7A52) with **Open Green Soft** (#EDF4EF): available days in the booking calendar (border, day labels, marker dot, hover ground) and success. **OK Deep** (#1F4A2F) is the text of success notices.
- **Error Soft** (#FBEFF1) and **Error Deep** (#7A0A1C): error notice ground and text, bordered in plate red.
- **Pending** (#F8F4EA / #7A5A12) and **Refunded** (#EEF2F7 / #3A5378): admin payment status badges only.

The stock Tailwind palette on the admin, EDT token and confirmation screens is remapped at the root so slate and gray become this grey ramp, red becomes plate red, and emerald, green, amber and blue become these muted status tones. New Tailwind-styled work inherits the brand by using those stock names.

### Named Rules
**The One Red Rule.** Red fills exactly one button, tile or selection per view. Where two would meet, the second steps down to ink: the nav's Book button is ink (red only on hover), and on phones the closing Book button is ink because the mobile action bar already carries the red. Red text accents (plate letters, stars, underlines) do not count against the fill.

**The Black Field Rule.** One full-bleed black band per page, reserved for the credential. Ink may fill small controls and markers, never a second section.

**The Muted Status Rule.** Status colours are desaturated and never used decoratively. Brand red is never a status colour for "available"; it means "yours".

## Typography

**Display Font:** Archivo variable, width axis (with Helvetica Neue, Arial)
**Body Font:** Archivo (same family)

**Character:** One family doing two jobs. At 900 and pulled to 88 to 90% width with tight negative tracking it echoes the stacked logo wordmark; at 400 to 600 it reads as plain, calm text.

### Hierarchy
- **Display** (900, clamp 52px to 96px, 0.9, width 88%): the page headline, one per page, balanced wrapping. Page intros use clamp 48px to 96px.
- **Headline** (900, clamp 40px to 72px, 0.92): section headings and result-screen headings.
- **Title** (900, clamp 30px to 48px, 0.95, width 90%): group headings within a page. Fixed 20px to 22px 900 for in-flow headings (booking groups, next steps).
- **Numeral** (900, clamp 44px to 64px, 0.88, tabular lining figures): prices on tiles. Row prices 36px (44px from 768px), service prices 28px, calendar dates 30px, counters 36px, rating score 30px.
- **Quote** (800, clamp 26px to 44px, 1.12, width 94%): the review carousel; the key phrase is underlined in red at 0.12em thickness.
- **Item** (800, 18px to 20px, 1.2): names in ruled rows, FAQ questions, step titles.
- **Lede** (400, 17px, 19px from 768px, 1.5, max 36ch): the line under a page headline.
- **Body** (400, 16px, 1.55, grey 600): descriptions. Long prose 17px at 1.65 with a 62ch measure.
- **Label** (800, 15px): buttons, form labels, nav links, tabs.
- **Meta** (600 to 700, 13px to 14px, grey 600): units, dates, hints, footer base.

### Named Rules
**The Numbers Are the Interface Rule.** Every price, rating, count, date and time uses tabular lining numerals and is set heavier and larger than the words around it.

**The Sentence Case Rule.** Headings, labels and buttons are sentence case. Uppercase is used only for three-letter day and month abbreviations inside calendar cells.

## Layout

Mobile first at 390px, then 768px and 1440px. Content sits in a 1200px main column. The horizontal gutter is a single variable: 20px on phones, 32px from 768px, 48px from 1200px. Sections breathe at 56px vertical on phones and 88px from 768px; the credential band runs 64px and 104px; the close runs 72px to 112px.

Lists are the default layout primitive: full-width rows between 2px ink rules, 20px to 26px of vertical padding each, with 1px grey 300 sub-rules for secondary lists and fact tables. Two-column splits appear from 1000px (1.15fr to 1fr, 64px gap). Price tiles run two across on phones and four across from 1100px; steps stack on phones and become three ruled columns from 1100px. The booking flow is a centred 760px column (560px for narrow steps); result screens are 620px.

On phones a fixed action bar (call, book, WhatsApp) sits at the bottom with safe-area padding, and the body reserves 84px beneath content for it. It is hidden from 768px. The selected-slot bar in booking sticks 12px above the bottom of the viewport.

## Elevation & Depth

Flat by default. Depth comes from the 2px ink border, not from shadow. Soft, diffuse, negatively spread ink shadows appear only on objects that physically float above the page: the plate, the floating nav, the mobile action bar, the sticky selected-slot bar, toasts and the result mark. The admin strips Tailwind's card shadows and replaces rings with a 2px ink outline.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 14px 30px -12px rgba(10,10,10,0.4), 0 2px 4px rgba(10,10,10,0.12)`): the L and N plates, as if lifted off the page.
- **Floating nav** (`box-shadow: 0 12px 28px -14px rgba(10,10,10,0.35)`): the nav once it becomes a floating plate.
- **Sticky bar** (`box-shadow: 0 16px 32px -18px rgba(10,10,10,0.45)`): selected-slot bar; the mobile action bar casts the same idea upward (`0 -10px 24px -16px rgba(10,10,10,0.35)`).
- **Toast** (`box-shadow: 0 16px 32px -14px rgba(10,10,10,0.5)`).

### Named Rules
**The Lifted Object Rule.** A shadow means the thing is an object in hand (a plate, a floating bar). Panels, tiles, rows and cards never carry one.

## Shapes

Squared-off plate geometry with small, consistent radii: 4px for tags, 6px for step numbers and nav link hit areas, 8px for buttons, inputs, calendar days and time slots, 10px for plates, tile grids, panels and counters, 12px for the floating nav and modals. Full circles appear only on the plus and close toggles of tiles and FAQ items and on calendar marker dots. Borders are 2px everywhere that matters; 1px is reserved for sub-rules. Plates are tilted a few degrees (7deg hero, -5deg close, -4deg result mark), never squared to the grid.

## Components

### Buttons
Heavy, square-cornered and tactile; they compress on press.
- **Shape:** gently rounded rectangle (8px), 2px border, 48px minimum height (56px large, 44px compact, 64px for the desktop close).
- **Primary:** plate red fill and border, white 800 label, trailing arrow.
- **Hover / Focus:** red deepens to press red; the arrow slides 3px right; press scales to 0.97. Focus is a 3px plate red outline offset 3px. Hover effects only apply on hover-capable devices.
- **Line:** white fill, ink border and label; fills ink with white text on hover.
- **Ink:** the stepped-down primary (nav, phone close), turns red on hover.
- **Icon:** 44px square variant for icon-only actions.
- **Text link:** 700 ink with a 2px red underline at 5px offset that tightens to 3px on hover.

### Chips
- **Style:** square tag (4px), 2px current-colour border, 12px 800 label, red text on white; solid variant is red fill with white text.
- **State:** static labels only (price row badges, review badges, service tags). Never pills.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** paper.
- **Shadow Strategy:** none (see The Lifted Object Rule).
- **Border:** 2px ink.
- **Internal Padding:** 20px, 28px from 768px.
Panels are rare; ruled lists do most of the work.

### Inputs / Fields
- **Style:** paper ground, 2px grey 300 border, 8px radius, 50px minimum height, 16px 500 text. Labels are 15px 800 ink above the field; required marks in red, optional notes in grey.
- **Focus:** border goes ink with a 3px plate red halo at 25% opacity. Hover darkens the border to grey 600.
- **Error / Disabled:** invalid fields take a red border and a 14px 700 red message below. Disabled buttons drop to 55% opacity.

### Navigation
Sticky header in two states. Flat: full-width white bar with a grey 100 hairline, stacked wordmark (900, red L and N) left, 700 15px links with a red underline that wipes in from the left on hover, ink Book button right. Scrolled: the shell contracts into a floating plate (max 1160px, 2px ink border, 12px radius, floating nav shadow) over 300ms, keeping a constant 76px height. Links hide below 768px, where the mobile action bar takes over.

### The Plate (signature)
A white square with a 2px ink border, 10px radius, the plate shadow and a 900 red letter at 80% of its size. In the hero it lands on load (drops, scales down and rotates into its 7deg tilt over 820ms) and then drifts and rotates with scroll where scroll timelines are supported. At the homepage close it turns from L to N: scroll-linked on a view timeline where supported, otherwise flipped once by an observer at 50% visibility. Reduced motion shows the final state with no movement. The result mark on confirmation and EDT screens is the same object at 72px, tilted -4deg, carrying a check, warning or "?" instead of a letter.

### Price Tiles
A grid of plate tiles separated by 2px ink gutters inside a 10px ink-bordered frame. Each tile leads with its name and a huge price, and flips in 3D (620ms) to its details and a Book link via a circular plus toggle that rotates to a cross. Exactly one tile is red.

### Ruled Rows
Price rows, booking service rows, steps, FAQ, reviews and contact options: content between 2px ink rules, name in 800, description in grey, price right-aligned in heavy tabular numerals. Service rows end in a 44px bordered arrow square that fills red on row hover.

### Booking Calendar
Day cells (8px, 92px tall) bordered in open green with green uppercase day and month abbreviations and a green marker dot; full days go grey 50 and quiet with no marker; the learner's selection fills plate red. Time slots are 56px grey-bordered buttons in two to four columns that fill red when chosen. A three-step stepper sits above on a 2px rule: active step is an ink square, done steps are ink-outlined.

### Credential Band
The one black field: full-bleed ink, white headline, test centres listed in 900 condensed type between white and #333 rules, each sliding in from blur as it enters the viewport where view timelines are supported.

### Motion
Two easings: `cubic-bezier(0.16, 1, 0.3, 1)` for state changes and `cubic-bezier(0.22, 1, 0.36, 1)` for things landing. State transitions run 160ms to 320ms; the tile flip 620ms; the plate turn 1100ms. The rotating hero line swaps words with a blur and lift; the review carousel crossfades with an 8px lift and blur, its square dots turning into red diamonds when current; the mobile action bar slides up on arrival; FAQ answers and time grids fade down 6px. Reduced motion removes transforms and blur and keeps only short opacity changes.

## Do's and Don'ts

### Do:
- **Do** build structure from 2px ink rules (`2px solid #0A0A0A`) and ruled lists before reaching for a boxed card.
- **Do** spend plate red (#C8102E) on one fill per view and step any second primary down to ink.
- **Do** set every price, rating, count, date and time in 900 Archivo with tabular lining numerals.
- **Do** keep radii to the 4 / 6 / 8 / 10 / 12px ladder and borders at 2px.
- **Do** give every animation a `prefers-reduced-motion` path and keep hover effects inside `(hover: hover)`.
- **Do** use the stock Tailwind names on Tailwind-styled screens so the root remap brings them onto the brand.
- **Do** keep touch targets at 44px minimum.

### Don't:
- **Don't** introduce a new accent, a second brand colour or a gradient colour field; red, black, white and greys only, plus muted status tones.
- **Don't** add a second full-black section to a page; the band belongs to the credential.
- **Don't** use pill-shaped buttons or chips; tags are 4px squares and buttons 8px.
- **Don't** put shadows on tiles, panels, rows or cards, and never use hard offset shadows.
- **Don't** set small uppercase tracked labels above headings; headings stand on their own.
- **Don't** use text glyphs as icons; icons are inline SVG in one 2px stroke family with square caps.
- **Don't** use a serif or system display face; Archivo carries every role.
