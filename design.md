---
version: alpha
name: Spotify
description: |
  Spotify's design system embodies a dark, minimalist aesthetic centered on deep
  blacks and neutral grays that create an immersive, distraction-free listening
  experience. The visual language prioritizes content over chrome—album artwork,
  artist imagery, and song data dominate the interface while the UI itself
  recedes into a sophisticated dark backdrop. The system balances playfulness in
  interactive elements (pill-shaped buttons, smooth hover states) with serious
  restraint in typography and color blocking. This creates a premium, focused
  atmosphere where music is the star and the interface acts as a refined
  conductor. The overall mood is modern, accessible, and deeply functional—every
  pixel serves the core mission of music discovery and playback.
source:
  url: "https://spotify.com"
  pagesAnalyzed: 1
  extractedAt: 2026-09-08
  tokensMeasured: true
colors:
  primary: "#292929"
  canvas: "#121212"
  on-primary: "#FFFFFF"
  ink: "#FFFFFF"
  hairline: "#7C7C7C"
  accent-1: "#9E9EFF"
  neutral-1: "#B3B3B3"
  neutral-2: "#000000"
  neutral-3: "#1F1F1F"
  neutral-4: "#555555"
typography:
  heading-sm:
    fontFamily: SpotifyMixUITitle
    fontSize: 24px
    fontWeight: 700
    letterSpacing: 0px
  heading-xs:
    fontFamily: SpotifyMixUI
    fontSize: 16px
    fontWeight: 700
    letterSpacing: 0px
  body-md:
    fontFamily: SpotifyMixUI
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-sm:
    fontFamily: SpotifyMixUI
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-sm-strong:
    fontFamily: SpotifyMixUI
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0px
  label:
    fontFamily: SpotifyMixUI
    fontSize: 13.3333px
    fontWeight: 400
    letterSpacing: 0px
  caption:
    fontFamily: SpotifyMixUI
    fontSize: 12px
    fontWeight: 400
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 6px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 28px
  xxxl: 32px
  section: 40px
  band: 48px
borderWidths:
  thin: 1px
elevationStrategy: color-blocking
themes:
  derived: light   # the other theme is the site's measured palette
  light:
    bg: "#FBFBFB"
    surface: "#F1F1F1"
    surfaceRaised: "#E9E9E9"
    text: "#121212"
    textMuted: "#747474"
    border: "#D8D8D8"
    accent: "#292929"
    accentFg: "#FFFFFF"
    focusRing: "#292929"
    elevation: shadow
  dark:
    bg: "#121212"
    surface: "#111111"
    surfaceRaised: "#242424"
    text: "#FFFFFF"
    textMuted: "#ACACAC"
    border: "#7C7C7C"
    accent: "#666666"
    accentFg: "#FFFFFF"
    focusRing: "#292929"
    elevation: "border+surface"
gradients:
  - context: hero
    kind: linear
    value: "linear-gradient(rgba(0, 0, 0, 0.6) 0%, rgb(18, 18, 18) 100%), url(\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj4KICAgPGZpbHRlciBpZD0ibiIgeD0iMCIgeT0iMCI+CiAgICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgogICAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIiAvPgogICA8L2ZpbHRlcj4KICAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMC4wNSIgLz4KPC9zdmc+\")"
  - context: section
    kind: linear
    value: "linear-gradient(90deg, rgb(175, 40, 150), rgb(80, 155, 245))"
