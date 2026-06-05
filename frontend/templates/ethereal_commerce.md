---
name: Ethereal Commerce
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#dee0e2'
  on-secondary-container: '#606365'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#e1e2e4'
  secondary-fixed-dim: '#c5c6c8'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display-lg:
    fontFamily: Metropolis
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Metropolis
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Metropolis
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Metropolis
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 80px
---

## Brand & Style

The brand identity is rooted in **Modern Minimalism** with a focus on high-end luxury and technical precision. It targets a discerning audience that values clarity, exclusivity, and a seamless digital experience. 

The aesthetic is characterized by a "Quiet Luxury" approach: expansive whitespace, intentional typography, and a sophisticated interplay between solid surfaces and translucent glass layers. The emotional response should be one of calm confidence and premium reliability. We utilize **Glassmorphism** for navigational overlays and modals to maintain visual context, while **Skeuomorphic hints** (soft shadows) provide tactile affordance for interactive elements.

## Colors

The palette is anchored by a deep navy-black (`#111827`) used for primary text and structural foundations, ensuring high contrast and authority. Pure white and light gray (`#F3F4F6`) serve as the canvas, creating a sense of openness and breathability. 

Accents are used sparingly to preserve the luxury feel:
- **Accent Blue:** Reserved for primary actions, progress indicators, and links.
- **Accent Emerald:** Used exclusively for "success" states, price drops, or "In Stock" indicators.
- **Surface Tiers:** Use semi-transparent white (80-90% opacity) for glassmorphic layers to allow background colors to bleed through subtly.

## Typography

The system utilizes **Metropolis** (as a high-precision alternative to Poppins) for headings to provide a geometric, architectural feel. **Inter** is used for all body copy and UI labels to ensure maximum legibility and a systematic, clean look.

- **Headings:** Use tighter letter-spacing for large displays to maintain a premium "editorial" feel.
- **Body:** Use generous line-heights (1.5x+) to prevent visual fatigue during long browsing sessions.
- **Labels:** Uppercase labels with slight tracking are used for categories and metadata to create a distinct hierarchy from narrative text.

## Layout & Spacing

The design system employs a **Fixed Grid** on desktop (12 columns, 1280px max-width) and a **Fluid Grid** on mobile. The spacing rhythm is based on a 4px baseline, but defaults to large increments to emphasize the luxury "generosity" of space.

- **Desktop:** Large external margins (64px) push the focus to the center. Use 80px-120px vertical gaps between major homepage sections.
- **Tablet:** 8-column grid with 32px margins.
- **Mobile:** 4-column grid with 20px margins. Padding within cards should never drop below 16px.

## Elevation & Depth

Hierarchy is established through a combination of **Ambient Shadows** and **Glassmorphism**:

1.  **Level 0 (Base):** Light Gray (`#F3F4F6`) background.
2.  **Level 1 (Cards):** White background with a very soft, diffused shadow (`0px 4px 20px rgba(0,0,0,0.04)`). No borders.
3.  **Level 2 (Overlays/Modals):** Glassmorphic surfaces with a 12px backdrop blur and a 1px semi-transparent white inner stroke to define the edges.
4.  **Level 3 (Floating Actions):** Higher elevation shadows (`0px 10px 30px rgba(0,0,0,0.08)`) to indicate immediate interactivity.

## Shapes

The shape language is "Soft Professional." We avoid sharp corners to maintain approachability, but avoid overly rounded "pill" shapes to keep the aesthetic mature and refined.

- **Standard Elements:** (Inputs, Small Buttons) 0.25rem (4px).
- **Cards/Containers:** 0.5rem (8px).
- **Promotional Banners:** 0.75rem (12px).
- **Icons:** Use a 2px stroke weight with slightly rounded joins to match the UI components.

## Components

### Buttons
- **Primary:** Deep Navy (`#111827`) with white text. Hover state shifts background to a slightly lighter tint or adds a subtle glow.
- **Secondary:** White background with a 1px border of `#D1D5DB`. On hover, the background fills with `#F9FAFB`.
- **Text Buttons:** Subtle underline appears only on hover; use `label-caps` typography.

### Cards
Product cards use a clean white base with no border. The image should occupy the top 75% of the card. Text is left-aligned with the `body-md` for the product title and `headline-sm` for the price.

### Inputs & Refined Forms
Input fields use a light gray fill (`#F3F4F6`) with no border in their default state. On focus, they transition to a white background with a 1px Blue (`#3B82F6`) border and a soft blue outer glow.

### Mega-Menu
The navigation system uses a full-width glassmorphic dropdown. Categories are organized in columns using `label-caps` for headers and `body-sm` for links. Use a 20px backdrop blur to ensure content behind the menu doesn't distract the user.

### Chips/Badges
Small, 2px rounded corners. Use light tints of the accent colors (e.g., 10% opacity Emerald for "In Stock" tags) with full-saturation text for a sophisticated look.