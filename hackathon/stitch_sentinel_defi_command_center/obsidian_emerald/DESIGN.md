---
name: Obsidian Emerald
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#bec9c2'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#89938d'
  outline-variant: '#3f4944'
  surface-tint: '#88d6b6'
  primary: '#88d6b6'
  on-primary: '#003828'
  primary-container: '#529f82'
  on-primary-container: '#003122'
  inverse-primary: '#156b51'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#8292aa'
  on-tertiary-container: '#1a2b3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a4f3d1'
  primary-fixed-dim: '#88d6b6'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513c'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
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
  gutter: 16px
  margin: 24px
  container-padding: 12px
---

## Brand & Style

This design system is tailored for professional DeFi interfaces, focusing on a "Command Center" aesthetic that prioritizes high information density without visual fatigue. The brand personality is technical, precise, and authoritative. 

The style utilizes a **Refined Tactical** approach—a evolution of dark-mode minimalism that incorporates subtle glassmorphism and structural grid-based layouts. By moving away from high-saturation "neon" aesthetics toward a muted emerald palette, the UI maintains its cutting-edge feel while ensuring long-term legibility for power users monitoring complex data streams.

## Colors

The palette is anchored by a deep, ink-black neutral (`#0a0c10`) to provide maximum contrast for data visualization. The primary green is shifted to a muted Emerald (`#3d8b6f`), reducing eye strain while maintaining a clear "active" or "positive" state. 

- **Primary (Emerald):** Used for primary actions, success states, and critical data highlights.
- **Secondary (Slate):** Used for container backgrounds and secondary UI elements to provide depth.
- **Surface:** Uses varying opacities of the secondary color to create hierarchical layers.
- **Accent:** Subtle use of muted teals and slates to denote different asset classes or categories.

## Typography

The typography system relies on **Geist** for its neutral, technical clarity in prose and UI controls, and **JetBrains Mono** for data points, values, and technical labels. This pairing reinforces the "command center" feel, distinguishing between human-readable instructions and machine-calculated data.

- **Headlines:** Tight tracking and medium-to-semibold weights to command attention.
- **Data Labels:** Always in monospaced font to ensure tabular numbers align perfectly for easy scanning.
- **Scaling:** Mobile views drop headline sizes by 20% to accommodate smaller widths while maintaining the monospaced labels for readability.

## Layout & Spacing

This design system uses a **Fluid Tactical Grid**. The layout is designed to maximize screen real estate, utilizing a 12-column system with tight 16px gutters. 

- **Density:** High-density padding (12px on cards/containers) is standard to allow for more data visualization per screen.
- **Breakpoints:** 
  - Mobile (<768px): Single column, 16px margins.
  - Tablet (768px - 1280px): 8-column grid.
  - Desktop (>1280px): 12-column grid with fixed side-navigation and modular dashboard widgets.
- **Alignment:** All elements should snap to a 4px baseline grid to maintain the "engineered" precision of the system.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Base Layer:** The deepest neutral (`#0a0c10`).
- **Container Layer:** Semi-transparent slate (`#1e293b` at 60% opacity) with a subtle backdrop blur (12px).
- **Interactive Layer:** Solid slate or emerald outlines.
- **Borders:** Instead of shadows, use 1px inner strokes (borders) with low-opacity white (10%) to define edges. This creates a "glass-panel" effect suitable for a technical HUD.

## Shapes

The shape language is **Soft-Technical**. We use 4px (0.25rem) corner radii for standard components like input fields and buttons. This provides just enough softness to feel modern while maintaining the rigid, structural integrity required for a professional data environment. Large dashboard containers may use 8px (0.5rem) to differentiate them from smaller interactive controls.

## Components

- **Buttons:** Primary buttons use the muted Emerald background with white text. Secondary buttons are "Ghost" style with a 1px slate border and transparent background.
- **Input Fields:** Dark backgrounds (slightly lighter than the base) with 1px slate borders that turn Emerald on focus. Labels use the monospaced font.
- **Data Cards:** Utilize the glassmorphic style—semi-transparent background with a thin, light-gray top border to catch "simulated light."
- **Chips/Status:** For "Success" or "Up" trends, use a 10% opacity Emerald fill with solid Emerald text. Never use pure green/red neon; use the muted variations to keep the screen balanced.
- **Data Tables:** No vertical borders. Use horizontal dividers at 5% opacity. Header rows should use the `label-sm` monospaced font style in all caps.