components:
  button-icon:
    textColor: "{colors.ink}"
    height: 48px
    padding: "12px 12px 12px 12px"
    fontSize: 16px
    fontFamily: SpotifyMixUI
    fontWeight: 400
    rounded: "50%"
    backgroundColor: "{colors.neutral-3}"
  button-icon-sm:
    typography: "{typography.label}"
    textColor: "{colors.neutral-1}"
    height: 35px
    padding: "8px 8px 8px 8px"
    rounded: "{rounded.full}"
    backgroundColor: "{colors.neutral-3}"
  button-outline:
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    height: 32px
    padding: "4px 16px 4px 36px"
    fontSize: 14px
    fontFamily: SpotifyMixUI
    fontWeight: 700
    rounded: "{rounded.full}"
  button-text:
    typography: "{typography.heading-xs}"
    textColor: "{colors.neutral-1}"
    height: 48px
    rounded: "{rounded.full}"
  button-text-sm:
    textColor: "{colors.neutral-1}"
    height: 32px
    fontSize: 14px
    fontFamily: SpotifyMixUI
    fontWeight: 700
    rounded: "{rounded.full}"
  card:
    textColor: "{colors.ink}"
    padding: "12px 12px 12px 12px"
    fontSize: 16px
    fontFamily: SpotifyMixUI
    fontWeight: 400
    rounded: "{rounded.xs}"
  card-2:
    textColor: "{colors.ink}"
    fontSize: 16px
    fontFamily: SpotifyMixUI
    fontWeight: 400
  navigation:
    textColor: "{colors.neutral-1}"
    fontSize: 16px
    fontFamily: SpotifyMixUI
    fontWeight: 400
  link:
    textColor: "{colors.ink}"
    padding: "8px 8px 8px 8px"
    fontSize: 16px
    fontFamily: SpotifyMixUI
    fontWeight: 400
    rounded: "50%"
    backgroundColor: "{colors.primary}"
  link-2:
    typography: "{typography.heading-sm}"
    textColor: "{colors.ink}"
states:
  other-hover:
    target: other
    state: hover
    textColor: "rgb(31, 150, 219)"
  other-focus:
    target: other
    state: focus
    outline: "{colors.neutral-2} solid 2px"
    outlineColor: "{colors.neutral-2}"
    outlineWidth: 2px
  link-focus:
    target: link
    state: focus
    outline: "{colors.neutral-2} solid 2px"
    outlineColor: "{colors.neutral-2}"
    outlineWidth: 2px
  link-hover:
    target: link
    state: hover
    textColor: "rgb(86, 86, 86)"
  button-hover:
    target: button
    state: hover
    opacity: 1
    textDecoration: underline
  other-disabled:
    target: other
    state: disabled
    opacity: 0.8
  button-active:
    target: button
    state: active
    textColor: "{colors.ink}"
    borderColor: "rgba(162, 192, 169, 0.5)"
    borderWidth: 1px
    backgroundColor: "rgb(44, 100, 21)"
  input-focus:
    target: input
    state: focus
    outline: "{colors.neutral-2} auto 1px"
    outlineColor: "{colors.neutral-2}"
    outlineWidth: 1px
  link-focus-visible:
    target: link
    state: focus-visible
    outline: "{colors.neutral-2} solid 2px"
    outlineColor: "{colors.neutral-2}"
    outlineWidth: 2px
  button-focus:
    target: button
    state: focus
    outline: "{colors.neutral-2} solid 2px"
    outlineColor: "{colors.neutral-2}"
    outlineWidth: 2px
breakpoints:
  - width: 375
    containerWidth: 63
    gridColumns: 3
    navLinksVisible: 28
    menuToggleVisible: false
    headingPx: 20
    bodyPx: 16
    sectionPaddingX: 20
  - width: 768
    containerWidth: 16
    gridColumns: 2
    navLinksVisible: 28
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 20
  - width: 1024
    containerWidth: 32
    gridColumns: 2
    navLinksVisible: 28
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 20
  - width: 1280
    containerWidth: 32
    gridColumns: 2
    navLinksVisible: 28
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 20
  - width: 1440
    containerWidth: 48
    gridColumns: 2
    navLinksVisible: 28
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 20
coverage:
  statesFound: 30
  gradientsFound: 2
  rolesUnassigned: 5
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Spotify

## 1. Visual Theme & Atmosphere

Spotify's design system embodies a dark, minimalist aesthetic centered on deep blacks and neutral grays that create an immersive, distraction-free listening experience. The visual language prioritizes content over chrome—album artwork, artist imagery, and song data dominate the interface while the UI itself recedes into a sophisticated dark backdrop. The system balances playfulness in interactive elements (pill-shaped buttons, smooth hover states) with serious restraint in typography and color blocking. This creates a premium, focused atmosphere where music is the star and the interface acts as a refined conductor. The overall mood is modern, accessible, and deeply functional—every pixel serves the core mission of music discovery and playback.

**Key Characteristics**
- Ultra-dark color foundation (`{colors.canvas}` — `#121212`) with high contrast headings in pure white (`{colors.on-primary}` — `#FFFFFF`)
- Pill-shaped CTAs and interactive buttons for friendly, approachable engagement
- Minimal use of color; when accent colors appear, they are deliberate and eye-catching
- Sharp cards with subtle radius on imagery; navigation and containers remain flat
- Extensive use of opacity and neutral grays (`{colors.hairline}` — `#7C7C7C`) to create hierarchy without added hue
- Hover states featuring color changes and underlines rather than shadow depth
- Gradient decorative elements used sparingly for hero sections and visual breaks

## 2. Color Palette & Roles

### Primary
- **Brand / Primary** (`{colors.primary}` — `#292929`): Primary CTA fills, active states, and brand accent elements. Used as the default interactive background.
- **On Primary / Ink** (`{colors.on-primary}` — `#FFFFFF`): Headings, primary text, and labels on brand surfaces; ensures maximum contrast and readability over dark backgrounds.

### Accent Colors
- **Accent Decorative** (`{colors.accent-1}` — `#9E9EFF`): Unassigned decorative accent; currently without a defined role but available for future expansion or feature highlighting.

### Interactive
- **Secondary Button & Link Text** (`{colors.neutral-1}` — `#B3B3B3`): Default text for secondary buttons, footer links, and navigation labels. Provides softer emphasis than white while remaining readable.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#121212`): Default page background and primary surface; the foundational dark tone of the entire system.
- **Hairline / Border** (`{colors.hairline}` — `#7C7C7C`): Thin dividers, 1px borders, and subtle visual separation between elements.
- **Deep Neutral** (`{colors.neutral-2}` — `#000000`): Pure black for maximum contrast elements or overlay backgrounds.
- **Subtle Surface** (`{colors.neutral-3}` — `#1F1F1F`): Slightly lifted from canvas for layered surfaces or secondary containers.
- **Mid-tone** (`{colors.neutral-4}` — `#555555`): Intermediate gray for secondary UI elements and muted text.

### Surface & Borders
All surfaces use flat color blocking; no shadows create depth. The canvas and its neutral variants provide the only dimensional hierarchy through luminance shifts.

## 3. Typography Rules

### Font Family
**Primary:** SpotifyMixUI with fallback stack `SpotifyMixUI, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`

**Display/Heading:** SpotifyMixUITitle with fallback stack `SpotifyMixUITitle, SpotifyMixUI, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display (Hero) | SpotifyMixUITitle | 24px | 700 | normal | 0 | Primary section headings; used for "Trending songs", "Popular artists" |
| Body | SpotifyMixUI | 16px | 400 | normal | 0 | Default body copy, card descriptions, and general content |
| Button | SpotifyMixUI | 14px–16px | 700 | normal | 0 | Call-to-action text; weights and sizes vary by button variant |
| Link | SpotifyMixUITitle | 24px | 700 | normal | 0 | Primary navigation links and brand marks |
| Caption | SpotifyMixUI | 13.3px | 400 | normal | 0 | Small icon button labels and secondary text |

### Principles
- Typography is hierarchical through **size and weight** alone; hue remains consistent (white for primary text, neutral gray for secondary).
- All body and button text uses the neutral SpotifyMixUI family to ensure clarity and accessibility.
- Display and heading text shifts to SpotifyMixUITitle at 700 weight for emphasis and distinctiveness.
- Line height is kept at `normal` throughout, trusting letterform design for readability rather than loose spacing.
- No letter-spacing adjustments are applied; the system relies on the typeface's inherent metrics.

## 4. Component Stylings

### Buttons

**Primary Icon Button**
- **Background:** `rgb(31, 31, 31)` (`{colors.neutral-3}` lifted)
- **Color:** `rgb(255, 255, 255)` (`{colors.on-primary}`)
- **Width / Height:** 48px × 48px
- **Padding:** `{spacing.sm}` (12px) on all sides
- **Border Radius:** `{rounded.full}` (9999px) — fully rounded pill
- **Font Size:** 16px
- **Font Weight:** 400
- **Font Family:** SpotifyMixUI
- **Border:** None
- **Box Shadow:** None
- **Hover State:** Opacity reduces to 0.6; text remains white
- **Focus State:** Solid outline `rgb(0, 0, 0)` 2px

**Secondary Icon Button (Small)**
- **Background:** `rgb(31, 31, 31)`
- **Color:** `rgb(179, 179, 179)` (`{colors.neutral-1}`)
- **Width / Height:** 35px × 35px
- **Padding:** `{spacing.xs}` (8px) on all sides
- **Border Radius:** `{rounded.full}` (9999px)
- **Font Size:** 13.3px
- **Font Weight:** 400
- **Font Family:** SpotifyMixUI
- **Border:** None
- **Hover State:** Opacity to 0.6

**Outline Button**
- **Background:** `rgba(0, 0, 0, 0)` — transparent
- **Color:** `rgb(255, 255, 255)`
- **Width / Height:** 102px × 32px
- **Padding:** 4px 16px 4px 36px (left padding accounts for icon)
- **Border:** 1px solid `{colors.hairline}` (`rgb(124, 124, 124)`)
- **Border Radius:** `{rounded.full}` (9999px)
- **Font Size:** 14px
- **Font Weight:** 700
- **Font Family:** SpotifyMixUI
- **Hover State:** Border color shifts to `rgb(30, 174, 219)`; background fills with that color; text becomes white
- **Focus State:** Outline 2px solid `rgb(0, 0, 0)`; border 2px solid `rgb(0, 0, 0)`

**Text Button**
- **Background:** `rgba(0, 0, 0, 0)` — transparent
- **Color:** `rgb(179, 179, 179)` (`{colors.neutral-1}`)
- **Width:** Auto (153px–129px measured)
- **Height:** 48px (32px for small variant)
- **Padding:** None (0px)
- **Border Radius:** `{rounded.full}` (9999px)
- **Font Size:** 16px (14px for small variant)
- **Font Weight:** 700
- **Font Family:** SpotifyMixUI
- **Border:** None
- **Hover State:** Text underlines; color may shift based on context
- **Focus State:** Outline 2px solid `rgb(0, 0, 0)`

### Cards & Containers

**Album / Content Card**
- **Background:** `rgba(0, 0, 0, 0)` — transparent (imagery shows through)
- **Color:** `rgb(255, 255, 255)` (`{colors.on-primary}`)
- **Width:** 195.5px
- **Height:** 291.5px
- **Padding:** `{spacing.sm}` (12px) on all sides for default variant; 0px for flat variant
- **Border Radius:** `{rounded.xs}` (6px) for imagery container; `{rounded.none}` (0px) for flat variant
- **Font Size:** 16px
- **Font Weight:** 400
- **Border:** None
- **Box Shadow:** None

**Card container uses color blocking only; imagery is rounded via child element with** `{rounded.xs}`

### Inputs & Forms

**Text Input (Focus State)**
- **Background:** `rgba(0, 0, 0, 0)` — transparent
- **Color:** Text in white or neutral gray as appropriate
- **Border:** 1px solid `rgb(0, 0, 0)` on focus
- **Border Radius:** `{rounded.none}` (0px) — sharp corners
- **Outline:** Auto 1px `rgb(0, 0, 0)` (varies per variant: some show 2px width)
- **Focus State:** Border color becomes `rgb(0, 0, 0)` 1px; outline auto 1px black

### Navigation

**Sidebar Navigation**
- **Background:** `rgba(0, 0, 0, 0)` — transparent
- **Color:** `rgb(179, 179, 179)` (`{colors.neutral-1}`)
- **Width:** 331px
- **Height:** 754px (full sidebar height)
- **Padding:** 0px
- **Border Radius:** `{rounded.none}` (0px)
- **Font Size:** 16px
- **Font Weight:** 400
- **Border:** None
- **Hover State:** Text color shifts to `rgb(86, 86, 86)` or blue accent depending on link role
- **Active/Focus:** Outline 2px solid `rgb(0, 0, 0)` or 1px as context requires

### Links

**Link (Icon / Logo)**
- **Background:** `{colors.primary}` (`rgb(41, 41, 41)`)
- **Color:** `rgb(255, 255, 255)` (`{colors.on-primary}`)
- **Width / Height:** 40px × 40px
- **Padding:** `{spacing.xs}` (8px) on all sides
- **Border Radius:** `{rounded.full}` (9999px) — circular
- **Font Size:** 16px
- **Border:** None
- **Hover State:** Color shifts to `rgb(56, 96, 190)` or `rgb(34, 133, 247)` depending on link type

**Link (Text / Heading)**
- **Background:** `rgba(0, 0, 0, 0)`
- **Color:** `rgb(255, 255, 255)` (`{colors.on-primary}`)
- **Font Size:** 24px
- **Font Weight:** 700
- **Font Family:** SpotifyMixUITitle
- **Border Radius:** `{rounded.none}` (0px)
- **Hover State:** Text color to `rgb(255, 255, 255)` (white maintained); underline applied; or background shifts to white in some contexts
- **Focus State:** Outline 1px or 2px solid `rgb(0, 0, 0)` as per focus variant

### Footer

**Footer Container**
- **Background:** `rgba(0, 0, 0, 0)` — transparent
- **Color:** `rgb(179, 179, 179)` (`{colors.neutral-1}`)
- **Width:** 1045px
- **Height:** 361px
- **Padding:** 0px
- **Font Size:** 16px
- **Font Weight:** 400
- **Border:** None
- **Links within:** Styled as text with hover state color shifts to lighter blues or grays

## 5. Layout Principles

### Spacing System
Spotify's spacing system is based on a `{spacing.xs}` (8px) unit, scaling up in consistent increments:

- **`{spacing.xxs}`** (4px): Micro-adjustments between tightly grouped elements
- **`{spacing.xs}`** (8px): Padding within icon buttons and tight groupings
- **`{spacing.sm}`** (12px): Card and content padding; small component margins
- **`{spacing.md}`** (16px): Standard horizontal margins, content insets, and sidebar spacing
- **`{spacing.lg}`** (20px): Section dividers and larger content gaps
- **`{spacing.xl}`** (24px): Major section padding and hero spacing
- **`{spacing.xxl}`** (28px): Large grouping separations
- **`{spacing.xxxl}`** (32px): Container padding and region boundaries
- **`{spacing.section}`** (40px): Full section vertical spacing
- **`{spacing.band}`** (48px): Hero bands and full-width section spacing

Usage context: Sidebar edges use `{spacing.md}` (16px); section padding uses `{spacing.section}` (40px) or `{spacing.band}` (48px); card interiors use `{spacing.sm}` (12px).

### Grid & Container
- **Max Width:** Containers scale to viewport width with no fixed max constraint.
- **Column Strategy:** Two-column layout observed at all breakpoints; content flows left sidebar (331px fixed) + main content area.
- **Section Patterns:** Content is laid out in horizontal scrolls (trending songs, popular artists, albums) with padding around image cards (`{spacing.md}` on sides).
- **Responsive Padding:** Section horizontal padding remains consistent at `{spacing.section}` (40px) across desktop; reduced to `{spacing.lg}` (20px) on mobile (375px).

### Whitespace Philosophy
Spotify employs **color-blocking** as the primary depth mechanism: surfaces are created through luminance shifts in the neutral palette rather than shadow or padding. Whitespace is generous within cards and between sections, creating visual breathing room. The sidebar and main content area are clearly separated by their background colors and the fixed left column creates strong visual anchoring. Grouped elements (artist + label, song + artist) use tight spacing (`{spacing.xs}` to `{spacing.sm}`) while section breaks use maximum spacing (`{spacing.section}` to `{spacing.band}`).

### Border Radius Scale
- **`{rounded.none}`** (0px): Used on cards (flat variant), inputs, modals, and navigation containers—keeping the interface sharp and structured.
- **`{rounded.xs}`** (6px): Applied to image containers and subtle rounded corners on content cards, softening the look slightly while maintaining crispness.
- **`{rounded.full}`** (9999px): Used exclusively on buttons (all variants) and circular link elements, creating the signature pill-shaped CTA aesthetic.

### Border Widths
- **`thin`** (1px): Applied to outline buttons and input focus states; `1px solid {colors.hairline}` for default state, `1px solid rgb(0, 0, 0)` on focus.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow; color blocking only | Default cards, buttons, navigation, content containers |
| Lifted | Color shift to slightly lighter neutral (`{colors.neutral-3}` to `{colors.primary}`) | Icon button backgrounds, subtle surface distinction |
| None | No shadow objects in design system | The system relies entirely on color and opacity for perceived depth |

**Shadow Philosophy:**
Spotify's elevation strategy is **color-blocking** rather than shadow-based. Depth is created through subtle shifts in the neutral gray and black palette (`{colors.canvas}` → `{colors.neutral-3}` → `{colors.primary}`), not through box-shadow. This keeps the interface flat, clean, and focused on content. No multi-level shadow ladder exists; the system is deliberately anti-skeuomorphic.

### Opacity Levels
- **70%** (opacity: 0.70): Used for normal interactive states.
- **30%** (opacity: 0.30): Used for disabled states and reduced visibility overlays.

Applied in transitions: hover states may reduce opacity to 0.6 (`rgb(0, 0, 0, 0.6)` for overlay gradients, or button hover opacity: 0.6).

### Z-index / Layering
- **base: 1–7** — Standard stacking for page content, overlaid elements within viewport.
- **sticky: 100** — Reserved for sticky headers, fixed navigation, and persistent UI chrome that should remain above scrolling content.

The system is flat; most interactive elements layer naturally without z-index collision.

## 7. Do's and Don'ts

### Do
- Use pill-shaped buttons (`{rounded.full}`) for all primary CTAs and interactive toggles; they are the signature Spotify affordance.
- Maintain pure white (`{colors.on-primary}` — `#FFFFFF`) for all primary headings and prominent text; it ensures clarity on the dark canvas.
- Apply `{colors.hairline}` (`#7C7C7C`) sparingly for dividers and subtle borders; it is the only hairline color in the system.
- Use the full spacing scale (`{spacing.xs}` to `{spacing.band}`) to create rhythm; tight spacing groups related content, large spacing separates concerns.
- Stack neutral colors to create depth through color-blocking; shift from `{colors.canvas}` to `{colors.neutral-3}` to `{colors.primary}` for perceived elevation.
- Keep text buttons transparent (`rgba(0, 0, 0, 0)` background) with `{colors.neutral-1}` (`#B3B3B3`) text; they are secondary and should not visually compete.
- Test hover states on all interactive elements; most shift color (to blues) or underline rather than scale or shadow.
- Ensure outline focus states are always `rgb(0, 0, 0)` solid 2px or 1px depending on component; hard outlines ensure accessibility.

### Don't
- Do **not** add drop shadows or blur effects to create depth; Spotify uses color only.
- Do **not** use the accent color (`{colors.accent-1}` — `#9E9EFF`) without a clear semantic role; it is decorative and unassigned.
- Do **not** apply rounded corners to input fields, modals, or navigation containers; keep them sharp (`{rounded.none}`).
- Do **not** use light colors or high opacity overlays on the canvas; the contrast between dark background and light text is critical.
- Do **not** scale buttons on hover; instead, change opacity (to 0.6) or shift text color and background color.
- Do **not** create a shadow hierarchy; flat cards and color-blocked surfaces are the rule.
- Do **not** add additional fonts beyond SpotifyMixUI and SpotifyMixUITitle; the system is intentionally minimal.
- Do **not** use letter-spacing adjustments; the fonts are metrically optimized and do not require tracking changes.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Column | Grid Columns | Section Padding X | Heading Size | Body Size | Nav Behavior |
|---|---|---|---|---|---|---|
| 375px (mobile) | 63px | 1 | `{spacing.lg}` (20px) | 20px | 16px | Fixed sidebar (331px) remains visible |
| 768px (tablet) | 16px | 1–2 | `{spacing.lg}` (20px) | 24px | 16px | Two-column layout active |
| 1024px (laptop) | 32px | 2 | `{spacing.lg}` (20px) | 24px | 16px | Full two-column layout |
| 1280px+ (desktop) | 32px | 2 | `{spacing.lg}` (20px) | 24px | 16px | Two-column layout locked |
| 1440px+ (large) | 48px | 2 | `{spacing.lg}` (20px) | 24px | 16px | Max content width stable |

**Key Changes:**
- Content column width (inner margins) shifts from 63px (375px) → 16px–48px (768px+).
- Heading size increases from 20px (375px) to 24px (768px+).
- Section padding remains constant at `{spacing.lg}` (20px) across all breakpoints.
- Grid columns remain 1–2 throughout; no mobile collapse occurs.
- Navigation remains fixed sidebar at 331px; no hamburger menu observed.

### Touch Targets
Minimum interactive size is **35px × 35px** (secondary icon buttons). Primary icon buttons are **48px × 48px**, and all text buttons maintain at least **32px height**. This exceeds the 44px iOS guideline and 48px Material Design guideline, except for the 35px small icon buttons; these should be spaced with `{spacing.md}` (16px) minimum between them for safe tapping.

### Collapsing Strategy
The layout does **not** collapse between breakpoints. The left sidebar remains fixed at 331px on all viewports, and main content scales horizontally. Horizontal scroll is employed for long content rows (trending songs, artists, albums) rather than stacking or wrapping. At 375px, the main content area narrows to ~63px of internal padding, but the overall two-column structure is maintained. No hamburger menu or bottom navigation appears; the interface is consistently two-column across all measured breakpoints.

## 9. Agent Prompt Guide

### Quick Color Reference

| Role | Token | Hex | Usage |
|---|---|---|---|
| Primary Canvas | `{colors.canvas}` | `#121212` | Default page background and primary surface |
| Primary Text / Heading | `{colors.on-primary}` | `#FFFFFF` | All headings and emphasis text |
| Primary Brand / CTA | `{colors.primary}` | `#292929` | Button fills, active states, brand marks |
| Secondary Text | `{colors.neutral-1}` | `#B3B3B3` | Navigation labels, footer links, secondary copy |
| Subtle Divider | `{colors.hairline}` | `#7C7C7C` | 1px borders, outline button default state |
| Accent Decorative | `{colors.accent-1}` | `#9E9EFF` | Unassigned; available for future use |
| Deep Surface | `{colors.neutral-3}` | `#1F1F1F` | Lifted background for buttons and containers |
| Pure Black | `{colors.neutral-2}` | `#000000` | Maximum contrast overlays and focus outlines |
| Mid-tone | `{colors.neutral-4}` | `#555555` | Secondary UI, muted text |

### Iteration Guide

1. **All buttons are pill-shaped** (`{rounded.full}` — 9999px). Use this affordance consistently for all interactive CTAs; it is the brand signature.

2. **Depth comes from color, not shadows.** Shift from `{colors.canvas}` (`#121212`) → `{colors.neutral-3}` (`#1F1F1F`) → `{colors.primary}` (`#292929`) to signal elevation. Never add `box-shadow`.

3. **Primary headings are always pure white** (`{colors.on-primary}` — `#FFFFFF`) at weight 700 in SpotifyMixUITitle. Body text is 16px weight 400 in SpotifyMixUI, also white or `{colors.neutral-1}` (`#B3B3B3`) for secondary roles.

4. **Outline buttons default to** `1px solid {colors.hairline}` (`#7C7C7C`) **and shift on hover to** `1px solid rgb(30, 174, 219)` **with matching background fill.** This is the primary interactive pattern.

5. **Text buttons remain transparent** (`rgba(0, 0, 0, 0)`) **with** `{colors.neutral-1}` **text; they underline on hover and do not change background.** Use for secondary actions.

6. **Icon buttons are** `48px × 48px` **with** `{spacing.sm}` **(12px) padding, background** `{colors.neutral-3}`, **and full white text.** Smaller variant is `35px × 35px` with `{spacing.xs}` (8px) padding and neutral gray text.

7. **Focus states are always** `2px solid rgb(0, 0, 0)` **outline; this is consistent across buttons, links, and inputs.** Ensure outline is hard (not blurred) for accessibility.

8. **Cards are transparent** (`rgba(0, 0, 0, 0)`) **with no shadow. Image containers within cards use** `{rounded.xs}` **(6px) radius; flat card variants use** `{rounded.none}` **(0px).**

9. **Spacing follows the scale:** `{spacing.xs}` (8px) for tight groupings, `{spacing.sm}` (12px) for card padding, `{spacing.md}` (16px) for standard margins, `{spacing.section}` (40px) for section breaks. Maintain rhythm across the page.

10. **Hover interactions shift text color (to blues) or apply opacity reduction (to 0.6).** Never scale, skew, or shadow-lift buttons on hover. Text underlines are common for links.

## 10. Known Gaps

- **Interaction states for disabled buttons:** The extraction recorded an opacity 0.8 disabled state for a generic "other" element, but no explicit disabled state CSS was captured for buttons or inputs. Disabled styling is inferred as opacity reduction but not verified across all component types.

- **Error, success, and warning colors:** The site does not expose a semantic status color ramp (red/green/yellow alerts). No error states, validation feedback, or toast notifications were measured. If these features exist behind authentication or on other pages, they are not documented here.

- **Dark mode / light mode variants:** Only one theme was measured (the dark theme visible on the homepage). The extraction marked no alternate theme as "derived" by the analysis tool. If a light mode or high-contrast mode exists, it was not captured.

- **Animation and transition timings:** No CSS animations, durations, or easing functions were extracted. Hover state color shifts are recorded, but the transition speed (e.g., 0.2s ease) is not documented.

- **Blur / backdrop-filter effects:** No `backdrop-filter` or `filter` properties were recorded, though decorative gradients and SVG noise patterns are used in hero sections. Exact blur radius or saturation values are not available.

- **Shadows and depth:** While 5 z-index layers were measured (base 1–7, sticky 100), no box-shadow values were extracted. The system is confirmed to use color-blocking only; no shadow ramp exists in the measured styles.

- **Responsive typography scaling:** Heading sizes shift from 20px (375px viewport) to 24px (768px+), but no intermediate breakpoint typography changes or fluid sizing were measured.

- **Grid column counts:** Exactly 1–2 columns were measured; no 3+ column layouts were observed in the measured pages. Expansion to multi-column grids on ultra-wide displays is not documented.

- **Cross-origin stylesheet coverage:** Some CSS from third-party libraries or external fonts may not have been fully captured due to cross-origin restrictions. Proprietary font fallbacks and any dynamically loaded styles are not reflected here.

- **Surfaces behind authentication:** The homepage and web player interface were analyzed, but authenticated content (user playlists, personal recommendations, account settings) was not visited. Styling for logged-in user surfaces may differ.

- **Accent color role:** `{colors.accent-1}` (`#9E9EFF`) was measured but has no observed semantic role in the captured pages. It is available for future use but currently unassigned.